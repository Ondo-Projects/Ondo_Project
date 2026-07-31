import type { AnnouncementDetail } from '../../api/types/announcement';
import { ANNOUNCEMENT_AUDIENCE_LABELS } from '../../api/types/announcement';
import { Drawer, DrawerBody, DrawerClose, DrawerHeader, DrawerTitle } from '../../components/ui';
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
  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
      <DrawerHeader>
        <DrawerTitle>{announcement?.title ?? '공지 상세'}</DrawerTitle>
        <DrawerClose>닫기</DrawerClose>
      </DrawerHeader>

      <DrawerBody>
        {isLoading ? (
          <p className="home-announcement-drawer__status">불러오는 중…</p>
        ) : error ? (
          <p
            className="home-announcement-drawer__status home-announcement-drawer__status--error"
            role="alert"
          >
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
      </DrawerBody>
    </Drawer>
  );
}
