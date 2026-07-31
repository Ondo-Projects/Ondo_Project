import type { AnnouncementSummary } from '../../api/types/announcement';
import { ANNOUNCEMENT_AUDIENCE_LABELS } from '../../api/types/announcement';
import { Alert, Btn, Skeleton } from '../../components/ui';
import { formatAnnouncementMeta } from '../announcementUtils';
import { usePlatformAnnouncementData } from '../PlatformAnnouncementProvider';

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
        {formatAnnouncementMeta(announcement.createdAt)}
      </p>
      <p className="home-announcement-item__preview">{announcement.contentPreview}</p>
    </button>
  );
}

export default function PlatformAnnouncementBoard() {
  const {
    items,
    totalElements,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    openDetail,
  } = usePlatformAnnouncementData();

  if (isLoading) {
    return (
      <section className="home-announcement-board" aria-label="플랫폼 공지 게시판" aria-busy="true">
        <div className="home-announcement-board__head">
          <h2 className="home-announcement-board__title">공지 게시판</h2>
        </div>
        <div className="home-announcement-board__list" aria-hidden="true">
          <Skeleton height="5.5rem" rounded="md" />
          <Skeleton height="5.5rem" rounded="md" />
        </div>
      </section>
    );
  }

  if (error && items.length === 0) {
    return (
      <section className="home-announcement-board" aria-label="플랫폼 공지 게시판">
        <div className="home-announcement-board__head">
          <h2 className="home-announcement-board__title">공지 게시판</h2>
        </div>
        <Alert variant="error">{error}</Alert>
      </section>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <section
      id="home-announcement-board"
      className="home-announcement-board"
      aria-label="플랫폼 공지 게시판"
    >
      <div className="home-announcement-board__head">
        <h2 className="home-announcement-board__title">공지 게시판</h2>
        <p className="home-announcement-board__count">총 {totalElements}건</p>
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}

      <div className="home-announcement-board__list">
        {items.map((announcement) => (
          <AnnouncementPreviewCard
            key={announcement.id}
            announcement={announcement}
            onOpen={(id) => void openDetail(id)}
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
  );
}
