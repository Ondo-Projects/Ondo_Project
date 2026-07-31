import { useEffect, useId, useRef } from 'react';

import type { AnnouncementDetail } from '../../api/types/announcement';
import { ANNOUNCEMENT_AUDIENCE_LABELS } from '../../api/types/announcement';
import { formatDateTime } from '../homeUtils';

interface AnnouncementDetailDrawerProps {
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  announcement: AnnouncementDetail | null;
  onClose: () => void;
}

export default function AnnouncementDetailDrawer({
  isOpen,
  isLoading,
  error,
  announcement,
  onClose,
}: AnnouncementDetailDrawerProps) {
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
    <div className="home-announcement-drawer" role="presentation">
      <button
        type="button"
        className="home-announcement-drawer__backdrop"
        aria-label="공지 닫기"
        onClick={onClose}
      />

      <aside
        className="home-announcement-drawer__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="home-announcement-drawer__header">
          <h2 id={titleId} className="home-announcement-drawer__title">
            {announcement?.title ?? '공지 상세'}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            className="home-announcement-drawer__close"
            onClick={onClose}
          >
            닫기
          </button>
        </div>

        <div className="home-announcement-drawer__body">
          {isLoading ? (
            <p className="home-announcement-drawer__status">불러오는 중…</p>
          ) : error ? (
            <p className="home-announcement-drawer__status home-announcement-drawer__status--error" role="alert">
              {error}
            </p>
          ) : announcement ? (
            <>
              <div className="home-announcement-drawer__badges">
                {announcement.pinned ? (
                  <span className="home-announcement-item__pin">고정</span>
                ) : null}
                <span className="home-announcement-item__audience">
                  {ANNOUNCEMENT_AUDIENCE_LABELS[announcement.audience]}
                </span>
              </div>
              <p className="home-announcement-item__meta">
                {formatDateTime(announcement.createdAt)}
                {announcement.updatedAt !== announcement.createdAt
                  ? ` · 수정 ${formatDateTime(announcement.updatedAt)}`
                  : ''}
                {' · '}
                {announcement.adminName || announcement.adminUsername}
              </p>
              <div className="home-announcement-drawer__content">{announcement.content}</div>
            </>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
