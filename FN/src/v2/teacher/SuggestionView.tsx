import { type FormEvent, useEffect, useState } from 'react';
import { MessageSquareReply, Plus } from 'lucide-react';
import {
  createTeacherSuggestion,
  deleteTeacherSuggestion,
  getTeacherSuggestion,
  getTeacherSuggestions,
  updateTeacherSuggestion,
} from '../../api/teacher.api';
import type { SuggestionCategory, SuggestionPost } from '../../api/types/suggestion';
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  PageTitle,
  Panel,
  Select,
  Skeleton,
  TBody,
  THead,
  Table,
  Td,
  Textarea,
  Th,
  Tr,
  cn,
} from '../../ds';
import {
  SUGGESTION_CATEGORY_OPTIONS,
  getSuggestionCategoryLabel,
  getSuggestionStatusLabel,
  isSuggestionOpen,
} from '../../teacher/teacherSuggestionUtils';
import {
  type FeedbackHandlers,
  SUGGESTION_STATUS_TONE,
  formatCompactDateTime,
  resolveErrorMessage,
  scrollToDetailOnNarrow,
} from './shared';

type Mode = { kind: 'none' } | { kind: 'create' } | { kind: 'detail'; id: number } | { kind: 'edit'; post: SuggestionPost };

interface FormValues {
  category: SuggestionCategory | '';
  title: string;
  content: string;
}

const EMPTY_FORM: FormValues = { category: '', title: '', content: '' };
const DETAIL_ID = 'suggestion-detail';

interface SuggestionViewProps extends FeedbackHandlers {
  prefetched: SuggestionPost[] | null;
  loaded: boolean;
  onDataChange: () => void;
}

