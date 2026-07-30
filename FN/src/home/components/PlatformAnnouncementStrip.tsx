import type { Announcement, AnnouncementAudience } from '../../api/types/announcement';
import { formatDateTime } from '../homeUtils';

const AUDIENCE_LABELS: Record<AnnouncementAudience, string> = {
  ALL: '전체',
  STUDENT: '학생',
  TEACHER: '교사',
};

interface PlatformAnnouncementStripProps {
  isLoading: boolean;
  announcements: Announcement[] | null;
  error: string | null;
}

export default function PlatformAnnouncementStrip({
  isLoading,
  announcements,
  error,
}: PlatformAnnouncementStripProps) {
  const hasAnnouncements = Boolean(announcements?.length);
  const shouldRender = isLoading || Boolean(error) || hasAnnouncements;

  if (!shouldRender) {
    return null;
  }

  return (
    <section className="home-announcement-strip" aria-label="플랫폼 공지">
      <div className="home-announcement-strip__intro">
        <span className="home-announcement-strip__badge">NOTICE</span>
        <h2 className="home-announcement-strip__headline">온도 공지</h2>
        <p className="home-announcement-strip__lead">
          관리자가 전달하는 플랫폼 전체 안내입니다.
        </p>
      </div>

      {isLoading ? (
        <p className="home-announcement-strip__status">공지를 불러오는 중…</p>
      ) : error ? (
        <p className="home-announcement-strip__status home-announcement-strip__status--error" role="alert">
          {error}
        </p>
      ) : (
        <div className="home-announcement-strip__list">
          {announcements?.map((announcement) => (
            <article key={announcement.id} className="home-announcement-item">
              <div className="home-announcement-item__header">
                <h3 className="home-announcement-item__title">{announcement.title}</h3>
                <span className="home-announcement-item__audience">
                  {AUDIENCE_LABELS[announcement.audience]}
                </span>
              </div>
              <p className="home-announcement-item__meta">
                {formatDateTime(announcement.createdAt)} ·{' '}
                {announcement.adminName || announcement.adminUsername}
              </p>
              <div className="home-announcement-item__content">{announcement.content}</div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
