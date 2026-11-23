import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Pin, Plus } from 'lucide-react';
import {
  createAdminAnnouncement,
  deleteAdminAnnouncement,
  getAdminAnnouncement,
  getAdminAnnouncements,
  updateAdminAnnouncement,
} from '../../api/admin.api';
import type {
  AnnouncementAudience,
  AnnouncementDetail,
  AnnouncementPageResponse,
  AnnouncementStatus,
} from '../../api/types/announcement';
import { ANNOUNCEMENT_AUDIENCE_LABELS, ANNOUNCEMENT_AUDIENCE_OPTIONS, PAGE_SIZE } from '../../admin/constants';
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
  Td,
  Textarea,
  Th,
  Toggle,
  Tr,
  cn,
} from '../../ds';
import { type FeedbackHandlers, formatCompactDateTime, resolveErrorMessage, scrollToDetailOnNarrow } from '../common';

type Mode = { kind: 'none' } | { kind: 'create' } | { kind: 'edit'; id: number };

interface FormValues {
  title: string;
  content: string;
  audience: AnnouncementAudience;
  pinned: boolean;
  status: AnnouncementStatus;
}

const EMPTY: FormValues = { title: '', content: '', audience: 'ALL', pinned: false, status: 'PUBLISHED' };
const DETAIL_ID = 'admin-announcement-detail';