export default function SuggestionView({ prefetched, loaded, onDataChange, onSuccess, onError }: SuggestionViewProps) {
  const [items, setItems] = useState<SuggestionPost[]>([]);
  const [mode, setMode] = useState<Mode>({ kind: 'none' });
  const [detail, setDetail] = useState<SuggestionPost | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (loaded) setItems(prefetched ?? []);
  }, [loaded, prefetched]);

  async function reload() {
    try {
      setItems(await getTeacherSuggestions());
      onDataChange();
    } catch (error) {
      onError(resolveErrorMessage(error, '건의 목록을 불러오지 못했습니다.'));
    }
  }

  async function openDetail(id: number) {
    setMode({ kind: 'detail', id });
    setDetail(null);
    scrollToDetailOnNarrow(DETAIL_ID);
    try {
      setDetail(await getTeacherSuggestion(id));
    } catch (error) {
      setMode({ kind: 'none' });
      onError(resolveErrorMessage(error, '건의 내용을 불러오지 못했습니다.'));
    }
  }

  async function handleCreate(values: FormValues) {
    setIsBusy(true);
    try {
      const created = await createTeacherSuggestion({
        category: values.category as SuggestionCategory,
        title: values.title.trim(),
        content: values.content.trim(),
      });
      onSuccess('건의를 등록했습니다. 운영팀이 확인하면 답변이 달립니다.');
      await reload();
      await openDetail(created.id);
    } catch (error) {
      onError(resolveErrorMessage(error, '건의를 등록하지 못했습니다.'));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleUpdate(post: SuggestionPost, values: FormValues) {
    setIsBusy(true);
    try {
      await updateTeacherSuggestion(post.id, {
        category: values.category as SuggestionCategory,
        title: values.title.trim(),
        content: values.content.trim(),
      });
      onSuccess('건의를 수정했습니다.');
      await reload();
      await openDetail(post.id);
    } catch (error) {
      onError(resolveErrorMessage(error, '건의를 수정하지 못했습니다.'));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDelete(post: SuggestionPost) {
    if (!window.confirm(`'${post.title}' 건의를 삭제할까요?`)) return;
    setIsBusy(true);
    try {
      await deleteTeacherSuggestion(post.id);
      onSuccess('건의를 삭제했습니다.');
      setMode({ kind: 'none' });
      await reload();
    } catch (error) {
      onError(resolveErrorMessage(error, '건의를 삭제하지 못했습니다.'));
    } finally {
      setIsBusy(false);
    }
  }

  const selectedId = mode.kind === 'detail' ? mode.id : mode.kind === 'edit' ? mode.post.id : null;

  return (
    <div className="flex flex-col gap-5">
      <PageTitle
        title="운영 건의"
        description="오류, 기능 요청, 운영 문의를 온도 운영팀에 남깁니다. 관리자만 볼 수 있습니다."
        actions={
          <Button
            variant="primary"
            icon={<Plus size={16} aria-hidden />}
            onClick={() => {
              setMode({ kind: 'create' });
              scrollToDetailOnNarrow(DETAIL_ID);
            }}
          >
            새 건의
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
        {!loaded ? (
          <Skeleton className="h-48 w-full" />
        ) : items.length === 0 ? (
          <Panel>
            <EmptyState
              className="py-6"
              title="아직 남긴 건의가 없습니다"
              description="쓰면서 불편했던 점이나 필요한 기능을 알려 주세요."
            />
          </Panel>
        ) : (
          <Table footer={<span>{items.length}건</span>}>
            <THead>
              <tr>
                <Th>제목</Th>
                <Th className="hidden sm:table-cell">분류</Th>
                <Th>상태</Th>
                <Th align="right" className="hidden md:table-cell">등록</Th>
              </tr>
            </THead>
            <TBody>
              {items.map((item) => (
                <Tr
                  key={item.id}
                  interactive
                  tabIndex={0}
                  selected={item.id === selectedId}
                  onClick={() => void openDetail(item.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      void openDetail(item.id);
                    }
                  }}
                >
                  <Td className="max-w-0 w-full">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate">{item.title}</span>
                      {item.adminReply ? (
                        <MessageSquareReply size={14} className="shrink-0 text-blue-700" aria-label="답변 있음" />
                      ) : null}
                    </span>
                  </Td>
                  <Td muted className="hidden whitespace-nowrap sm:table-cell">
                    {getSuggestionCategoryLabel(item.category)}
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

        <div id={DETAIL_ID} className={cn('scroll-mt-28 lg:sticky lg:top-20', mode.kind === 'none' && 'hidden lg:block')}>
          {mode.kind === 'none' ? (
            <Panel title="건의 내용">
              <EmptyState className="px-0 py-4" title="건의를 선택하세요" description="목록에서 고르거나 '새 건의'를 눌러 작성합니다." />
            </Panel>
          ) : mode.kind === 'create' ? (
            <SuggestionForm
              title="새 건의"
              submitLabel="건의 등록"
              initial={EMPTY_FORM}
              busy={isBusy}
              onCancel={() => setMode({ kind: 'none' })}
              onSubmit={handleCreate}
            />
          ) : mode.kind === 'edit' ? (
            <SuggestionForm
              title="건의 수정"
              submitLabel="저장"
              initial={{ category: mode.post.category, title: mode.post.title, content: mode.post.content }}
              busy={isBusy}
              onCancel={() => void openDetail(mode.post.id)}
              onSubmit={(values) => handleUpdate(mode.post, values)}
            />
          ) : !detail ? (
            <Panel title="건의 내용">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-20 w-full" />
              </div>
            </Panel>
          ) : (
            <Panel
              title="건의 내용"
              actions={
                <Button size="sm" variant="ghost" onClick={() => setMode({ kind: 'none' })}>
                  닫기
                </Button>
              }
              flush
            >
              <div className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-[15px] leading-snug font-semibold text-gray-900">{detail.title}</h3>
                  <Badge tone={SUGGESTION_STATUS_TONE[detail.status]} dot className="mt-0.5">
                    {getSuggestionStatusLabel(detail.status)}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">
                  {getSuggestionCategoryLabel(detail.category)} · 등록 {formatCompactDateTime(detail.createdAt)}
                  {detail.updatedAt !== detail.createdAt ? ` · 수정 ${formatCompactDateTime(detail.updatedAt)}` : ''}
                </p>
                <p className="rounded-md border border-gray-200 bg-gray-50/60 p-3 text-[13px] leading-relaxed whitespace-pre-wrap text-gray-900">
                  {detail.content}
                </p>
                {isSuggestionOpen(detail.status) ? (
                  <div className="flex gap-1.5">
                    <Button size="sm" disabled={isBusy} onClick={() => setMode({ kind: 'edit', post: detail })}>
                      수정
                    </Button>
                    <Button size="sm" variant="danger" loading={isBusy} onClick={() => void handleDelete(detail)}>
                      삭제
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">검토가 시작된 건의는 고치거나 지울 수 없습니다.</p>
                )}
              </div>
              <div className="border-t border-gray-200 p-4">
                <h4 className="text-xs font-semibold text-gray-500">운영팀 답변</h4>
                {detail.adminReply ? (
                  <>
                    <p className="mt-2 text-[13px] leading-relaxed whitespace-pre-wrap text-gray-900">{detail.adminReply}</p>
                    <p className="mt-2 text-xs text-gray-500 tabular-nums">{formatCompactDateTime(detail.repliedAt)}</p>
                  </>
                ) : (
                  <p className="mt-2 text-[13px] text-gray-500">아직 답변이 없습니다.</p>
                )}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function SuggestionForm({
  title,
  submitLabel,
  initial,
  busy,
  onCancel,
  onSubmit,
}: {
  title: string;
  submitLabel: string;
  initial: FormValues;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (values: FormValues) => void;
}) {
  const [values, setValues] = useState<FormValues>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = {
      category: values.category ? undefined : '분류를 골라 주세요.',
      title: values.title.trim() ? undefined : '제목을 입력해 주세요.',
      content: values.content.trim() ? undefined : '내용을 입력해 주세요.',
    };
    setErrors(next);
    if (next.category || next.title || next.content) return;
    onSubmit(values);
  }

  return (
    <Panel title={title}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <Field label="분류" required error={errors.category}>
          <Select
            value={values.category}
            disabled={busy}
            onChange={(event) => update('category', event.target.value as SuggestionCategory)}
          >
            <option value="">선택해 주세요</option>
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
            placeholder="상담 목록에서 검색이 안 돼요"
            onChange={(event) => update('title', event.target.value)}
          />
        </Field>
        <Field label="내용" required error={errors.content} hint={`${values.content.length}/2000`}>
          <Textarea
            rows={6}
            value={values.content}
            maxLength={2000}
            disabled={busy}
            placeholder="어떤 상황에서 무엇이 불편했는지 적어 주세요."
            onChange={(event) => update('content', event.target.value)}
          />
        </Field>
        <div className="flex justify-end gap-1.5">
          <Button variant="ghost" disabled={busy} onClick={onCancel}>
            취소
          </Button>
          <Button type="submit" variant="primary" loading={busy}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
