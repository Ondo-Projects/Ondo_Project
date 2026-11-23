import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import {
  getCounselingPost,
  getTeacherCounselingPosts,
  replyCounselingPost,
  updateCounselingStatus,
} from '../../api/counseling.api';
import type { CounselingPost, CounselingStatus } from '../../api/types/counseling';
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  PageTitle,
  Panel,
  Skeleton,
  StatStrip,
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
import { getCounselingStatusLabel, getCounselingTypeLabel } from '../../student/counselingLabels';
import AttentionPanel from './AttentionPanel';
import { getAllowedStatusTransitions } from '../../teacher/teacherCounselingUtils';
import type { TeacherDashboardSummary } from '../../teacher/useTeacherDashboard';
import {
  COUNSEL_STATUS_TONE,
  type FeedbackHandlers,
  displayName,
  formatCompactDateTime,
  formatDayWithWeekday,
  resolveErrorMessage,
  scrollToDetailOnNarrow,
} from './shared';

type Filter = CounselingStatus | 'ALL';

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: 'ALL', label: '전체' },
  { value: 'WAITING', label: '대기' },
  { value: 'CONFIRMED', label: '확정' },
  { value: 'COMPLETED', label: '완료' },
  { value: 'CANCELLED', label: '취소' },
];

const TRANSITION_LABEL: Record<CounselingStatus, string> = {
  WAITING: '대기',
  CONFIRMED: '상담 확정',
  COMPLETED: '완료 처리',
  CANCELLED: '상담 취소',
};

const DETAIL_ID = 'counsel-detail';

interface CounselViewProps extends FeedbackHandlers {
  summary: TeacherDashboardSummary;
  prefetchedPosts: CounselingPost[] | null;
  postsLoaded: boolean;
  onDataChange: () => void;
  onOpenSuggestions: () => void;
}

