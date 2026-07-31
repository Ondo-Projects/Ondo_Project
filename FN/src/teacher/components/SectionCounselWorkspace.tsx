import { useCallback, useEffect, useState } from 'react';
import {
  getCounselingPost,
  getTeacherCounselingPosts,
  replyCounselingPost,
  updateCounselingStatus,
} from '../../api/counseling.api';
import { ApiError } from '../../api/types/api-error';
import type { CounselingPost, CounselingStatus } from '../../api/types/counseling';
import { Badge, Btn, Field, Textarea } from '../../components/ui';
import {
  getCounselingStatusBadgeVariant,
  getCounselingStatusLabel,
  getCounselingTypeLabel,
} from '../../student/counselingLabels';
import { formatScheduleDateShort } from '../../student/studentUtils';
import { TEACHER_SECTIONS } from '../constants';
import {
  COUNSEL_STATUS_FILTERS,
  getAllowedStatusTransitions,
  getStatusTransitionLabel,
} from '../teacherCounselingUtils';
import { formatDateTime, formatTeacherDisplay, scrollToTeacherSection } from '../teacherUtils';
import TeacherSectionCard from './TeacherSectionCard';

interface SectionCounselWorkspaceProps {
  prefetchedPosts: CounselingPost[] | null;
  postsLoaded: boolean;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onDataChange: () => void;
}

