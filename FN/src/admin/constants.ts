import type { UserRole } from '../api/types/auth';
import type { SuggestionCategory, SuggestionStatus } from '../api/types/suggestion';

export const ADMIN_SECTIONS = {
  SUGGESTION: 'section-suggestion',
} as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  STUDENT: '학생',
  TEACHER: '교사',
  ADMIN: '관리자',
};

export const COUNSELING_STATUS_LABELS: Record<string, string> = {
  WAITING: '대기',
  CONFIRMED: '확정',
  COMPLETED: '완료',
  CANCELLED: '취소',
};

export const MOOD_LEVEL_LABELS: Record<string, string> = {
  SUNNY: '맑음',
  FAIR: '약간 흐림',
  CLOUDY: '흐림',
  RAINY: '비',
  STORMY: '폭풍',
};

export const ACTION_LABELS: Record<string, string> = {
  USER_ACTIVATE: '회원 활성화',
  USER_DEACTIVATE: '회원 비활성화',
  USER_SCHOOL_CHANGE: '학교 변경',
  SCHOOL_CSV_SYNC: '학교 CSV 동기화',
  SUGGESTION_STATUS_CHANGE: '건의 상태 변경',
  SUGGESTION_REPLY: '건의 답변',
};

export const USER_ROLE_FILTER_OPTIONS: Array<{ value: UserRole | ''; label: string }> = [
  { value: '', label: '전체' },
  { value: 'STUDENT', label: '학생' },
  { value: 'TEACHER', label: '교사' },
  { value: 'ADMIN', label: '관리자' },
];

export const SCHOOL_MAPPED_FILTER_OPTIONS: Array<{ value: '' | 'true' | 'false'; label: string }> =
  [
    { value: '', label: '전체' },
    { value: 'true', label: 'NEIS 매핑됨' },
    { value: 'false', label: '미매핑' },
  ];

export const SUGGESTION_STATUS_FILTER_OPTIONS: Array<{ value: SuggestionStatus | ''; label: string }> =
  [
    { value: '', label: '전체' },
    { value: 'OPEN', label: '접수' },
    { value: 'IN_REVIEW', label: '검토 중' },
    { value: 'RESOLVED', label: '처리 완료' },
    { value: 'CLOSED', label: '종료' },
  ];

export const SUGGESTION_CATEGORY_FILTER_OPTIONS: Array<{
  value: SuggestionCategory | '';
  label: string;
}> = [
  { value: '', label: '전체' },
  { value: 'BUG', label: '버그 / 오류' },
  { value: 'FEATURE', label: '기능 개선' },
  { value: 'OPERATION', label: '운영 문의' },
  { value: 'OTHER', label: '기타' },
];

export const SUGGESTION_ROLE_FILTER_OPTIONS: Array<{ value: UserRole | ''; label: string }> = [
  { value: '', label: '전체' },
  { value: 'STUDENT', label: '학생' },
  { value: 'TEACHER', label: '교사' },
];

export const PAGE_SIZE = 20;
