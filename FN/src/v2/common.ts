import { ApiError } from '../api/types/api-error';

/** 각 화면 → 콘솔(교사·관리자)로 결과 메시지 전달 */
export interface FeedbackHandlers {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function resolveErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
}

/** "2026-11-23T08:41:00" → "11.23 08:41" (연도가 다르면 "2025.11.23 08:41") */
export function formatCompactDateTime(value: string | null | undefined): string {
  if (!value) return '-';
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}:\d{2})/);
  if (!match) return value;
  const sameYear = Number(match[1]) === new Date().getFullYear();
  return `${sameYear ? '' : `${match[1]}.`}${match[2]}.${match[3]} ${match[4]}`;
}

/** 표에서 고른 행의 상세가 아래쪽에 열리는 좁은 화면에서 그 위치로 이동 */
export function scrollToDetailOnNarrow(id: string) {
  if (window.innerWidth >= 1024) return;
  window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
}
