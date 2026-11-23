import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { MessageSquareReply, Search } from 'lucide-react';
import {
  getAdminSuggestion,
  replyAdminSuggestion,
  searchAdminSuggestions,
  updateAdminSuggestionStatus,
} from '../../api/admin.api';
import type { AdminPageResponse, AdminSuggestionSummary } from '../../api/types/admin';
import type { UserRole } from '../../api/types/auth';
import type { SuggestionCategory, SuggestionPost, SuggestionStatus } from '../../api/types/suggestion';
import { PAGE_SIZE, ROLE_LABELS } from '../../admin/constants';
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  PageTitle,
  Pagination,
  Panel,
  Select,
  Skeleton,
  TBody,
  THead,
  Table,
  Tabs,
  Td,
  Textarea,
  Th,
  Tr,
  cn,
} from '../../ds';
import {
  SUGGESTION_CATEGORY_OPTIONS,
  SUGGESTION_STATUS_LABELS,
  getSuggestionCategoryLabel,
  getSuggestionStatusLabel,
} from '../../student/suggestionLabels';
import { type FeedbackHandlers, formatCompactDateTime, resolveErrorMessage, scrollToDetailOnNarrow } from '../common';
import { SUGGESTION_STATUS_TONE } from '../teacher/shared';

type StatusFilter = SuggestionStatus | 'ALL';
const STATUSES: SuggestionStatus[] = ['OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED'];
const DETAIL_ID = 'admin-suggestion-detail';

interface SuggestionsViewProps extends FeedbackHandlers {
  onDataChange: () => void;
}

