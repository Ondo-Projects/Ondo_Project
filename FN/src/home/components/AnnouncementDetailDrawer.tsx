import type { AnnouncementDetail } from '../../api/types/announcement';
import { ANNOUNCEMENT_AUDIENCE_LABELS } from '../../api/types/announcement';
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerHeader,
  DrawerTitle,
  Skeleton,
  SkeletonText,
} from '../../components/ui';
import { formatAnnouncementMeta } from '../announcementUtils';
import '../platform-announcement.css';

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
          <div aria-hidden="true">
            <Skeleton height="1.25rem" width="40%" rounded="sm" />
            <SkeletonText lines={4} className="platform-announcement-drawer__skeleton" />
          </div>
        ) : error ? (
          <p
            className="platform-announcement-drawer__status platform-announcement-drawer__status--error"
            role="alert"
          >
            {error}
          </p>
        ) : announcement ? (
          <>
            <div className="platform-announcement-drawer__badges">
              {announcement.pinned ? (
                <span className="platform-announcement-item__pin">고정</span>
              ) : null}
              <span className="platform-announcement-item__audience">
                {ANNOUNCEMENT_AUDIENCE_LABELS[announcement.audience]}
              </span>
            </div>
            <p className="platform-announcement-item__meta">
              {formatAnnouncementMeta(announcement.createdAt, announcement.updatedAt)}
            </p>
            <div className="platform-announcement-drawer__content">{announcement.content}</div>
          </>
        ) : null}
      </DrawerBody>
    </Drawer>
  );
}
