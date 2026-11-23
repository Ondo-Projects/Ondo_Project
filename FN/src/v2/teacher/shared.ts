import { ApiError } from '../../api/types/api-error';
import type { CounselingStatus } from '../../api/types/counseling';
import type { MoodLevelCode } from '../../api/types/student';
import type { SuggestionStatus } from '../../api/types/suggestion';
import type { BadgeTone } from '../../ds';

/** 각 화면 → 교사 콘솔로 결과 메시지 전달 */
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

export const COUNSEL_STATUS_TONE: Record<CounselingStatus, BadgeTone> = {
  WAITING: 'warning',
  CONFIRMED: 'info',
  COMPLETED: 'success',
  CANCELLED: 'neutral',
};

export const SUGGESTION_STATUS_TONE: Record<SuggestionStatus, BadgeTone> = {
  OPEN: 'warning',
  IN_REVIEW: 'info',
  RESOLVED: 'success',
  CLOSED: 'neutral',
};

/** 마음 날씨 — 맑음(좋음) → 힘듦 순서. 우울·힘듦은 살펴볼 학생으로 표시 */
export const MOOD_ORDER: MoodLevelCode[] = ['SUNNY', 'FAIR', 'CLOUDY', 'RAINY', 'STORMY'];

export const MOOD_TONE: Record<MoodLevelCode, BadgeTone> = {
  SUNNY: 'neutral',
  FAIR: 'neutral',
  CLOUDY: 'neutral',
  RAINY: 'warning',
  STORMY: 'danger',
};

export function needsAttention(code: MoodLevelCode | null | undefined): boolean {
  return code === 'RAINY' || code === 'STORMY';
}

/** "2026-11-23T08:41:00" → "11.23 08:41" */
export function formatCompactDateTime(value: string | null | undefined): string {
  if (!value) return '-';
  const match = value.match(/^\d{4}-(\d{2})-(\d{2})[T ](\d{2}:\d{2})/);
  if (!match) return value;
  return `${match[1]}.${match[2]} ${match[3]}`;
}

/** "2026-11-23" → "11.23 (월)" */
export function formatDayWithWeekday(value: string | null | undefined): string {
  if (!value) return '-';
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
  return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} (${weekday})`;
}

export function displayName(name: string | null | undefined, username: string): string {
  return name?.trim() || username;
}

/** 표에서 처음 고른 행이 화면 아래쪽 상세로 이어지도록 (좁은 화면만) */
export function scrollToDetailOnNarrow(id: string) {
  if (window.innerWidth >= 1024) return;
  window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
}