export default function SuggestionsView({ onSuccess, onError, onDataChange }: SuggestionsViewProps) {
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [category, setCategory] = useState<SuggestionCategory | ''>('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [data, setData] = useState<AdminPageResponse<AdminSuggestionSummary> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<SuggestionPost | null>(null);

  const load = useCallback(
    async (
      page: number,
      overrides: { status?: StatusFilter; category?: SuggestionCategory | ''; role?: UserRole | '' } = {},
    ) => {
      const nextStatus = overrides.status ?? status;
      setIsLoading(true);
      try {
        setData(
          await searchAdminSuggestions({
            keyword: keyword.trim() || undefined,
            status: nextStatus === 'ALL' ? '' : nextStatus,
            category: overrides.category ?? category,
            role: overrides.role ?? role,
            page,
            size: PAGE_SIZE,
          }),
        );
      } catch (error) {
        onError(resolveErrorMessage(error, '건의 목록을 불러오지 못했습니다.'));
      } finally {
        setIsLoading(false);
      }
    },
    [category, keyword, onError, role, status],
  );

  // 처음 들어오면 첫 페이지를 바로 불러옵니다. (검색 조건이 바뀔 때마다 다시 부르지 않도록 의존성 비움)
  useEffect(() => void load(0), []);

  async function open(id: number) {
    setSelectedId(id);
    setDetail(null);
    scrollToDetailOnNarrow(DETAIL_ID);
    try {
      setDetail(await getAdminSuggestion(id));
    } catch (error) {
      setSelectedId(null);
      onError(resolveErrorMessage(error, '건의 내용을 불러오지 못했습니다.'));
    }
  }

  function afterChange(post: SuggestionPost, message: string) {
    setDetail(post);
    onSuccess(message);
    onDataChange();
    void load(data?.page ?? 0);
  }

  return (
    <div className="flex flex-col gap-5">
      <PageTitle title="운영 건의" description="학생·교사가 남긴 오류 신고, 기능 요청, 운영 문의를 처리합니다." />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
        <div className="flex min-w-0 flex-col gap-3">
          <form
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              void load(0);
            }}
            className="flex flex-wrap items-center gap-2"
          >
            <div className="relative min-w-48 flex-1">
              <Search size={16} className="absolute top-1/2 left-2.5 -translate-y-1/2 text-gray-400" aria-hidden />
              <Input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="제목·내용 검색"
                aria-label="제목·내용 검색"
                controlSize="sm"
                className="pl-8"
              />
            </div>
            <div className="w-32 shrink-0">
              <Select
                value={category}
                aria-label="분류"
                controlSize="sm"
                onChange={(event) => {
                  const next = event.target.value as SuggestionCategory | '';
                  setCategory(next);
                  void load(0, { category: next });
                }}
              >
                <option value="">분류 전체</option>
                {SUGGESTION_CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="w-28 shrink-0">
              <Select
                value={role}
                aria-label="작성자"
                controlSize="sm"
                onChange={(event) => {
                  const next = event.target.value as UserRole | '';
                  setRole(next);
                  void load(0, { role: next });
                }}
              >
                <option value="">작성자 전체</option>
                <option value="STUDENT">학생</option>
                <option value="TEACHER">교사</option>
              </Select>
            </div>
            <Button type="submit" size="sm" loading={isLoading}>
              검색
            </Button>
          </form>

          <Tabs
            items={[
              { value: 'ALL' as StatusFilter, label: '전체' },
              ...STATUSES.map((value) => ({ value, label: SUGGESTION_STATUS_LABELS[value] })),
            ]}
            value={status}
            onChange={(next) => {
              setStatus(next);
              void load(0, { status: next });
            }}
          />

          {!data ? (
            <Skeleton className="h-64 w-full" />
          ) : data.items.length === 0 ? (
            <Panel>
              <EmptyState className="py-6" title="조건에 맞는 건의가 없습니다" />
            </Panel>
          ) : (
            <Table
              className={cn(isLoading && 'opacity-60')}
              footer={
                <Pagination
                  page={data.page}
                  size={data.size}
                  total={data.totalElements}
                  onChange={(page) => void load(page)}
                  disabled={isLoading}
                />
              }
            >
              <THead>
                <tr>
                  <Th>제목</Th>
                  <Th className="hidden md:table-cell">분류</Th>
                  <Th className="hidden sm:table-cell">작성자</Th>
                  <Th>상태</Th>
                  <Th align="right" className="hidden md:table-cell">
                    등록
                  </Th>
                </tr>
              </THead>
              <TBody>
                {data.items.map((item) => (
                  <Tr
                    key={item.id}
                    interactive
                    tabIndex={0}
                    selected={item.id === selectedId}
                    onClick={() => void open(item.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        void open(item.id);
                      }
                    }}
                  >
                    <Td className="max-w-0 w-full">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate">{item.title}</span>
                        {item.hasAdminReply ? (
                          <MessageSquareReply size={14} className="shrink-0 text-blue-700" aria-label="답변함" />
                        ) : null}
                      </span>
                    </Td>
                    <Td muted className="hidden whitespace-nowrap md:table-cell">
                      {getSuggestionCategoryLabel(item.category)}
                    </Td>
                    <Td muted className="hidden whitespace-nowrap sm:table-cell">
                      {item.authorName || item.authorUsername}
                      <span className="ml-1 text-xs text-gray-400">
                        {ROLE_LABELS[item.authorRole] ?? item.authorRole}
                      </span>
                    </Td>
                    <Td>
                      <Badge tone={SUGGESTION_STATUS_TONE[item.status]} dot>
                        {getSuggestionStatusLabel(item.status)}
                      </Badge>
                    </Td>
                    <Td muted numeric className="hidden whitespace-nowrap md:table-cell">
                      {formatCompactDateTime(item.createdAt)}
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </div>

        <div id={DETAIL_ID} className={cn('scroll-mt-28 lg:sticky lg:top-20', !selectedId && 'hidden lg:block')}>
          {!selectedId ? (
            <Panel title="건의 내용">
              <EmptyState
                className="px-0 py-4"
                title="건의를 선택하세요"
                description="목록에서 건의를 누르면 처리 메뉴가 열립니다."
              />
            </Panel>
          ) : !detail ? (
            <Panel title="건의 내용">
              <Skeleton className="h-32 w-full" />
            </Panel>
          ) : (
            <SuggestionDetail
              key={`${detail.id}-${detail.updatedAt}`}
              post={detail}
              onClose={() => setSelectedId(null)}
              onChanged={afterChange}
              onError={onError}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function SuggestionDetail({
  post,
  onClose,
  onChanged,
  onError,
}: {
  post: SuggestionPost;
  onClose: () => void;
  onChanged: (post: SuggestionPost, message: string) => void;
  onError: (message: string) => void;
}) {
  const [nextStatus, setNextStatus] = useState<SuggestionStatus>(post.status);
  const [reply, setReply] = useState(post.adminReply ?? '');
  const [busy, setBusy] = useState<'status' | 'reply' | null>(null);
  const closed = post.status === 'CLOSED';

  async function saveStatus() {
    if (nextStatus === post.status) return;
    if (nextStatus === 'CLOSED' && !window.confirm('종료하면 이 건의의 상태를 다시 바꿀 수 없습니다. 종료할까요?'))
      return;
    setBusy('status');
    try {
      const updated = await updateAdminSuggestionStatus(post.id, { status: nextStatus });
      onChanged(updated, `상태를 '${getSuggestionStatusLabel(updated.status)}'(으)로 바꿨습니다.`);
    } catch (error) {
      onError(resolveErrorMessage(error, '상태를 바꾸지 못했습니다.'));
    } finally {
      setBusy(null);
    }
  }

  async function saveReply() {
    const text = reply.trim();
    if (!text) {
      onError('답변 내용을 입력해 주세요.');
      return;
    }
    setBusy('reply');
    try {
      const updated = await replyAdminSuggestion(post.id, { reply: text });
      onChanged(
        updated,
        post.adminReply ? '답변을 수정했습니다.' : '답변을 등록했습니다. 작성자 화면에 바로 보입니다.',
      );
    } catch (error) {
      onError(resolveErrorMessage(error, '답변을 저장하지 못했습니다.'));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Panel
      title="건의 내용"
      actions={
        <Button size="sm" variant="ghost" onClick={onClose}>
          닫기
        </Button>
      }
      flush
    >
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[15px] leading-snug font-semibold text-gray-900">{post.title}</h3>
          <Badge tone={SUGGESTION_STATUS_TONE[post.status]} dot className="mt-0.5">
            {getSuggestionStatusLabel(post.status)}
          </Badge>
        </div>
        <p className="text-xs text-gray-500">
          {getSuggestionCategoryLabel(post.category)} · {post.authorName || post.authorUsername} (
          {ROLE_LABELS[post.authorRole as UserRole] ?? post.authorRole}) · {formatCompactDateTime(post.createdAt)}
        </p>
        <p className="rounded-md border border-gray-200 bg-gray-50/60 p-3 text-[13px] leading-relaxed whitespace-pre-wrap text-gray-900">
          {post.content}
        </p>
      </div>

      <div className="flex items-end gap-2 border-t border-gray-200 p-4">
        <Field
          label="처리 상태"
          className="flex-1"
          hint={closed ? '종료된 건의는 상태를 바꿀 수 없습니다.' : undefined}
        >
          <Select
            value={nextStatus}
            disabled={closed || busy !== null}
            onChange={(event) => setNextStatus(event.target.value as SuggestionStatus)}
          >
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {SUGGESTION_STATUS_LABELS[value]}
              </option>
            ))}
          </Select>
        </Field>
        {!closed ? (
          <Button
            loading={busy === 'status'}
            disabled={busy !== null || nextStatus === post.status}
            onClick={() => void saveStatus()}
          >
            변경
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-200 p-4">
        <Field
          label="운영팀 답변"
          hint={
            post.adminReply
              ? `${post.repliedByUsername ?? ''} · ${formatCompactDateTime(post.repliedAt)} 등록`
              : '작성자 화면에 그대로 보입니다.'
          }
        >
          <Textarea
            rows={5}
            maxLength={2000}
            value={reply}
            disabled={busy !== null}
            onChange={(event) => setReply(event.target.value)}
            placeholder="작성자에게 전할 답변을 적어 주세요."
          />
        </Field>
        <div className="flex justify-end">
          <Button
            variant="primary"
            loading={busy === 'reply'}
            disabled={busy !== null}
            onClick={() => void saveReply()}
          >
            {post.adminReply ? '답변 수정' : '답변 등록'}
          </Button>
        </div>
      </div>
    </Panel>
  );
}