export default function CounselView({
  summary,
  prefetchedPosts,
  postsLoaded,
  onDataChange,
  onOpenSuggestions,
  onSuccess,
  onError,
}: CounselViewProps) {
  const [posts, setPosts] = useState<CounselingPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<CounselingPost | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<CounselingStatus | null>(null);
  // 상담 상태가 바뀌면 '먼저 살펴볼 학생'도 다시 불러옵니다.
  const [attentionKey, setAttentionKey] = useState(0);

  // 처음에는 교사 홈 묶음 응답을 그대로 쓰고, 저장 후에는 목록만 다시 불러옵니다.
  useEffect(() => {
    if (postsLoaded) {
      setPosts(prefetchedPosts ?? []);
      setIsLoading(false);
    }
  }, [postsLoaded, prefetchedPosts]);

  const reloadPosts = useCallback(async () => {
    try {
      setPosts(await getTeacherCounselingPosts());
    } catch (error) {
      onError(resolveErrorMessage(error, '상담 목록을 불러오지 못했습니다.'));
    }
  }, [onError]);

  const counts = useMemo(() => {
    const result: Record<Filter, number> = { ALL: posts.length, WAITING: 0, CONFIRMED: 0, COMPLETED: 0, CANCELLED: 0 };
    posts.forEach((post) => {
      result[post.status] += 1;
    });
    return result;
  }, [posts]);

  const visiblePosts = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return posts.filter((post) => {
      if (filter !== 'ALL' && post.status !== filter) return false;
      if (!keyword) return true;
      return (
        post.title.toLowerCase().includes(keyword) ||
        displayName(post.studentName, post.studentUsername).toLowerCase().includes(keyword)
      );
    });
  }, [filter, posts, query]);

  async function openDetail(id: number) {
    setSelectedId(id);
    setIsDetailLoading(true);
    scrollToDetailOnNarrow(DETAIL_ID);
    try {
      const post = await getCounselingPost(id);
      setDetail(post);
      setReply(post.teacherReply ?? '');
      // 열람 처리로 미확인 건수가 바뀌므로 요약과 목록을 새로 고칩니다.
      setPosts((prev) => prev.map((item) => (item.id === id ? { ...item, readByTeacherAt: post.readByTeacherAt } : item)));
      onDataChange();
    } catch (error) {
      setSelectedId(null);
      setDetail(null);
      onError(resolveErrorMessage(error, '상담 내용을 불러오지 못했습니다.'));
    } finally {
      setIsDetailLoading(false);
    }
  }

  async function changeStatus(status: CounselingStatus) {
    if (!detail) return;
    if (status === 'CANCELLED' && !window.confirm('이 상담을 취소할까요? 학생에게 취소 상태로 보입니다.')) return;
    setUpdatingStatus(status);
    try {
      const post = await updateCounselingStatus(detail.id, status);
      setDetail(post);
      onSuccess(`상담을 '${getCounselingStatusLabel(post.status)}' 상태로 바꿨습니다.`);
      setAttentionKey((key) => key + 1);
      await reloadPosts();
      onDataChange();
    } catch (error) {
      onError(resolveErrorMessage(error, '상담 상태를 바꾸지 못했습니다.'));
    } finally {
      setUpdatingStatus(null);
    }
  }

  async function submitReply() {
    if (!detail) return;
    const text = reply.trim();
    if (!text) {
      onError('답변 내용을 입력해 주세요.');
      return;
    }
    setIsReplying(true);
    try {
      const post = await replyCounselingPost(detail.id, text);
      setDetail(post);
      onSuccess('답변을 등록했습니다. 학생 화면에 바로 보입니다.');
      await reloadPosts();
    } catch (error) {
      onError(resolveErrorMessage(error, '답변을 등록하지 못했습니다.'));
    } finally {
      setIsReplying(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageTitle title="상담" description="담당 학생이 신청한 상담을 확인하고 답변합니다." />

      <StatStrip
        items={[
          { label: '읽지 않은 상담', value: summary.unreadCount ?? '-', hint: '새 신청·학생 수정' },
          { label: '대기 중인 상담', value: summary.waitingCount ?? '-', hint: '확정 전 신청' },
          { label: '사전상담 미작성', value: summary.preCounselPendingCount ?? '-', hint: '담당 학생' },
          {
            label: '운영 건의',
            value: (
              <button type="button" onClick={onOpenSuggestions} className="hover:text-blue-700 hover:underline">
                {summary.suggestion.count}
              </button>
            ),
            hint: summary.suggestion.hint,
          },
        ]}
      />

      <AttentionPanel refreshKey={attentionKey} onOpenCounseling={(id) => void openDetail(id)} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <Tabs
              items={FILTERS.map((item) => ({ ...item, count: counts[item.value] }))}
              value={filter}
              onChange={setFilter}
              className="min-w-0 flex-1 overflow-x-auto"
            />
            <div className="relative w-full sm:w-56">
              <Search size={16} className="absolute top-1/2 left-2.5 -translate-y-1/2 text-gray-400" aria-hidden />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="학생 이름·제목 검색"
                aria-label="상담 검색"
                controlSize="sm"
                className="pl-8"
              />
            </div>
          </div>

          {isLoading ? (
            <TableSkeleton />
          ) : posts.length === 0 ? (
            <Panel>
              <EmptyState
                className="py-6"
                title="아직 들어온 상담이 없습니다"
                description="학생이 상담을 신청하면 여기에 표시됩니다. 학생 연결은 설정의 초대 코드로 할 수 있습니다."
              />
            </Panel>
          ) : (
            <Table footer={<span>{visiblePosts.length}건 표시 · 전체 {posts.length}건</span>}>
              <THead>
                <tr>
                  <Th>학생</Th>
                  <Th className="hidden md:table-cell">유형</Th>
                  <Th>제목</Th>
                  <Th className="hidden sm:table-cell">희망일</Th>
                  <Th>상태</Th>
                  <Th align="right" className="hidden md:table-cell">신청</Th>
                </tr>
              </THead>
              <TBody>
                {visiblePosts.length === 0 ? (
                  <tr>
                    <Td colSpan={6} muted className="h-16 text-center">
                      조건에 맞는 상담이 없습니다.
                    </Td>
                  </tr>
                ) : (
                  visiblePosts.map((post) => {
                    const unread = !post.readByTeacherAt;
                    return (
                      <Tr
                        key={post.id}
                        interactive
                        selected={post.id === selectedId}
                        onClick={() => openDetail(post.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            void openDetail(post.id);
                          }
                        }}
                        tabIndex={0}
                        aria-selected={post.id === selectedId}
                      >
                        <Td className="whitespace-nowrap">{displayName(post.studentName, post.studentUsername)}</Td>
                        <Td muted className="hidden whitespace-nowrap md:table-cell">
                          {getCounselingTypeLabel(post.counselingType)}
                        </Td>
                        <Td className="max-w-0 w-full">
                          <span className="flex items-center gap-1.5">
                            {unread ? (
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" aria-label="읽지 않음" />
                            ) : null}
                            <span className={cn('truncate', unread && 'font-semibold')}>{post.title}</span>
                          </span>
                        </Td>
                        <Td muted className="hidden whitespace-nowrap sm:table-cell">
                          {formatDayWithWeekday(post.desiredDate)}
                        </Td>
                        <Td>
                          <Badge tone={COUNSEL_STATUS_TONE[post.status]} dot>
                            {getCounselingStatusLabel(post.status)}
                          </Badge>
                        </Td>
                        <Td muted numeric className="hidden whitespace-nowrap md:table-cell">
                          {formatCompactDateTime(post.createdAt)}
                        </Td>
                      </Tr>
                    );
                  })
                )}
              </TBody>
            </Table>
          )}
        </div>

        <div id={DETAIL_ID} className={cn('scroll-mt-28 lg:sticky lg:top-20', !selectedId && 'hidden lg:block')}>
          {!selectedId ? (
            <Panel title="상담 내용">
              <EmptyState
                className="px-0 py-4"
                title="상담을 선택하세요"
                description="목록에서 상담을 누르면 내용과 답변 칸이 열립니다."
              />
            </Panel>
          ) : isDetailLoading || !detail ? (
            <Panel title="상담 내용">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-24 w-full" />
              </div>
            </Panel>
          ) : (
            <CounselDetail
              post={detail}
              reply={reply}
              onReplyChange={setReply}
              isReplying={isReplying}
              updatingStatus={updatingStatus}
              onSubmitReply={submitReply}
              onChangeStatus={changeStatus}
              onClose={() => {
                setSelectedId(null);
                setDetail(null);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function CounselDetail({
  post,
  reply,
  onReplyChange,
  isReplying,
  updatingStatus,
  onSubmitReply,
  onChangeStatus,
  onClose,
}: {
  post: CounselingPost;
  reply: string;
  onReplyChange: (value: string) => void;
  isReplying: boolean;
  updatingStatus: CounselingStatus | null;
  onSubmitReply: () => void;
  onChangeStatus: (status: CounselingStatus) => void;
  onClose: () => void;
}) {
  const transitions = getAllowedStatusTransitions(post.status);
  const replyDisabled = post.status === 'CANCELLED';

  return (
    <Panel
      title="상담 내용"
      actions={
        <Button size="sm" variant="ghost" onClick={onClose}>
          닫기
        </Button>
      }
      flush
    >
      <div className="flex flex-col gap-4 p-4">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-[15px] leading-snug font-semibold text-gray-900">{post.title}</h3>
            <Badge tone={COUNSEL_STATUS_TONE[post.status]} dot className="mt-0.5">
              {getCounselingStatusLabel(post.status)}
            </Badge>
          </div>
          <dl className="mt-3 grid grid-cols-[64px_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[13px]">
            <dt className="text-gray-500">학생</dt>
            <dd className="text-gray-900">{displayName(post.studentName, post.studentUsername)}</dd>
            <dt className="text-gray-500">유형</dt>
            <dd className="text-gray-900">{getCounselingTypeLabel(post.counselingType)}</dd>
            <dt className="text-gray-500">희망일</dt>
            <dd className="text-gray-900">{formatDayWithWeekday(post.desiredDate)}</dd>
            <dt className="text-gray-500">신청</dt>
            <dd className="text-gray-900 tabular-nums">{formatCompactDateTime(post.createdAt)}</dd>
          </dl>
        </div>

        <p className="rounded-md border border-gray-200 bg-gray-50/60 p-3 text-[13px] leading-relaxed whitespace-pre-wrap text-gray-900">
          {post.content}
        </p>

        {transitions.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {transitions.map((status) => (
              <Button
                key={status}
                size="sm"
                variant={status === 'CANCELLED' ? 'danger' : 'secondary'}
                loading={updatingStatus === status}
                disabled={updatingStatus !== null}
                onClick={() => onChangeStatus(status)}
              >
                {TRANSITION_LABEL[status]}
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-200 p-4">
        {post.teacherReply ? (
          <p className="text-xs text-gray-500">
            답변 등록 {formatCompactDateTime(post.repliedAt)} · 아래에서 고쳐서 다시 저장할 수 있습니다.
          </p>
        ) : null}
        <Field
          label="답변"
          hint={replyDisabled ? '취소된 상담에는 답변할 수 없습니다.' : '학생에게 그대로 보입니다.'}
        >
          <Textarea
            rows={5}
            value={reply}
            disabled={replyDisabled || isReplying}
            onChange={(event) => onReplyChange(event.target.value)}
            placeholder="학생에게 전할 답변을 적어 주세요."
          />
        </Field>
        <div className="flex justify-end">
          <Button variant="primary" loading={isReplying} disabled={replyDisabled} onClick={onSubmitReply}>
            {post.teacherReply ? '답변 수정' : '답변 등록'}
          </Button>
        </div>
      </div>
    </Panel>
  );
}

function TableSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3">
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} className="h-6 w-full" />
      ))}
    </div>
  );
}
