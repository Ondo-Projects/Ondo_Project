import { formatDateTime } from './homeUtils';

const PLATFORM_AUTHOR_LABEL = '온도';

/** 공지 메타 — 작성자 DB 깨짐 방지, 플랫폼 공지는 「온도」로 표기 */
export function formatAnnouncementMeta(
  createdAt: string | null | undefined,
  updatedAt?: string | null,
): string {
  const createdLabel = formatDateTime(createdAt);
  const updatedLabel =
    updatedAt && createdAt && updatedAt !== createdAt
      ? ` · 수정 ${formatDateTime(updatedAt)}`
      : '';

  return `${createdLabel}${updatedLabel} · ${PLATFORM_AUTHOR_LABEL}`;
}