export default function AnnouncementsView({ onSuccess, onError }: FeedbackHandlers) {
  const [data, setData] = useState<AnnouncementPageResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<Mode>({ kind: 'none' });
  const [detail, setDetail] = useState<AnnouncementDetail | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    async (page: number) => {
      setIsLoading(true);
      try {
        setData(await getAdminAnnouncements(page, PAGE_SIZE));
      } catch (error) {
        onError(resolveErrorMessage(error, '공지 목록을 불러오지 못했습니다.'));
      } finally {
        setIsLoading(false);
      }
    },
    [onError],
  );

  useEffect(() => {
    void load(0);
  }, [load]);

  async function openEdit(id: number) {
    setMode({ kind: 'edit', id });
    setDetail(null);
    scrollToDetailOnNarrow(DETAIL_ID);
    try {
      setDetail(await getAdminAnnouncement(id));
    } catch (error) {
      setMode({ kind: 'none' });
      onError(resolveErrorMessage(error, '공지 내용을 불러오지 못했습니다.'));
    }
  }

  async function create(values: FormValues) {
    setBusy(true);
    try {
      const created = await createAdminAnnouncement({
        title: values.title.trim(),
        content: values.content.trim(),
        audience: values.audience,
      });
      // 고정은 등록 뒤에 따로 저장합니다 (등록 API 에는 고정 항목이 없음)
      if (values.pinned) await updateAdminAnnouncement(created.id, { pinned: true });
      onSuccess('공지를 게시했습니다. 공통 홈과 종 알림에 바로 보입니다.');
      setMode({ kind: 'none' });
      await load(0);
    } catch (error) {
      onError(resolveErrorMessage(error, '공지를 등록하지 못했습니다.'));
    } finally {
      setBusy(false);
    }
  }

  async function update(id: number, values: FormValues) {
    setBusy(true);
    try {
      const updated = await updateAdminAnnouncement(id, {
        title: values.title.trim(),
        content: values.content.trim(),
        audience: values.audience,
        pinned: values.pinned,
        status: values.status,
      });
      setDetail(updated);
      onSuccess('공지를 수정했습니다.');
      await load(data?.page ?? 0);
    } catch (error) {
      onError(resolveErrorMessage(error, '공지를 수정하지 못했습니다.'));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number, title: string) {
    if (
      !window.confirm(
        `'${title}' 공지를 삭제할까요? 모든 사용자 화면에서 사라지고 되돌릴 수 없습니다. 잠시 내리려면 '보관'을 쓰세요.`,
      )
    )
      return;
    setBusy(true);
    try {
      await deleteAdminAnnouncement(id);
      onSuccess('공지를 삭제했습니다.');
      setMode({ kind: 'none' });
      await load(data?.page ?? 0);
    } catch (error) {
      onError(resolveErrorMessage(error, '공지를 삭제하지 못했습니다.'));
    } finally {
      setBusy(false);
    }
  }

  const selectedId = mode.kind === 'edit' ? mode.id : null;

  return (
    <div className="flex flex-col gap-5">
      <PageTitle
        title="온도 공지"
        description="학생·교사 공통 홈과 상단 종 알림에 보이는 공지입니다."
        actions={
          <Button
            variant="primary"
            icon={<Plus size={16} aria-hidden />}
            onClick={() => {
              setMode({ kind: 'create' });
              scrollToDetailOnNarrow(DETAIL_ID);
            }}
          >
            새 공지
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
        {!data ? (
          <Skeleton className="h-64 w-full" />
        ) : data.items.length === 0 ? (
          <Panel>
            <EmptyState
              className="py-6"
              title="등록한 공지가 없습니다"
              description="점검 안내, 새 기능 소개처럼 모두에게 알릴 내용을 올려 보세요."
            />
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
                <Th className="hidden sm:table-cell">대상</Th>
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
                  onClick={() => void openEdit(item.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      void openEdit(item.id);
                    }
                  }}
                >
                  <Td className="max-w-0 w-full py-2">
                    <span className="flex items-center gap-1.5">
                      {item.pinned ? <Pin size={14} className="shrink-0 text-blue-700" aria-label="상단 고정" /> : null}
                      <span className={cn('truncate', item.status === 'ARCHIVED' && 'text-gray-500')}>
                        {item.title}
                      </span>
                    </span>
                    <span className="block truncate text-xs text-gray-500">{item.contentPreview}</span>
                  </Td>
                  <Td muted className="hidden whitespace-nowrap sm:table-cell">
                    {ANNOUNCEMENT_AUDIENCE_LABELS[item.audience]}
                  </Td>
                  <Td>{item.status === 'PUBLISHED' ? <Badge tone="success">게시</Badge> : <Badge>보관</Badge>}</Td>
                  <Td muted numeric className="hidden whitespace-nowrap md:table-cell">
                    {formatCompactDateTime(item.createdAt)}
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}

        <div
          id={DETAIL_ID}
          className={cn('scroll-mt-28 lg:sticky lg:top-20', mode.kind === 'none' && 'hidden lg:block')}
        >
          {mode.kind === 'none' ? (
            <Panel title="공지 편집">
              <EmptyState
                className="px-0 py-4"
                title="공지를 선택하세요"
                description="목록에서 고르거나 '새 공지'를 눌러 작성합니다."
              />
            </Panel>
          ) : mode.kind === 'create' ? (
            <AnnouncementForm
              key="create"
              title="새 공지"
              submitLabel="게시"
              initial={EMPTY}
              busy={busy}
              onCancel={() => setMode({ kind: 'none' })}
              onSubmit={create}
            />
          ) : !detail ? (
            <Panel title="공지 편집">
              <Skeleton className="h-48 w-full" />
            </Panel>
          ) : (
            <AnnouncementForm
              key={`${detail.id}-${detail.updatedAt}`}
              title="공지 편집"
              description={`${detail.adminName || detail.adminUsername} · ${formatCompactDateTime(detail.createdAt)} 등록`}
              submitLabel="저장"
              initial={{
                title: detail.title,
                content: detail.content,
                audience: detail.audience,
                pinned: detail.pinned,
                status: detail.status,
              }}
              busy={busy}
              editing
              onCancel={() => setMode({ kind: 'none' })}
              onSubmit={(values) => update(detail.id, values)}
              onDelete={() => void remove(detail.id, detail.title)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function AnnouncementForm({
  title,
  description,
  submitLabel,
  initial,
  busy,
  editing = false,
  onCancel,
  onSubmit,
  onDelete,
}: {
  title: string;
  description?: string;
  submitLabel: string;
  initial: FormValues;
  busy: boolean;
  editing?: boolean;
  onCancel: () => void;
  onSubmit: (values: FormValues) => void;
  onDelete?: () => void;
}) {
  const [values, setValues] = useState<FormValues>(initial);
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (key === 'title' || key === 'content') setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = {
      title: values.title.trim() ? undefined : '제목을 입력해 주세요.',
      content: values.content.trim() ? undefined : '내용을 입력해 주세요.',
    };
    setErrors(next);
    if (next.title || next.content) return;
    onSubmit(values);
  }

  return (
    <Panel title={title} description={description}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <Field label="제목" required error={errors.title}>
          <Input
            value={values.title}
            maxLength={100}
            disabled={busy}
            placeholder="12월 5일 새벽 서버 점검 안내"
            onChange={(event) => set('title', event.target.value)}
          />
        </Field>
        <div className={cn('grid gap-3', editing && 'grid-cols-2')}>
          <Field label="보여 줄 대상">
            <Select
              value={values.audience}
              disabled={busy}
              onChange={(event) => set('audience', event.target.value as AnnouncementAudience)}
            >
              {ANNOUNCEMENT_AUDIENCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          {editing ? (
            <Field label="상태">
              <Select
                value={values.status}
                disabled={busy}
                onChange={(event) => set('status', event.target.value as AnnouncementStatus)}
              >
                <option value="PUBLISHED">게시</option>
                <option value="ARCHIVED">보관 (숨김)</option>
              </Select>
            </Field>
          ) : null}
        </div>
        <Field label="내용" required error={errors.content}>
          <Textarea
            rows={8}
            value={values.content}
            disabled={busy}
            placeholder="공통 홈에 보일 내용을 적어 주세요."
            onChange={(event) => set('content', event.target.value)}
          />
        </Field>
        <div className="flex items-center justify-between gap-4 rounded-md border border-gray-200 px-3 py-2.5">
          <div>
            <p className="text-[13px] font-medium text-gray-900">상단 고정</p>
            <p className="text-xs text-gray-500">목록 맨 위에 계속 보입니다.</p>
          </div>
          <Toggle
            checked={values.pinned}
            onChange={(checked) => set('pinned', checked)}
            label="상단 고정"
            disabled={busy}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          {onDelete ? (
            <Button variant="danger" size="sm" disabled={busy} onClick={onDelete}>
              삭제
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-1.5">
            <Button variant="ghost" disabled={busy} onClick={onCancel}>
              취소
            </Button>
            <Button type="submit" variant="primary" loading={busy}>
              {submitLabel}
            </Button>
          </div>
        </div>
      </form>
    </Panel>
  );
}
