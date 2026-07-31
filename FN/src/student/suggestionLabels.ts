import type { SuggestionCategory, SuggestionStatus } from '../api/types/suggestion';
import type { BadgeVariant } from '../components/ui';

export const SUGGESTION_CATEGORY_OPTIONS: Array<{ value: SuggestionCategory; label: string }> = [
  { value: 'BUG', label: '버그 / 오류' },
  { value: 'FEATURE', label: '기능 개선' },
  { value: 'OPERATION', label: '운영 문의' },
  { value: 'OTHER', label: '기타' },
];

export const SUGGESTION_STATUS_LABELS: Record<SuggestionStatus, string> = {
  OPEN: '접수',
  IN_REVIEW: '검토 중',
  RESOLVED: '처리 완료',
  CLOSED: '종료',
};

export function getSuggestionCategoryLabel(category: SuggestionCategory): string {
  return SUGGESTION_CATEGORY_OPTIONS.find((option) => option.value === category)?.label ?? category;
}

export function getSuggestionStatusLabel(status: SuggestionStatus): string {
  return SUGGESTION_STATUS_LABELS[status] ?? status;
}

export function getSuggestionStatusBadgeVariant(status: SuggestionStatus): BadgeVariant {
  switch (status) {
    case 'OPEN':
      return 'pending';
    case 'IN_REVIEW':
      return 'inProgress';
    case 'RESOLVED':
      return 'completed';
    case 'CLOSED':
      return 'neutral';
    default:
      return 'neutral';
  }
}

export function isSuggestionOpen(status: SuggestionStatus): boolean {
  return status === 'OPEN';
}
