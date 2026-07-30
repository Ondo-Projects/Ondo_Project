import { type FormEvent, useCallback, useEffect, useState } from 'react';
import {
  createTeacherNotice,
  deleteTeacherNotice,
  getTeacherNotices,
} from '../../api/teacher.api';
import { ApiError } from '../../api/types/api-error';
import type { TeacherNotice } from '../../api/types/teacher';
import { TEACHER_SECTIONS } from '../constants';
import { formatDateTime } from '../teacherUtils';
import TeacherSectionCard from './TeacherSectionCard';

interface SectionNoticeBoardProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

interface NoticeFormState {
  title: string;
  content: string;
}

const EMPTY_NOTICE_FORM: NoticeFormState = {
  title: '',
  content: '',
};

export default function SectionNoticeBoard({ onSuccess, onError }: SectionNoticeBoardProps) {
  const [form, setForm] = useState<NoticeFormState>(EMPTY_NOTICE_FORM);
  const [notices, setNotices] = useState<TeacherNotice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadNotices = useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await getTeacherNotices();
      setNotices(data);
    } catch (error) {
      onError(resolveErrorMessage(error, '알림 목록을 불러오지 못했습니다.'));
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = form.title.trim();
    const content = form.content.trim();
    if (!title || !content) {
      onError('제목과 내용을 모두 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      await createTeacherNotice({ title, content });
      setForm(EMPTY_NOTICE_FORM);
      onSuccess('알림이 등록되었습니다.');
      await loadNotices();
    } catch (error) {
      onError(resolveErrorMessage(error, '알림을 등록하지 못했습니다.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (
      !window.confirm('이 알림을 삭제할까요? 학생 화면에서도 더 이상 보이지 않습니다.')
    ) {
      return;
    }

    setDeletingId(id);

    try {
      await deleteTeacherNotice(id);
      onSuccess('알림이 삭제되었습니다.');
      await loadNotices();
    } catch (error) {
      onError(resolveErrorMessage(error, '알림을 삭제하지 못했습니다.'));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <TeacherSectionCard
      title="5. 알림판"
      helper="담당 학생에게 공지할 내용을 작성해 주세요."
    >
      <form className="teacher-form" onSubmit={handleSubmit}>
        <div className="teacher-field">
          <label className="teacher-field__label" htmlFor="noticeTitle">
            제목
          </label>
          <input
            id="noticeTitle"
            className="teacher-field__input"
            type="text"
            maxLength={100}
            placeholder="알림 제목"
            disabled={isSubmitting}
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
          />
        </div>

        <div className="teacher-field">
          <label className="teacher-field__label" htmlFor="noticeContent">
            내용
          </label>
          <textarea
            id="noticeContent"
            className="teacher-field__textarea"
            placeholder="학생에게 전달할 내용을 작성해 주세요."
            disabled={isSubmitting}
            value={form.content}
            onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
          />
        </div>

        <div className="teacher-form-actions">
          <button
            type="submit"
            className="teacher-btn teacher-btn--primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? '등록 중…' : '알림 등록'}
          </button>
        </div>
      </form>

      <h3 className="teacher-subheading">등록된 알림</h3>

      {isLoading ? (
        <p className="teacher-status">불러오는 중…</p>
      ) : notices.length === 0 ? (
        <p id={TEACHER_SECTIONS.NOTICE_LIST} className="teacher-status">
          등록된 알림이 없습니다.
        </p>
      ) : (
        <div id={TEACHER_SECTIONS.NOTICE_LIST} className="teacher-notice-list">
          {notices.map((notice) => (
            <article key={notice.id} className="teacher-notice-item">
              <div className="teacher-notice-item__header">
                <h3 className="teacher-notice-item__title">{notice.title}</h3>
                <button
                  type="button"
                  className="teacher-btn teacher-btn--danger"
                  disabled={deletingId === notice.id}
                  onClick={() => handleDelete(notice.id)}
                >
                  {deletingId === notice.id ? '삭제 중…' : '삭제'}
                </button>
              </div>
              <p className="teacher-post-meta">{formatDateTime(notice.createdAt)}</p>
              <div className="teacher-notice-item__content">{notice.content}</div>
            </article>
          ))}
        </div>
      )}
    </TeacherSectionCard>
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
