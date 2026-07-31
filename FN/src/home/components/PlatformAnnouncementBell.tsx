import { useCallback, useEffect, useId, useRef } from 'react';

import type { AnnouncementSummary } from '../../api/types/announcement';
import { ANNOUNCEMENT_AUDIENCE_LABELS } from '../../api/types/announcement';
import { Alert, Btn, Skeleton } from '../../components/ui';
import { formatAnnouncementMeta } from '../announcementUtils';
import AnnouncementDetailDrawer from './AnnouncementDetailDrawer';
import {
  usePlatformAnnouncementData,
  usePlatformAnnouncementPanel,
} from '../PlatformAnnouncementProvider';
import '../platform-announcement.css';

interface PlatformAnnouncementBellProps {
  placement?: 'fixed' | 'embedded';
}

function AnnouncementListItem({
  announcement,
  onSelect,
}: {
  announcement: AnnouncementSummary;
  onSelect: (id: number) => void;
}) {
  return (
    <button
      type="button"
      className="platform-announcement-item"
      onClick={() => onSelect(announcement.id)}
    >
      <div className="platform-announcement-item__header">
        <h3 className="platform-announcement-item__title">{announcement.title}</h3>
        <div className="platform-announcement-item__labels">
          {announcement.pinned ? (
            <span className="platform-announcement-item__pin">고정</span>
          ) : null}
          <span className="platform-announcement-item__audience">
            {ANNOUNCEMENT_AUDIENCE_LABELS[announcement.audience]}
          </span>
        </div>
      </div>
      <p className="platform-announcement-item__meta">
        {formatAnnouncementMeta(announcement.createdAt)}
      </p>
      <p className="platform-announcement-item__preview">{announcement.contentPreview}</p>
    </button>
  );
}

export default function PlatformAnnouncementBell({
  placement = 'fixed',
}: PlatformAnnouncementBellProps) {
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const { isPanelOpen, unreadCount, closePanel, togglePanel } = usePlatformAnnouncementPanel();
  const {
    items,
    totalElements,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    selectedId,
    detail,
    isDetailLoading,
    detailError,
    loadMore,
    openDetail,
    closeDetail,
  } = usePlatformAnnouncementData();

  const handleSelect = useCallback(
    (id: number) => {
      closePanel();
      void openDetail(id);
    },
    [closePanel, openDetail],
  );

  useEffect(() => {
    if (!isPanelOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closePanel();
      }
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        closePanel();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [closePanel, isPanelOpen]);

  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount);
  const rootClassName = [
    'platform-announcement-bell',
    placement === 'embedded' ? 'platform-announcement-bell--embedded' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <div className={rootClassName} ref={rootRef}>
        <button
          type="button"
          className="platform-announcement-bell__trigger"
          aria-label={
            unreadCount > 0
              ? `플랫폼 공지 ${unreadCount}건, 목록 열기`
              : '플랫폼 공지 목록 열기'
          }
          aria-expanded={isPanelOpen}
          aria-controls={panelId}
          onClick={togglePanel}
        >
          <span className="platform-announcement-bell__icon" aria-hidden="true">
            🔔
          </span>
          {unreadCount > 0 ? (
            <span className="platform-announcement-bell__badge" aria-hidden="true">
              {badgeLabel}
            </span>
          ) : null}
        </button>

        {isPanelOpen ? (
          <div
            id={panelId}
            className="platform-announcement-bell__panel"
            role="dialog"
            aria-label="플랫폼 공지"
          >
            <div className="platform-announcement-bell__head">
              <div>
                <h2 className="platform-announcement-bell__title">온도 공지</h2>
                {!isLoading && totalElements > 0 ? (
                  <p className="platform-announcement-bell__count">총 {totalElements}건</p>
                ) : null}
              </div>
            </div>

            <div className="platform-announcement-bell__body">
              {isLoading ? (
                <div className="platform-announcement-bell__list" aria-hidden="true">
                  <Skeleton height="5rem" rounded="md" />
                  <Skeleton height="5rem" rounded="md" />
                </div>
              ) : error && items.length === 0 ? (
                <Alert variant="error">{error}</Alert>
              ) : items.length === 0 ? (
                <p className="platform-announcement-bell__status">등록된 공지가 없습니다.</p>
              ) : (
                <>
                  {error ? <Alert variant="error">{error}</Alert> : null}
                  <div className="platform-announcement-bell__list">
                    {items.map((announcement) => (
                      <AnnouncementListItem
                        key={announcement.id}
                        announcement={announcement}
                        onSelect={handleSelect}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {hasMore ? (
              <div className="platform-announcement-bell__footer">
                <Btn
                  variant="ghost"
                  fullWidth
                  disabled={isLoadingMore}
                  onClick={() => void loadMore()}
                >
                  {isLoadingMore ? '불러오는 중…' : '더 보기'}
                </Btn>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <AnnouncementDetailDrawer
        isOpen={selectedId !== null}
        isLoading={isDetailLoading}
        error={detailError}
        announcement={detail}
        onClose={closeDetail}
      />
    </>
  );
}
