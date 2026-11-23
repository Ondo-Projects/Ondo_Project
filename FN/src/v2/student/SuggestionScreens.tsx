import { type FormEvent, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { createSuggestion, deleteSuggestion, getSuggestion, updateSuggestion } from '../../api/suggestion.api';
import type { SuggestionCategory, SuggestionPost } from '../../api/types/suggestion';
import { Badge, Button, EmptyState, Field, Input, Select, Skeleton, Textarea } from '../../ds';
import {
  SUGGESTION_CATEGORY_OPTIONS,
  getSuggestionCategoryLabel,
  getSuggestionStatusLabel,
  isSuggestionOpen,
} from '../../student/suggestionLabels';
import { type FeedbackHandlers, formatCompactDateTime, resolveErrorMessage } from '../common';
import { SUGGESTION_STATUS_TONE } from '../teacher/shared';
import { Block, StickyFooter } from './ui';

interface SuggestionScreensProps extends FeedbackHandlers {
  sub: string[];
  suggestions: SuggestionPost[] | null;
  loaded: boolean;
  go: (hash: string) => void;
  reload: () => Promise<void>;
}

const BASE = '#me/suggestions';

export default function SuggestionScreens(props: SuggestionScreensProps) {
  const [first, second] = props.sub;
  if (first === 'new') return <SuggestionForm {...props} />;
  if (first && /^\d+$/.test(first))
    return <SuggestionDetail key={`${first}-${second}`} {...props} id={Number(first)} editing={second === 'edit'} />;
  return <SuggestionList {...props} />;
}

function SuggestionList({ suggestions, loaded, go }: SuggestionScreensProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-3 px-1 pt-1">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">운영 건의</h1>
          <p className="mt-0.5 text-[13px] text-gray-500">온도 운영팀에게만 보여요.</p>
        </div>
        <Button variant="primary" size="sm" icon={<Plus size={16} aria-hidden />} onClick={() => go(`${BASE}/new`)}>
          새 건의
        </Button>
      </div>
      <Block flush>
        {!loaded ? (
          <div className="p-4">
            <Skeleton className="h-12 w-full" />
          </div>
        ) : !suggestions || suggestions.length === 0 ? (
          <EmptyState
            title="아직 남긴 건의가 없어요"
            description="쓰다가 불편했던 점이나 있었으면 하는 기능을 알려 주세요."
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {suggestions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => go(`${BASE}/${item.id}`)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] text-gray-900">{item.title}</span>
                  <span className="mt-0.5 block text-xs text-gray-500">
                    {getSuggestionCategoryLabel(item.category)} · {formatCompactDateTime(item.createdAt)}
                    {item.adminReply ? ' · 답변 있음' : ''}
                  </span>
                </span>
                <Badge tone={SUGGESTION_STATUS_TONE[item.status]} dot className="mt-0.5">
                  {getSuggestionStatusLabel(item.status)}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </Block>
    </div>
  );
}

interface Values {
  category: SuggestionCategory | '';
  title: string;
  content: string;
}

function SuggestionForm({
  go,
  reload,
  onSuccess,
  onError,
  initial,
  editingId,
}: SuggestionScreensProps & { initial?: Values; editingId?: number }) {
  const [values, setValues] = useState<Values>(initial ?? { category: '', title: '', content: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const [busy, setBusy] = useState(false);

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = {
      category: values.category ? undefined : '분류를 골라 주세요.',
      title: values.title.trim() ? undefined : '제목을 적어 주세요.',
      content: values.content.trim() ? undefined : '내용을 적어 주세요.',
    };
    setErrors(next);
    if (next.category || next.title || next.content) return;
    setBusy(true);
    const body = {
      category: values.category as SuggestionCategory,
      title: values.title.trim(),
      content: values.content.trim(),
    };
    try {
      const saved = editingId ? await updateSuggestion(editingId, body) : await createSuggestion(body);
      onSuccess(editingId ? '건의를 고쳤어요.' : '건의를 보냈어요. 운영팀이 답변하면 여기에서 볼 수 있어요.');
      await reload();
      go(`${BASE}/${saved.id}`);
    } catch (error) {
      onError(resolveErrorMessage(error, editingId ? '건의를 고치지 못했습니다.' : '건의를 보내지 못했습니다.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <Block title={editingId ? '건의 고치기' : '새 건의'} footer="운영팀이 검토를 시작하면 고치거나 지울 수 없어요.">
        <div className="flex flex-col gap-4">
          <Field label="분류" required error={errors.category}>
            <Select
              value={values.category}
              disabled={busy}
              onChange={(event) => set('category', event.target.value as SuggestionCategory)}
            >
              <option value="">골라 주세요</option>
              {SUGGESTION_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="제목" required error={errors.title}>
            <Input
              value={values.title}
              maxLength={100}
              disabled={busy}
              placeholder="급식 메뉴가 안 보여요"
              onChange={(event) => set('title', event.target.value)}
            />
          </Field>
          <Field label="내용" required error={errors.content} hint={`${values.content.length}/2000`}>
            <Textarea
              rows={6}
              maxLength={2000}
              value={values.content}
              disabled={busy}
              placeholder="언제, 어떤 화면에서, 무엇이 불편했는지 적어 주세요."
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
            onClick={() => go(editingId ? `${BASE}/${editingId}` : BASE)}
          >
            취소
          </Button>
          <Button type="submit" variant="primary" className="flex-[2]" loading={busy}>
            {editingId ? '저장' : '보내기'}
          </Button>
        </div>
      </StickyFooter>
    </form>
  );
}

function SuggestionDetail(props: SuggestionScreensProps & { id: number; editing: boolean }) {
  const { id, editing, go, reload, onSuccess, onError } = props;
  const [post, setPost] = useState<SuggestionPost | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSuggestion(id)
      .then((data) => !cancelled && setPost(data))
      .catch((error) => {
        if (cancelled) return;
        onError(resolveErrorMessage(error, '건의를 불러오지 못했습니다.'));
        go(BASE);
      });
    return () => {
      cancelled = true;
    };
  }, [go, id, onError]);

  async function remove() {
    if (!post || !window.confirm('이 건의를 지울까요?')) return;
    setBusy(true);
    try {
      await deleteSuggestion(post.id);
      onSuccess('건의를 지웠어요.');
      await reload();
      go(BASE);
    } catch (error) {
      onError(resolveErrorMessage(error, '건의를 지우지 못했습니다.'));
    } finally {
      setBusy(false);
    }
  }

  if (!post) {
    return (
      <Block>
        <Skeleton className="h-24 w-full" />
      </Block>
    );
  }

  if (editing && isSuggestionOpen(post.status)) {
    return (
      <SuggestionForm
        {...props}
        editingId={post.id}
        initial={{ category: post.category, title: post.title, content: post.content }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Block>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-[17px] leading-snug font-semibold text-gray-900">{post.title}</h1>
          <Badge tone={SUGGESTION_STATUS_TONE[post.status]} dot className="mt-0.5">
            {getSuggestionStatusLabel(post.status)}
          </Badge>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          {getSuggestionCategoryLabel(post.category)} · {formatCompactDateTime(post.createdAt)}
        </p>
        <p className="mt-4 border-t border-gray-100 pt-4 text-sm leading-relaxed whitespace-pre-wrap text-gray-900">
          {post.content}
        </p>
      </Block>

      <Block title="운영팀 답변">
        {post.adminReply ? (
          <>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-900">{post.adminReply}</p>
            <p className="mt-2 text-xs text-gray-500 tabular-nums">{formatCompactDateTime(post.repliedAt)}</p>
          </>
        ) : (
          <p className="text-[13px] text-gray-500">아직 답변이 없어요.</p>
        )}
      </Block>

      {isSuggestionOpen(post.status) ? (
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" disabled={busy} onClick={() => go(`${BASE}/${post.id}/edit`)}>
            고치기
          </Button>
          <Button variant="danger" className="flex-1" loading={busy} onClick={() => void remove()}>
            지우기
          </Button>
        </div>
      ) : null}
    </div>
  );
}
