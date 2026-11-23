import { type FormEvent, useEffect, useState } from 'react';
import { ClipboardList, Plus } from 'lucide-react';
import {
  createCounselingPost,
  deleteCounselingPost,
  getCounselingPost,
  updateCounselingPost,
} from '../../api/counseling.api';
import type { CounselingPost, CounselingType } from '../../api/types/counseling';
import type { PreCounselingProfile } from '../../api/types/student';
import { Badge, Button, EmptyState, Field, Input, ListRow, Select, Skeleton, Textarea } from '../../ds';
import HelpLines from './HelpLines';
import {
  COUNSELING_TYPE_OPTIONS,
  getCounselingStatusLabel,
  getCounselingTypeLabel,
  getTodayDateInputValue,
} from '../../student/counselingLabels';
import { type FeedbackHandlers, formatCompactDateTime, resolveErrorMessage } from '../common';
import { COUNSEL_STATUS_TONE } from '../teacher/shared';
import PreCounselForm from './PreCounselForm';
import { formatKoreanDay } from './shared';
import { Block, StickyFooter } from './ui';

interface CounselTabProps extends FeedbackHandlers {
  sub: string[];
  hasAssignment: boolean;
  posts: CounselingPost[] | null;
  preCounsel: PreCounselingProfile | null;
  loaded: boolean;
  go: (hash: string) => void;
  /** 저장·삭제 뒤 학생 홈 묶음 응답 다시 받기 */
  reload: () => Promise<void>;
}

export default function CounselTab(props: CounselTabProps) {
  const [first, second] = props.sub;
  if (first === 'new') return <CounselForm {...props} />;
  if (first === 'card') return <PreCounselForm {...props} profile={props.preCounsel} />;
  if (first && /^\d+$/.test(first)) {
    return <CounselDetail key={first} id={Number(first)} editing={second === 'edit'} {...props} />;
  }
  return <CounselList {...props} />;
}