export default function SectionCounselWorkspace({
  prefetchedPosts,
  postsLoaded,
  onSuccess,
  onError,
  onDataChange,
}: SectionCounselWorkspaceProps) {
  const [statusFilter, setStatusFilter] = useState<CounselingStatus | ''>('');
  const [posts, setPosts] = useState<CounselingPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [detailPost, setDetailPost] = useState<CounselingPost | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<CounselingStatus | null>(null);

  const loadPosts = useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await getTeacherCounselingPosts(statusFilter || undefined);
      setPosts(data);
      return data;
    } catch (error) {
      onError(resolveErrorMessage(error, '상담 목록을 불러오지 못했습니다.'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [onError, statusFilter]);

  useEffect(() => {
    if (postsLoaded && statusFilter === '') {
      setPosts(prefetchedPosts ?? []);
      setIsLoading(false);
      return;
    }
    loadPosts();
  }, [loadPosts, postsLoaded, prefetchedPosts, statusFilter]);

  useEffect(() => {
    if (!selectedPostId || !posts.some((post) => post.id === selectedPostId)) {
      setDetailPost(null);
      setReplyContent('');
    }
  }, [posts, selectedPostId]);

  useEffect(() => {
    if (detailPost) {
      setReplyContent(detailPost.teacherReply || '');
    }
  }, [detailPost]);

  async function openDetail(id: number, scroll = true) {
    setSelectedPostId(id);
    setIsDetailLoading(true);

    try {
      const post = await getCounselingPost(id);
      setDetailPost(post);
      onDataChange();
      if (scroll && window.innerWidth < 900) {
        scrollToTeacherSection(TEACHER_SECTIONS.DETAIL_CARD);
      }
    } catch (error) {
      setSelectedPostId(null);
      setDetailPost(null);
      onError(resolveErrorMessage(error, '상담 상세를 불러오지 못했습니다.'));
    } finally {
      setIsDetailLoading(false);
    }
  }

  function closeDetail() {
    setSelectedPostId(null);
    setDetailPost(null);
    setReplyContent('');
  }

  async function handleFilterChange(nextFilter: CounselingStatus | '') {
    if (nextFilter === statusFilter) {
      return;
    }
    setStatusFilter(nextFilter);
    closeDetail();
  }

  async function handleStatusUpdate(id: number, status: CounselingStatus) {
    setUpdatingStatus(status);

    try {
      const post = await updateCounselingStatus(id, status);
      setDetailPost(post);
      onSuccess('상담 상태가 변경되었습니다.');
      await loadPosts();
    } catch (error) {
      onError(resolveErrorMessage(error, '상담 상태를 변경하지 못했습니다.'));
    } finally {
      setUpdatingStatus(null);
    }
  }

  async function handleReplySubmit() {
    if (!detailPost) {
      return;
    }

    const reply = replyContent.trim();
    if (!reply) {
      onError('답변 내용을 입력해 주세요.');
      return;
    }

    setIsSubmittingReply(true);

    try {
      const post = await replyCounselingPost(detailPost.id, reply);
      setDetailPost(post);
      onSuccess('답변이 등록되었습니다.');
      await loadPosts();
    } catch (error) {
      onError(resolveErrorMessage(error, '답변을 등록하지 못했습니다.'));
    } finally {
      setIsSubmittingReply(false);
    }
  }

  const showDetail = Boolean(detailPost || isDetailLoading);
  const isReplyDisabled = detailPost?.status === 'CANCELLED';
  const allowedStatuses = detailPost ? getAllowedStatusTransitions(detailPost.status) : [];

  return (
    <div
      className={`teacher-counsel-layout${showDetail ? ' teacher-counsel-layout--has-detail' : ''}`}
    >
      <TeacherSectionCard
        id={TEACHER_SECTIONS.POST_LIST}
        title="2. 상담 목록"
        helper="담당 학생의 상담 신청 목록과 상태 필터입니다."
      >
        <div className="teacher-filter-row" role="group" aria-label="상담 상태 필터">
          {COUNSEL_STATUS_FILTERS.map((option) => (
            <button
              key={option.label}
              type="button"
              className={`teacher-filter-chip${statusFilter === option.value ? ' is-active' : ''}`}
              aria-pressed={statusFilter === option.value}
              onClick={() => handleFilterChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="teacher-status">불러오는 중…</p>
        ) : posts.length === 0 ? (
          <p className="teacher-status">담당 학생의 상담이 없습니다.</p>
        ) : (
          <div className="teacher-post-list">
            {posts.map((post) => (
              <button
                key={post.id}
                type="button"
                className={`teacher-post-item${selectedPostId === post.id ? ' is-active' : ''}`}
                onClick={() => openDetail(post.id)}
              >
                <div className="teacher-post-item__header">
                  <h3 className="teacher-post-item__title">{post.title}</h3>
                  <Badge variant={getCounselingStatusBadgeVariant(post.status)}>
                    {getCounselingStatusLabel(post.status)}
                  </Badge>
                </div>
                <p className="teacher-post-item__meta">
                  {formatTeacherDisplay(post.studentName, post.studentUsername)} ·{' '}
                  {getCounselingTypeLabel(post.counselingType)} · 희망{' '}
                  {formatScheduleDateShort(post.desiredDate)}
                </p>
              </button>
            ))}
          </div>
        )}
      </TeacherSectionCard>

      {showDetail ? (
        <TeacherSectionCard id={TEACHER_SECTIONS.DETAIL_CARD} title="상담 상세" compact>
          <div className="teacher-detail-header">
            <Btn
              type="button"
              variant="secondary"
              size="student"
              className="teacher-detail-header__close"
              aria-label="상담 상세 닫기"
              onClick={closeDetail}
            >
              닫기
            </Btn>
          </div>

          {isDetailLoading || !detailPost ? (
            <p className="teacher-status">불러오는 중…</p>
          ) : (
            <>
              <div className="teacher-post-item__header teacher-detail-header-row">
                <h3 className="teacher-post-item__title">{detailPost.title}</h3>
                <Badge variant={getCounselingStatusBadgeVariant(detailPost.status)}>
                  {getCounselingStatusLabel(detailPost.status)}
                </Badge>
              </div>

              <p className="teacher-post-meta">
                학생: {formatTeacherDisplay(detailPost.studentName, detailPost.studentUsername)}
              </p>
              <p className="teacher-post-meta">
                상담 분류: {getCounselingTypeLabel(detailPost.counselingType)} · 희망{' '}
                {formatScheduleDateShort(detailPost.desiredDate)}
              </p>
              <p className="teacher-post-meta">
                작성: {formatDateTime(detailPost.createdAt)} · 열람:{' '}
                {formatDateTime(detailPost.readByTeacherAt)}
              </p>

              <div className="teacher-detail-content">{detailPost.content}</div>

              {detailPost.teacherReply ? (
                <div className="teacher-existing-reply">
                  <strong>등록된 답변</strong>
                  <p className="teacher-post-meta">{formatDateTime(detailPost.repliedAt)}</p>
                  <div className="teacher-detail-content teacher-detail-content--plain">
                    {detailPost.teacherReply}
                  </div>
                </div>
              ) : null}

              {allowedStatuses.length > 0 ? (
                <div className="teacher-form-actions teacher-detail-actions">
                  {allowedStatuses.map((status) => (
                    <Btn
                      key={status}
                      type="button"
                      variant="secondary"
                      size="student"
                      disabled={updatingStatus !== null}
                      onClick={() => handleStatusUpdate(detailPost.id, status)}
                    >
                      {updatingStatus === status
                        ? '변경 중…'
                        : getStatusTransitionLabel(status)}
                    </Btn>
                  ))}
                </div>
              ) : null}

              <div className="teacher-reply-box">
                <Field id="teacherReplyContent" label="교사 답변">
                  <Textarea
                    placeholder="학생에게 전달할 답변을 작성해 주세요."
                    disabled={isReplyDisabled || isSubmittingReply}
                    value={replyContent}
                    onChange={(event) => setReplyContent(event.target.value)}
                  />
                </Field>
                <div className="teacher-form-actions">
                  <Btn
                    type="button"
                    variant="primary"
                    size="student"
                    disabled={isReplyDisabled || isSubmittingReply}
                    onClick={handleReplySubmit}
                  >
                    {isSubmittingReply ? '등록 중…' : '답변 등록'}
                  </Btn>
                </div>
              </div>
            </>
          )}
        </TeacherSectionCard>
      ) : null}
    </div>
  );
}

function resolveErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
}
