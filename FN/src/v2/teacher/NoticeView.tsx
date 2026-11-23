import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { createTeacherNotice, deleteTeacherNotice, getTeacherNotices } from '../../api/teacher.api';
import type { TeacherNotice } from '../../api/types/teacher';
import { Button, EmptyState, Field, Input, PageTitle, Panel, Skeleton, Textarea } from '../../ds';
import { type FeedbackHandlers, formatCompactDateTime, resolveErrorMessage } from './shared';

export default function NoticeView({ onSuccess, onError }: FeedbackHandlers) {
  const [notices, setNotices] = useState<TeacherNotice[] | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setNotices(await getTeacherNotices());
    } catch (error) {
      setNotices([]);
      onError(resolveErrorMessage(error, '공지 목록을 불러오지 못했습니다.'));
    }
  }, [onError]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = {
      title: title.trim() ? undefined : '제목을 입력해 주세요.',
      content: content.trim() ? undefined : '내용을 입력해 주세요.',
    };
    setErrors(nextErrors);
    if (nextErrors.title || nextErrors.content) return;

    setIsSubmitting(true);
    try {
      await createTeacherNotice({ title: title.trim(), content: content.trim() });
      setTitle('');
      setContent('');
      onSuccess('공지를 등록했습니다. 담당 학생 화면에 바로 보입니다.');
      await load();
    } catch (error) {
      onError(resolveErrorMessage(error, '공지를 등록하지 못했습니다.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(notice: TeacherNotice) {
    if (!window.confirm(`'${notice.title}' 공지를 삭제할까요? 학생 화면에서도 사라집니다.`)) return;
    setDeletingId(notice.id);
    try {
      await deleteTeacherNotice(notice.id);
      onSuccess('공지를 삭제했습니다.');
      await load();
    } catch (error) {
      onError(resolveErrorMessage(error, '공지를 삭제하지 못했습니다.'));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageTitle title="학급 공지" description="담당 학생 모두에게 보이는 공지입니다." />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
        <Panel title="새 공지" className="lg:sticky lg:top-20">
          <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
            <Field label="제목" required error={errors.title}>
              <Input
                value={title}
                maxLength={100}
                disabled={isSubmitting}
                placeholder="12월 2일 체육복 지참"
                onChange={(event) => {
                  setTitle(event.target.value);
                  if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
                }}
              />
            </Field>
            <Field label="내용" required error={errors.content}>
              <Textarea
                rows={6}
                value={content}
                disabled={isSubmitting}
                placeholder="학생들에게 전할 내용을 적어 주세요."
                onChange={(event) => {
                  setContent(event.target.value);
                  if (errors.content) setErrors((prev) => ({ ...prev, content: undefined }));
                }}
              />
            </Field>
            <div className="flex justify-end">
              <Button type="submit" variant="primary" loading={isSubmitting}>
                공지 등록
              </Button>
            </div>
          </form>
        </Panel>

        <Panel title="등록한 공지" description={notices ? `${notices.length}건` : undefined} flush>
          {!notices ? (
            <div className="flex flex-col gap-2 p-4">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : notices.length === 0 ? (
            <EmptyState title="등록한 공지가 없습니다" description="준비물, 일정 변경처럼 학급 전체에 알릴 내용을 남겨 보세요." />
          ) : (
            <ul className="divide-y divide-gray-100">
              {notices.map((notice) => (
                <li key={notice.id} className="flex gap-3 px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <h3 className="text-sm font-semibold text-gray-900">{notice.title}</h3>
                      <span className="text-xs text-gray-500 tabular-nums">{formatCompactDateTime(notice.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed whitespace-pre-wrap text-gray-600">{notice.content}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Trash2 size={16} aria-hidden />}
                    loading={deletingId === notice.id}
                    onClick={() => void handleDelete(notice)}
                    aria-label={`${notice.title} 공지 삭제`}
                    className="text-gray-500 hover:text-red-700"
                  />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
