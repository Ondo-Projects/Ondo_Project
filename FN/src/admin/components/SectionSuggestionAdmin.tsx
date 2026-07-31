import { useCallback, useState } from 'react';

import {
  getAdminSuggestion,
  replyAdminSuggestion,
  searchAdminSuggestions,
  updateAdminSuggestionStatus,
} from '../../api/admin.api';
import type { AdminPageResponse, AdminSuggestionSummary } from '../../api/types/admin';
import type { UserRole } from '../../api/types/auth';
import { ApiError } from '../../api/types/api-error';
import type { SuggestionCategory, SuggestionPost, SuggestionStatus } from '../../api/types/suggestion';
import { Badge, Btn, Field, Input, Select, Textarea } from '../../components/ui';
import {
  ADMIN_SECTIONS,
  PAGE_SIZE,
  SUGGESTION_CATEGORY_FILTER_OPTIONS,
  SUGGESTION_ROLE_FILTER_OPTIONS,
  SUGGESTION_STATUS_FILTER_OPTIONS,
} from '../constants';
import { formatDateTime, getRoleBadgeVariant, getRoleLabel, resolveErrorMessage } from '../adminUtils';
import {
  getSuggestionCategoryLabel,
  getSuggestionStatusBadgeVariant,
  getSuggestionStatusLabel,
} from '../../student/suggestionLabels';
import AdminFilterChips from './AdminFilterChips';
import AdminPager from './AdminPager';
import AdminSectionCard from './AdminSectionCard';

interface SectionSuggestionAdminProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onDataChange: () => void;
}

function isSuggestionClosed(post: SuggestionPost | null): boolean {
  return post?.status === 'CLOSED';
}

