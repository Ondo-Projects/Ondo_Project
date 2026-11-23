import { Bell } from 'lucide-react';
import PlatformAnnouncementBell from '../../home/components/PlatformAnnouncementBell';

/** 상단 바의 온도 공지 버튼 — 목록 패널은 기존 공지 컴포넌트를 그대로 씁니다 */
export default function AnnouncementButton() {
  return (
    <PlatformAnnouncementBell
      placement="embedded"
      icon={<Bell size={18} aria-hidden />}
      triggerClassName="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-600 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-900 aria-expanded:bg-gray-100 aria-expanded:text-gray-900"
      badgeClassName="absolute -top-0.5 -right-0.5 min-w-4 rounded bg-blue-700 px-1 text-center text-[10px] leading-4 font-semibold text-white tabular-nums"
    />
  );
}