function CounselList({ hasAssignment, posts, preCounsel, loaded, go }: CounselTabProps) {
  const done = preCounsel?.completed ?? false;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-3 px-1 pt-1">
        <h1 className="text-xl font-semibold tracking-tight text-gray-900">상담</h1>
        {hasAssignment ? (
          <Button variant="primary" size="sm" icon={<Plus size={16} aria-hidden />} onClick={() => go('#counsel/new')}>
            상담 신청
          </Button>
        ) : null}
      </div>

      {!hasAssignment ? (
        <Block>
          <p className="text-sm font-medium text-gray-900">담임 선생님과 연결하면 상담을 신청할 수 있어요</p>
          <Button size="sm" className="mt-3" onClick={() => go('#me/teacher')}>
            초대 코드 입력
          </Button>
        </Block>
      ) : (
        <Block flush footer="상담 전에 선생님이 나를 미리 알 수 있도록 한 번만 작성하면 돼요.">
          <ListRow
            icon={<ClipboardList size={18} />}
            label="사전상담 카드"
            value={
              !loaded ? undefined : done ? (
                <Badge tone="success">작성 완료</Badge>
              ) : (
                <span className="text-[13px] font-medium text-blue-700">작성하기</span>
              )
            }
            onClick={() => go('#counsel/card')}
          />
        </Block>
      )}

      <Block title="내 상담" flush>
        {!loaded ? (
          <div className="flex flex-col gap-2 p-4">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-1/2" />
          </div>
        ) : !posts || posts.length === 0 ? (
          <EmptyState
            title="아직 신청한 상담이 없어요"
            description={hasAssignment ? '진로, 친구, 공부, 가족 이야기 무엇이든 괜찮아요.' : undefined}
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {posts.map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => go(`#counsel/${post.id}`)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-gray-50"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] text-gray-900">{post.title}</span>
                  <span className="mt-0.5 block text-xs text-gray-500">
                    {getCounselingTypeLabel(post.counselingType)} · 희망 {formatKoreanDay(post.desiredDate)}
                    {post.teacherReply ? ' · 답변 있음' : ''}
                  </span>
                </span>
                <Badge tone={COUNSEL_STATUS_TONE[post.status]} dot className="mt-0.5">
                  {getCounselingStatusLabel(post.status)}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </Block>
    </div>
  );
}

interface CounselValues {
  title: string;
  counselingType: CounselingType | '';
  desiredDate: string;
  content: string;
}

function CounselForm({
  initial,
  editingId,
  hasAssignment,
  go,
  reload,
  onSuccess,
  onError,
}: CounselTabProps & { initial?: CounselValues; editingId?: number }) {
  const [values, setValues] = useState<CounselValues>(
    initial ?? { title: '', counselingType: '', desiredDate: getTodayDateInputValue(), content: '' },
  );
  const [errors, setErrors] = useState<Partial<Record<keyof CounselValues, string>>>({});
  const [busy, setBusy] = useState(false);

  function set<K extends keyof CounselValues>(key: K, value: CounselValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = {
      title: values.title.trim() ? undefined : '제목을 적어 주세요.',
      counselingType: values.counselingType ? undefined : '어떤 상담인지 골라 주세요.',
      desiredDate: values.desiredDate ? undefined : '날짜를 골라 주세요.',
      content: values.content.trim() ? undefined : '상담하고 싶은 내용을 적어 주세요.',
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    setBusy(true);
    const body = {
      title: values.title.trim(),
      counselingType: values.counselingType as CounselingType,
      desiredDate: values.desiredDate,
      content: values.content.trim(),
    };
    try {
      if (editingId) {
        await updateCounselingPost(editingId, body);
        onSuccess('상담 내용을 고쳤어요.');
        await reload();
        go(`#counsel/${editingId}`);
      } else {
        const created = await createCounselingPost(body);
        onSuccess('상담을 신청했어요. 선생님이 확인하면 상태가 바뀌어요.');
        await reload();
        go(`#counsel/${created.id}`);
      }
    } catch (error) {
      onError(resolveErrorMessage(error, editingId ? '상담 내용을 고치지 못했습니다.' : '상담을 신청하지 못했습니다.'));
    } finally {
      setBusy(false);
    }
  }

  if (!hasAssignment) {
    return (
      <Block>
        <p className="text-sm text-gray-900">담임 선생님과 연결한 뒤에 상담을 신청할 수 있어요.</p>
        <Button size="sm" className="mt-3" onClick={() => go('#me/teacher')}>
          초대 코드 입력
        </Button>
      </Block>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Block footer="선생님만 볼 수 있어요. 선생님이 확정하기 전까지는 고치거나 지울 수 있어요.">
        <div className="flex flex-col gap-4">
          <Field label="어떤 상담인가요?" required error={errors.counselingType}>
            <Select
              value={values.counselingType}
              disabled={busy}
              onChange={(event) => set('counselingType', event.target.value as CounselingType)}
            >
              <option value="">골라 주세요</option>
              {COUNSELING_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          {values.counselingType === 'SCHOOL_VIOLENCE' ? (
            <HelpLines
              title="학교폭력은 117에서도 바로 신고·상담할 수 있어요."
              first="117"
              description="선생님 답변은 늦을 수 있어요. 지금 위험하거나 급하다면 기다리지 말고 바로 연락하세요."
            />
          ) : values.counselingType === 'EMOTIONAL' ? (
            <HelpLines
              title="급하게 이야기할 곳이 필요하면 바로 연락하세요."
              description="선생님 답변은 늦을 수 있어요. 지금 많이 힘들다면 기다리지 말고 아래로 연락해도 돼요."
            />
          ) : null}
          <Field label="제목" required error={errors.title}>
            <Input
              value={values.title}
              maxLength={100}
              disabled={busy}
              placeholder="진로 선택이 고민돼요"
              onChange={(event) => set('title', event.target.value)}
            />
          </Field>
          <Field label="상담 받고 싶은 날" required error={errors.desiredDate}>
            <Input
              type="date"
              min={getTodayDateInputValue()}
              value={values.desiredDate}
              disabled={busy}
              onChange={(event) => set('desiredDate', event.target.value)}
            />
          </Field>
          <Field label="하고 싶은 이야기" required error={errors.content}>
            <Textarea
              rows={7}
              value={values.content}
              disabled={busy}
              placeholder="지금 어떤 점이 고민인지 편하게 적어 주세요."
              onChange={(event) => set('content', event.target.value)}
            />
          </Field>
        </div>
      </Block>
      <StickyFooter>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            disabled={busy}
            onClick={() => go(editingId ? `#counsel/${editingId}` : '#counsel')}
          >
            취소
          </Button>
          <Button type="submit" variant="primary" className="flex-[2]" loading={busy}>
            {editingId ? '저장' : '신청하기'}
          </Button>
        </div>
      </StickyFooter>
    </form>
  );
}

function CounselDetail(props: CounselTabProps & { id: number; editing: boolean }) {
  const { id, editing, go, reload, onSuccess, onError } = props;
  const [post, setPost] = useState<CounselingPost | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCounselingPost(id)
      .then((data) => !cancelled && setPost(data))
      .catch((error) => {
        if (cancelled) return;
        onError(resolveErrorMessage(error, '상담을 불러오지 못했습니다.'));
        go('#counsel');
      });
    return () => {
      cancelled = true;
    };
  }, [go, id, onError, editing]);

  async function remove() {
    if (!post || !window.confirm('이 상담 신청을 지울까요? 지우면 되돌릴 수 없어요.')) return;
    setDeleting(true);
    try {
      await deleteCounselingPost(post.id);
      onSuccess('상담 신청을 지웠어요.');
      await reload();
      go('#counsel');
    } catch (error) {
      onError(resolveErrorMessage(error, '상담 신청을 지우지 못했습니다.'));
    } finally {
      setDeleting(false);
    }
  }

  if (!post) {
    return (
      <Block>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-20 w-full" />
        </div>
      </Block>
    );
  }

  if (editing) {
    if (post.status !== 'WAITING') {
      return (
        <Block>
          <p className="text-sm text-gray-900">선생님이 확정한 상담은 고칠 수 없어요.</p>
        </Block>
      );
    }
    return (
      <CounselForm
        {...props}
        editingId={post.id}
        initial={{
          title: post.title,
          counselingType: post.counselingType,
          desiredDate: post.desiredDate,
          content: post.content,
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Block>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-[17px] leading-snug font-semibold text-gray-900">{post.title}</h1>
          <Badge tone={COUNSEL_STATUS_TONE[post.status]} dot className="mt-0.5">
            {getCounselingStatusLabel(post.status)}
          </Badge>
        </div>
        <dl className="mt-3 grid grid-cols-[64px_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[13px]">
          <dt className="text-gray-500">선생님</dt>
          <dd className="text-gray-900">{post.teacherName || post.teacherUsername}</dd>
          <dt className="text-gray-500">종류</dt>
          <dd className="text-gray-900">{getCounselingTypeLabel(post.counselingType)}</dd>
          <dt className="text-gray-500">희망일</dt>
          <dd className="text-gray-900">{formatKoreanDay(post.desiredDate)}</dd>
          <dt className="text-gray-500">신청</dt>
          <dd className="text-gray-900 tabular-nums">{formatCompactDateTime(post.createdAt)}</dd>
        </dl>
        <p className="mt-4 border-t border-gray-100 pt-4 text-sm leading-relaxed whitespace-pre-wrap text-gray-900">
          {post.content}
        </p>
      </Block>

      <Block title="선생님 답변">
        {post.teacherReply ? (
          <>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-900">{post.teacherReply}</p>
            <p className="mt-2 text-xs text-gray-500 tabular-nums">{formatCompactDateTime(post.repliedAt)}</p>
          </>
        ) : (
          <p className="text-[13px] text-gray-500">아직 답변이 없어요. 답변이 오면 여기에 보여요.</p>
        )}
      </Block>

      {post.status === 'WAITING' ? (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            disabled={deleting}
            onClick={() => go(`#counsel/${post.id}/edit`)}
          >
            고치기
          </Button>
          <Button variant="danger" className="flex-1" loading={deleting} onClick={() => void remove()}>
            지우기
          </Button>
        </div>
      ) : null}
    </div>
  );
}
