import { type FormEvent, useCallback, useEffect, useState } from 'react';

import {
  createAdminAnnouncement,
  deleteAdminAnnouncement,
  getAdminAnnouncements,
} from '../../api/admin.api';
import type { AnnouncementAudience, AnnouncementSummary } from '../../api/types/announcement';
import { ApiError } from '../../api/types/api-error';
import { ADMIN_SECTIONS, ANNOUNCEMENT_AUDIENCE_LABELS, ANNOUNCEMENT_AUDIENCE_OPTIONS } from '../constants';
import { formatDateTime, resolveErrorMessage } from '../adminUtils';
import AdminSectionCard from './AdminSectionCard';

interface SectionAnnouncementAdminProps {
  refreshToken: number;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

interface AnnouncementFormState {
  title: string;
  content: string;
  audience: AnnouncementAudience;
}

const EMPTY_FORM: AnnouncementFormState = {
  title: '',
  content: '',
  audience: 'ALL',
};

export default function SectionAnnouncementAdmin({
  refreshToken,
  onSuccess,
  onError,
}: SectionAnnouncementAdminProps) {
  const [form, setForm] = useState<AnnouncementFormState>(EMPTY_FORM);
  const [announcements, setAnnouncements] = useState<AnnouncementSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadAnnouncements = useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await getAdminAnnouncements(0, 50);
      setAnnouncements(data.items);
    } catch (error) {
      onError(
        error instanceof ApiError
          ? error.message
          : resolveErrorMessage(error, '플랫폼 공지 목록을 불러오지 못했습니다.'),
      );
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    void loadAnnouncements();
  }, [loadAnnouncements, refreshToken]);

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
      await createAdminAnnouncement({
        title,
        content,
        audience: form.audience,
      });
      setForm(EMPTY_FORM);
      onSuccess('플랫폼 공지를 등록했습니다.');
      await loadAnnouncements();
    } catch (error) {
      onError(
        error instanceof ApiError
          ? error.message
          : resolveErrorMessage(error, '플랫폼 공지를 등록하지 못했습니다.'),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (
      !window.confirm(
        '이 공지를 삭제할까요? 공통 홈과 해당 대상 사용자 화면에서 더 이상 보이지 않습니다.',
      )
    ) {
      return;
    }

    setDeletingId(id);

    try {
      await deleteAdminAnnouncement(id);
      onSuccess('플랫폼 공지를 삭제했습니다.');
      await loadAnnouncements();
    } catch (error) {
      onError(
        error instanceof ApiError
          ? error.message
          : resolveErrorMessage(error, '플랫폼 공지를 삭제하지 못했습니다.'),
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AdminSectionCard
      id={ADMIN_SECTIONS.ANNOUNCEMENT}
      title="8. 플랫폼 공지"
      helper="학생·교사 공통 홈에 표시할 플랫폼 전체 공지를 작성합니다."
    >
      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="admin-field">
          <label htmlFor="admin-announcement-title">제목</label>
          <input
            id="admin-announcement-title"
            type="text"
            maxLength={100}
            placeholder="공지 제목"
            disabled={isSubmitting}
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
          />
        </div>

        <div className="admin-field">
          <label htmlFor="admin-announcement-audience">대상</label>
          <select
            id="admin-announcement-audience"
            disabled={isSubmitting}
            value={form.audience}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                audience: event.target.value as AnnouncementAudience,
              }))
            }
          >
            {ANNOUNCEMENT_AUDIENCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-field">
          <label htmlFor="admin-announcement-content">내용</label>
          <textarea
            id="admin-announcement-content"
            placeholder="공통 홈에 표시할 내용을 작성해 주세요."
            disabled={isSubmitting}
            value={form.content}
            onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
          />
        </div>

        <div className="admin-search-actions">
          <button
            type="submit"
            className="admin-btn admin-btn--primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? '등록 중…' : '공지 등록'}
          </button>
        </div>
      </form>

      <h3 className="admin-subtitle admin-subtitle--flush">등록된 공지</h3>

      {isLoading ? (
        <p className="admin-status">불러오는 중…</p>
      ) : announcements.length === 0 ? (
        <p className="admin-status">등록된 플랫폼 공지가 없습니다.</p>
      ) : (
        <div className="admin-announcement-list">
          {announcements.map((announcement) => (
            <article key={announcement.id} className="admin-announcement-item">
              <div className="admin-announcement-item__header">
                <div className="admin-announcement-item__heading">
                  <h4 className="admin-announcement-item__title">{announcement.title}</h4>
                  <span className="admin-badge admin-badge--audience">
                    {ANNOUNCEMENT_AUDIENCE_LABELS[announcement.audience]}
                  </span>
                </div>
                <button
                  type="button"
                  className="admin-btn admin-btn--danger"
                  disabled={deletingId === announcement.id}
                  onClick={() => void handleDelete(announcement.id)}
                >
                  {deletingId === announcement.id ? '삭제 중…' : '삭제'}
                </button>
              </div>
              <p className="admin-detail-meta">
                {announcement.adminName || announcement.adminUsername} ·{' '}
                {formatDateTime(announcement.createdAt)}
              </p>
              <div className="admin-announcement-item__content">{announcement.contentPreview}</div>
            </article>
          ))}
        </div>
      )}
    </AdminSectionCard>
  );
}
