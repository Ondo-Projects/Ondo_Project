import { type FormEvent, useEffect, useId, useRef } from 'react';

import type { AnnouncementAudience, AnnouncementDetail, AnnouncementStatus } from '../../api/types/announcement';
import {
  ANNOUNCEMENT_AUDIENCE_OPTIONS,
  ANNOUNCEMENT_STATUS_OPTIONS,
} from '../constants';

export interface AdminAnnouncementEditFormState {
  title: string;
  content: string;
  audience: AnnouncementAudience;
  pinned: boolean;
  status: AnnouncementStatus;
}

interface AdminAnnouncementEditDrawerProps {
  isOpen: boolean;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  form: AdminAnnouncementEditFormState | null;
  onChange: (next: AdminAnnouncementEditFormState) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export default function AdminAnnouncementEditDrawer({
  isOpen,
  isLoading,
  isSaving,
  error,
  form,
  onChange,
  onClose,
  onSubmit,
}: AdminAnnouncementEditDrawerProps) {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="admin-announcement-drawer" role="presentation">
      <button
        type="button"
        className="admin-announcement-drawer__backdrop"
        aria-label="공지 수정 닫기"
        onClick={onClose}
      />

      <aside
        className="admin-announcement-drawer__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="admin-announcement-drawer__header">
          <h2 id={titleId} className="admin-announcement-drawer__title">
            공지 수정
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            className="admin-btn admin-btn--secondary"
            onClick={onClose}
          >
            닫기
          </button>
        </div>

        <div className="admin-announcement-drawer__body">
          {isLoading || !form ? (
            <p className="admin-status">불러오는 중…</p>
          ) : (
            <form className="admin-form admin-form--drawer" onSubmit={onSubmit}>
              {error ? (
                <p className="admin-message admin-message--error" role="alert">
                  {error}
                </p>
              ) : null}

              <div className="admin-field">
                <label htmlFor="admin-announcement-edit-title">제목</label>
                <input
                  id="admin-announcement-edit-title"
                  type="text"
                  maxLength={100}
                  disabled={isSaving}
                  value={form.title}
                  onChange={(event) => onChange({ ...form, title: event.target.value })}
                />
              </div>

              <div className="admin-field">
                <label htmlFor="admin-announcement-edit-audience">대상</label>
                <select
                  id="admin-announcement-edit-audience"
                  disabled={isSaving}
                  value={form.audience}
                  onChange={(event) =>
                    onChange({
                      ...form,
                      audience: event.target.value as AnnouncementAudience,
                    })
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
                <label htmlFor="admin-announcement-edit-status">상태</label>
                <select
                  id="admin-announcement-edit-status"
                  disabled={isSaving}
                  value={form.status}
                  onChange={(event) =>
                    onChange({
                      ...form,
                      status: event.target.value as AnnouncementStatus,
                    })
                  }
                >
                  {ANNOUNCEMENT_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-field admin-field--checkbox">
                <label htmlFor="admin-announcement-edit-pinned">
                  <input
                    id="admin-announcement-edit-pinned"
                    type="checkbox"
                    disabled={isSaving}
                    checked={form.pinned}
                    onChange={(event) => onChange({ ...form, pinned: event.target.checked })}
                  />
                  상단 고정
                </label>
              </div>

              <div className="admin-field">
                <label htmlFor="admin-announcement-edit-content">내용</label>
                <textarea
                  id="admin-announcement-edit-content"
                  disabled={isSaving}
                  value={form.content}
                  onChange={(event) => onChange({ ...form, content: event.target.value })}
                />
              </div>

              <div className="admin-inline-actions admin-inline-actions--spaced">
                <button
                  type="submit"
                  className="admin-btn admin-btn--primary"
                  disabled={isSaving}
                >
                  {isSaving ? '저장 중…' : '변경 저장'}
                </button>
              </div>
            </form>
          )}
        </div>
      </aside>
    </div>
  );
}

export function toEditFormState(detail: AnnouncementDetail): AdminAnnouncementEditFormState {
  return {
    title: detail.title,
    content: detail.content,
    audience: detail.audience,
    pinned: detail.pinned,
    status: detail.status,
  };
}
