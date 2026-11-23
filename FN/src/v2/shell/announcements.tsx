import { Pin } from 'lucide-react';
import type { AnnouncementSummary } from '../../api/types/announcement';
import { ANNOUNCEMENT_AUDIENCE_LABELS } from '../../api/types/announcement';
import { usePlatformAnnouncementData } from '../../home/PlatformAnnouncementProvider';
import { Notice, Sheet, Skeleton, cn } from '../../ds';
import { formatCompactDateTime } from '../common';

/** 온도 공지 한 줄 (제목·날짜·미리보기) */
export function AnnouncementRow({
  announcement,
  onOpen,
  className,
}: {
  announcement: AnnouncementSummary;
  onOpen: (id: number) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(announcement.id)}
      className={cn('block w-full px-4 py-3 text-left transition-colors duration-150 hover:bg-gray-50', className)}
    >
      <span className="flex items-center gap-1.5">
        {announcement.pinned ? <Pin size={14} className="shrink-0 text-blue-700" aria-label="상단 고정" /> : null}
        <span className="truncate text-sm font-medium text-gray-900">{announcement.title}</span>
      </span>
      <span className="mt-0.5 block truncate text-[13px] text-gray-500">{announcement.contentPreview}</span>
      <span className="mt-1 block text-xs text-gray-400 tabular-nums">
        {formatCompactDateTime(announcement.createdAt)}
        {announcement.audience !== 'ALL' ? ` · ${ANNOUNCEMENT_AUDIENCE_LABELS[announcement.audience]}` : ''}
      </span>
    </button>
  );
}

/** 온도 공지 목록 (더 보기 포함) — 선택하면 AnnouncementDetailSheet 가 열림 */
export function AnnouncementList({
  limit,
  emptyText = '등록된 공지가 없습니다.',
  onSelect,
}: {
  limit?: number;
  emptyText?: string;
  /** 공지를 고른 뒤 (예: 펼친 목록 닫기) */
  onSelect?: () => void;
}) {
  const { items, isLoading, isLoadingMore, error, hasMore, loadMore, openDetail } = usePlatformAnnouncementData();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }
  if (error && items.length === 0) {
    return (
      <div className="p-4">
        <Notice tone="danger">{error}</Notice>
      </div>
    );
  }
  if (items.length === 0) {
    return <p className="px-4 py-6 text-[13px] text-gray-500">{emptyText}</p>;
  }

  const visible = limit ? items.slice(0, limit) : items;
  return (
    <div className="divide-y divide-gray-100">
      {visible.map((item) => (
        <AnnouncementRow
          key={item.id}
          announcement={item}
          onOpen={(id) => {
            void openDetail(id);
            onSelect?.();
          }}
        />
      ))}
      {!limit && hasMore ? (
        <button
          type="button"
          onClick={() => void loadMore()}
          disabled={isLoadingMore}
          className="block w-full px-4 py-3 text-center text-[13px] font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          {isLoadingMore ? '불러오는 중…' : '더 보기'}
        </button>
      ) : null}
    </div>
  );
}

/** 공지 상세 — 앱에서 한 번만 그려 두면 어느 목록에서 열어도 뜹니다 */
export function AnnouncementDetailSheet() {
  const { selectedId, detail, isDetailLoading, detailError, closeDetail } = usePlatformAnnouncementData();
  return (
    <Sheet
      open={selectedId !== null}
      onClose={closeDetail}
      title={detail?.title ?? '온도 공지'}
      description={
        detail
          ? `온도 · ${formatCompactDateTime(detail.createdAt)}${
              detail.updatedAt !== detail.createdAt ? ` · 수정 ${formatCompactDateTime(detail.updatedAt)}` : ''
            }`
          : undefined
      }
    >
      {isDetailLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : detailError ? (
        <Notice tone="danger">{detailError}</Notice>
      ) : detail ? (
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-900">{detail.content}</p>
      ) : null}
    </Sheet>
  );
}
