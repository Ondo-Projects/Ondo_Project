import type { AnnouncementSummary } from '../../api/types/announcement';
import { ANNOUNCEMENT_AUDIENCE_LABELS } from '../../api/types/announcement';
import { Alert, Btn, Skeleton } from '../../components/ui';
import { formatDateTime } from '../homeUtils';
import AnnouncementDetailDrawer from './AnnouncementDetailDrawer';
import { usePlatformAnnouncements } from '../usePlatformAnnouncements';

function AnnouncementPreviewCard({
  announcement,
  onOpen,
}: {
  announcement: AnnouncementSummary;
  onOpen: (id: number) => void;
}) {
  return (
    <button
      type="button"
      className="home-announcement-item home-announcement-item--interactive"
      onClick={() => onOpen(announcement.id)}
    >
      <div className="home-announcement-item__header">
        <h3 className="home-announcement-item__title">{announcement.title}</h3>
        <div className="home-announcement-item__labels">
          {announcement.pinned ? (
            <span className="home-announcement-item__pin">고정</span>
          ) : null}
          <span className="home-announcement-item__audience">
            {ANNOUNCEMENT_AUDIENCE_LABELS[announcement.audience]}
          </span>
        </div>
      </div>
      <p className="home-announcement-item__meta">
        {formatDateTime(announcement.createdAt)} · {announcement.adminName || announcement.adminUsername}
      </p>
      <p className="home-announcement-item__preview">{announcement.contentPreview}</p>
    </button>
  );
}

export default function PlatformAnnouncementSection() {
  const {
    items,
    stripItems,
    totalElements,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    shouldRender,
    selectedId,
    detail,
    isDetailLoading,
    detailError,
    loadMore,
    openDetail,
    closeDetail,
  } = usePlatformAnnouncements();

  if (!shouldRender) {
    return null;
  }

  function scrollToBoard() {
    document.getElementById('home-announcement-board')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <>
      <section
        className="home-announcement-strip"
        aria-label="플랫폼 공지"
        aria-busy={isLoading}
      >
        <div className="home-announcement-strip__intro">
          <span className="home-announcement-strip__badge">NOTICE</span>
          <h2 className="home-announcement-strip__headline">온도 공지</h2>
          <p className="home-announcement-strip__lead">
            관리자가 전달하는 플랫폼 전체 안내입니다. 항목을 눌러 전문을 확인하세요.
          </p>
        </div>

        {isLoading ? (
          <>
            <span className="home-announcement-strip__sr-only">공지를 불러오는 중…</span>
            <div className="home-announcement-strip__skeleton" aria-hidden="true">
              <Skeleton height="4.5rem" rounded="md" />
              <Skeleton height="4.5rem" rounded="md" />
            </div>
          </>
        ) : error && items.length === 0 ? (
          <Alert
            variant="error"
            className="home-announcement-strip__status home-announcement-strip__status--error"
          >
            {error}
          </Alert>
        ) : (
          <>
            <div className="home-announcement-strip__list">
              {stripItems.map((announcement) => (
                <AnnouncementPreviewCard
                  key={announcement.id}
                  announcement={announcement}
                  onOpen={openDetail}
                />
              ))}
            </div>

            {totalElements > stripItems.length ? (
              <div className="home-announcement-strip__actions">
                <Btn
                  variant="ghost"
                  className="home-announcement-board__more"
                  onClick={scrollToBoard}
                >
                  전체 공지 {totalElements}건 보기
                </Btn>
              </div>
            ) : null}
          </>
        )}
      </section>

      {!isLoading && items.length > 0 ? (
        <section
          id="home-announcement-board"
          className="home-announcement-board"
          aria-label="플랫폼 공지 게시판"
        >
          <div className="home-announcement-board__head">
            <h2 className="home-announcement-board__title">공지 게시판</h2>
            <p className="home-announcement-board__count">총 {totalElements}건</p>
          </div>

          {error && items.length > 0 ? (
            <Alert
              variant="error"
              className="home-announcement-strip__status home-announcement-strip__status--error"
            >
              {error}
            </Alert>
          ) : null}

          <div className="home-announcement-board__list">
            {items.map((announcement) => (
              <AnnouncementPreviewCard
                key={announcement.id}
                announcement={announcement}
                onOpen={openDetail}
              />
            ))}
          </div>

          {hasMore ? (
            <div className="home-announcement-board__actions">
              <Btn
                variant="ghost"
                className="home-announcement-board__more"
                disabled={isLoadingMore}
                onClick={() => void loadMore()}
              >
                {isLoadingMore ? '불러오는 중…' : '더 보기'}
              </Btn>
            </div>
          ) : null}
        </section>
      ) : null}

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
