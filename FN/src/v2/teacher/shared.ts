import type { CounselingStatus } from '../../api/types/counseling';
import type { MoodLevelCode } from '../../api/types/student';
import type { SuggestionStatus } from '../../api/types/suggestion';
import type { BadgeTone } from '../../ds';

export {
  type FeedbackHandlers,
  formatCompactDateTime,
  resolveErrorMessage,
  scrollToDetailOnNarrow,
} from '../common';

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
