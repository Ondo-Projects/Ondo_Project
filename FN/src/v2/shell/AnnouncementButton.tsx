import { useEffect, useId, useRef } from 'react';
import { Bell } from 'lucide-react';
import { usePlatformAnnouncementPanel } from '../../home/PlatformAnnouncementProvider';
import { AnnouncementDetailSheet, AnnouncementList } from './announcements';

/** 상단 바의 온도 공지 버튼 — 누르면 목록이 아래로 펼쳐지고, 공지를 고르면 상세 시트가 열립니다 */
export default function AnnouncementButton({ withSheet = true }: { withSheet?: boolean }) {
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const { isPanelOpen, unreadCount, closePanel, togglePanel } = usePlatformAnnouncementPanel();

  useEffect(() => {
    if (!isPanelOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') closePanel();
    }
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) closePanel();
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
    };
  }, [closePanel, isPanelOpen]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={togglePanel}
        aria-expanded={isPanelOpen}
        aria-controls={panelId}
        aria-label={unreadCount > 0 ? `온도 공지 ${unreadCount}건 새로 있음, 목록 열기` : '온도 공지 목록 열기'}
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-600 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-900 aria-expanded:bg-gray-100 aria-expanded:text-gray-900"
      >
        <Bell size={18} aria-hidden />
        {unreadCount > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 rounded bg-blue-700 px-1 text-center text-[10px] leading-4 font-semibold text-white tabular-nums">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      {isPanelOpen ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="온도 공지"
          className="absolute top-10 right-0 z-30 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-gray-200 bg-white"
        >
          <div className="border-b border-gray-200 px-4 py-2.5 text-[13px] font-semibold text-gray-900">온도 공지</div>
          <div className="max-h-96 overflow-y-auto">
            {/* 공지를 고르면 목록은 닫고 상세 시트만 보여 줍니다 */}
            <AnnouncementList onSelect={closePanel} />
          </div>
        </div>
      ) : null}

      {/* 상세 시트는 화면에 하나만 — 페이지가 따로 그리면 withSheet={false} */}
      {withSheet ? <AnnouncementDetailSheet /> : null}
    </div>
  );
}
