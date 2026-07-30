import type { SuggestionStatus } from '../api/types/suggestion';

export {
  getSuggestionCategoryLabel,
  getSuggestionStatusLabel,
  isSuggestionOpen,
  SUGGESTION_CATEGORY_OPTIONS,
} from '../student/suggestionLabels';

export function getTeacherSuggestionStatusBadgeClass(status: SuggestionStatus): string {
  return `teacher-badge teacher-badge--${status.toLowerCase().replace('_', '-')}`;
}

export function getTeacherSuggestionCategoryBadgeClass(): string {
  return 'teacher-badge teacher-badge--suggestion-cat';
}