export default function SectionSuggestionAdmin({
  onSuccess,
  onError,
  onDataChange,
}: SectionSuggestionAdminProps) {
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<SuggestionStatus | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<SuggestionCategory | ''>('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState<AdminPageResponse<AdminSuggestionSummary> | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailPost, setDetailPost] = useState<SuggestionPost | null>(null);
  const [statusValue, setStatusValue] = useState<SuggestionStatus>('OPEN');
  const [replyContent, setReplyContent] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const loadSuggestions = useCallback(
    async (nextPage = page) => {
      setIsSearching(true);
      try {
        const response = await searchAdminSuggestions({
          keyword: keyword.trim() || undefined,
          status: statusFilter,
          category: categoryFilter,
          role: roleFilter,
          page: nextPage,
          size: PAGE_SIZE,
        });
        setPageData(response);
        setPage(nextPage);
        if (selectedId && !response.items.some((item) => item.id === selectedId)) {
          setSelectedId(null);
          setDetailPost(null);
        }
      } catch (error) {
        onError(
          error instanceof ApiError
            ? error.message
            : resolveErrorMessage(error, '운영 건의 목록을 불러오지 못했습니다.'),
        );
      } finally {
        setIsSearching(false);
      }
    },
    [keyword, statusFilter, categoryFilter, roleFilter, page, selectedId, onError],
  );

  const openDetail = useCallback(
    async (id: number) => {
      setIsUpdating(true);
      try {
        const post = await getAdminSuggestion(id);
        setSelectedId(id);
        setDetailPost(post);
        setStatusValue(post.status);
        setReplyContent(post.adminReply ?? '');
      } catch (error) {
        onError(
          error instanceof ApiError
            ? error.message
            : resolveErrorMessage(error, '건의 상세를 불러오지 못했습니다.'),
        );
      } finally {
        setIsUpdating(false);
      }
    },
    [onError],
  );

  function closeDetail() {
    setSelectedId(null);
    setDetailPost(null);
    setReplyContent('');
  }

  async function handleStatusUpdate() {
    if (!selectedId || !detailPost) {
      onError('건의를 먼저 선택해 주세요.');
      return;
    }
    if (isSuggestionClosed(detailPost)) {
      onError('종료된 건의는 상태를 변경할 수 없습니다.');
      return;
    }
    if (statusValue === detailPost.status) {
      onError('변경할 상태를 선택해 주세요.');
      return;
    }
    setIsUpdating(true);
    try {
      const post = await updateAdminSuggestionStatus(selectedId, { status: statusValue });
      setDetailPost(post);
      setStatusValue(post.status);
      onSuccess('건의 상태를 변경했습니다.');
      onDataChange();
      await loadSuggestions(page);
    } catch (error) {
      onError(
        error instanceof ApiError
          ? error.message
          : resolveErrorMessage(error, '건의 상태 변경에 실패했습니다.'),
      );
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleReplySubmit() {
    if (!selectedId) {
      onError('건의를 먼저 선택해 주세요.');
      return;
    }
    const reply = replyContent.trim();
    if (!reply) {
      onError('답변 내용을 입력해 주세요.');
      return;
    }
    setIsUpdating(true);
    try {
      const post = await replyAdminSuggestion(selectedId, { reply });
      setDetailPost(post);
      setReplyContent(post.adminReply ?? '');
      onSuccess('관리자 답변을 등록했습니다.');
      onDataChange();
      await loadSuggestions(page);
    } catch (error) {
      onError(
        error instanceof ApiError
          ? error.message
          : resolveErrorMessage(error, '관리자 답변 등록에 실패했습니다.'),
      );
    } finally {
      setIsUpdating(false);
    }
  }

  const closed = isSuggestionClosed(detailPost);

  return (
    <AdminSectionCard
      id={ADMIN_SECTIONS.SUGGESTION}
      title="7. 운영 건의"
      helper="학생·교사가 남긴 운영 건의를 조회하고 상태 변경·관리자 답변을 처리합니다."
    >
      <Field id="admin-suggestion-keyword" label="제목·내용">
        <Input
          type="text"
          placeholder="검색어"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
      </Field>

      <AdminFilterChips
        ariaLabel="건의 상태 필터"
        options={SUGGESTION_STATUS_FILTER_OPTIONS}
        value={statusFilter}
        onChange={setStatusFilter}
      />
      <AdminFilterChips
        ariaLabel="건의 분류 필터"
        options={SUGGESTION_CATEGORY_FILTER_OPTIONS}
        value={categoryFilter}
        onChange={setCategoryFilter}
      />
      <AdminFilterChips
        ariaLabel="건의 작성자 역할 필터"
        options={SUGGESTION_ROLE_FILTER_OPTIONS}
        value={roleFilter}
        onChange={setRoleFilter}
      />

      <div className="admin-search-actions">
        <Btn
          type="button"
          variant="primary"
          size="student"
          disabled={isSearching}
          onClick={() => void loadSuggestions(0)}
        >
          검색
        </Btn>
      </div>

      {!pageData ? (
        <p className="admin-status">검색 버튼을 눌러 건의 목록을 조회하세요.</p>
      ) : pageData.items.length === 0 ? (
        <p className="admin-status">검색 결과가 없습니다.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>분류</th>
                <th>제목</th>
                <th>상태</th>
                <th>작성자</th>
                <th>역할</th>
                <th>등록일</th>
                <th>답변</th>
              </tr>
            </thead>
            <tbody>
              {pageData.items.map((item) => (
                <tr
                  key={item.id}
                  className={`admin-suggestion-row${selectedId === item.id ? ' admin-suggestion-row--active' : ''}`}
                  tabIndex={0}
                  role="button"
                  aria-label="건의 상세 보기"
                  onClick={() => void openDetail(item.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      void openDetail(item.id);
                    }
                  }}
                >
                  <td data-label="ID">{item.id}</td>
                  <td data-label="분류">
                    <Badge variant="neutral">{getSuggestionCategoryLabel(item.category)}</Badge>
                  </td>
                  <td data-label="제목" className="admin-suggestion-title">
                    {item.title}
                  </td>
                  <td data-label="상태">
                    <Badge variant={getSuggestionStatusBadgeVariant(item.status)}>
                      {getSuggestionStatusLabel(item.status)}
                    </Badge>
                  </td>
                  <td data-label="작성자">{item.authorName || item.authorUsername}</td>
                  <td data-label="역할">
                    <Badge variant={getRoleBadgeVariant(item.authorRole)}>
                      {getRoleLabel(item.authorRole)}
                    </Badge>
                  </td>
                  <td data-label="등록일">{formatDateTime(item.createdAt)}</td>
                  <td data-label="답변">
                    <Badge variant={item.hasAdminReply ? 'completed' : 'neutral'}>
                      {item.hasAdminReply ? '완료' : '없음'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminPager pageData={pageData} onPageChange={(nextPage) => void loadSuggestions(nextPage)} />

      {detailPost ? (
        <div className="admin-detail-panel" id="adminSuggestionDetail">
          <div className="admin-detail-panel__header">
            <h3 className="admin-detail-panel__title">건의 상세</h3>
            <Btn type="button" variant="secondary" size="student" onClick={closeDetail}>
              닫기
            </Btn>
          </div>

          <div className="admin-suggestion-detail__header">
            <h4 className="admin-suggestion-detail__title">{detailPost.title}</h4>
            <div className="admin-suggestion-detail__badges">
              <Badge variant="neutral">{getSuggestionCategoryLabel(detailPost.category)}</Badge>
              <Badge variant={getSuggestionStatusBadgeVariant(detailPost.status)}>
                {getSuggestionStatusLabel(detailPost.status)}
              </Badge>
            </div>
          </div>

          <p className="admin-detail-meta">
            작성자 {detailPost.authorName || detailPost.authorUsername} ({detailPost.authorUsername})
            · {getRoleLabel(detailPost.authorRole as UserRole)} · 등록{' '}
            {formatDateTime(detailPost.createdAt)}
            {detailPost.updatedAt && detailPost.updatedAt !== detailPost.createdAt
              ? ` · 수정 ${formatDateTime(detailPost.updatedAt)}`
              : ''}
          </p>
          <div className="admin-detail-content">{detailPost.content}</div>

          <div className="admin-management-box">
            <h3 className="admin-subtitle admin-subtitle--flush">상태 변경</h3>
            <div className="admin-inline-actions">
              <Field id="admin-suggestion-status" label="처리 상태" className="admin-field--inline">
                <Select
                  disabled={closed || isUpdating}
                  value={statusValue}
                  onChange={(event) => setStatusValue(event.target.value as SuggestionStatus)}
                >
                  <option value="OPEN">접수</option>
                  <option value="IN_REVIEW">검토 중</option>
                  <option value="RESOLVED">처리 완료</option>
                  <option value="CLOSED">종료</option>
                </Select>
              </Field>
              <Btn
                type="button"
                variant="primary"
                size="student"
                disabled={closed || isUpdating}
                onClick={() => void handleStatusUpdate()}
              >
                상태 변경
              </Btn>
            </div>
            {closed ? (
              <p className="admin-helper">종료된 건의는 상태를 더 이상 변경할 수 없습니다.</p>
            ) : null}
          </div>

          <div className="admin-reply-box">
            {detailPost.adminReply ? (
              <div className="admin-existing-reply">
                <div className="admin-existing-reply__label">등록된 관리자 답변</div>
                <p className="admin-detail-meta">
                  {detailPost.repliedByUsername ? `${detailPost.repliedByUsername} · ` : ''}
                  {formatDateTime(detailPost.repliedAt)}
                </p>
                <div>{detailPost.adminReply}</div>
              </div>
            ) : null}
            <Field id="admin-suggestion-reply" label="관리자 답변">
              <Textarea
                maxLength={2000}
                value={replyContent}
                placeholder="건의자에게 전달할 답변을 작성해 주세요."
                onChange={(event) => setReplyContent(event.target.value)}
              />
            </Field>
            <div className="admin-inline-actions admin-inline-actions--spaced">
              <Btn
                type="button"
                variant="primary"
                size="student"
                disabled={isUpdating}
                onClick={() => void handleReplySubmit()}
              >
                {detailPost.adminReply ? '답변 수정' : '답변 등록'}
              </Btn>
            </div>
          </div>
        </div>
      ) : null}
    </AdminSectionCard>
  );
}
