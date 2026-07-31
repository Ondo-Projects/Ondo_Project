import type { CounselingStatus, CounselingType } from '../api/types/counseling';
import type { BadgeVariant } from '../components/ui';
import { STUDENT_SECTIONS } from './constants';

export type StudentWorkspaceTab = 'pre-counsel' | 'counsel-create' | 'counsel-list';

export const STUDENT_WORKSPACE_TABS: Array<{ id: StudentWorkspaceTab; label: string }> = [
  { id: 'pre-counsel', label: '사전카드' },
  { id: 'counsel-create', label: '상담 신청' },
  { id: 'counsel-list', label: '내 상담' },
];

export const COUNSELING_TYPE_OPTIONS: Array<{ value: CounselingType; label: string }> = [
  { value: 'ACADEMIC', label: '학업 / 성적' },
  { value: 'CAREER', label: '진로 / 진학' },
  { value: 'EMOTIONAL', label: '정서 / 심리' },
  { value: 'INTERPERSONAL', label: '대인관계 / 또래' },
  { value: 'LIFE', label: '생활 / 습관' },
  { value: 'FAMILY', label: '가정 / 가족' },
  { value: 'BEHAVIOR', label: '행동 / 적응' },
  { value: 'SCHOOL_VIOLENCE', label: '학교폭력 / 따돌림' },
  { value: 'OTHER', label: '기타' },
];

export const COUNSELING_STATUS_LABELS: Record<CounselingStatus, string> = {
  WAITING: '대기',
  CONFIRMED: '확정',
  COMPLETED: '완료',
  CANCELLED: '취소',
};

export function getCounselingTypeLabel(type: CounselingType): string {
  return COUNSELING_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}

export function getCounselingStatusLabel(status: CounselingStatus): string {
  return COUNSELING_STATUS_LABELS[status] ?? status;
}

export function getCounselingStatusBadgeVariant(status: CounselingStatus): BadgeVariant {
  switch (status) {
    case 'WAITING':
      return 'pending';
    case 'CONFIRMED':
      return 'inProgress';
    case 'COMPLETED':
      return 'completed';
    case 'CANCELLED':
      return 'neutral';
    default:
      return 'neutral';
  }
}

export function resolveWorkspaceTabForSection(sectionId: string): StudentWorkspaceTab | null {
  if (sectionId === STUDENT_SECTIONS.PRE_COUNSEL) {
    return 'pre-counsel';
  }
  if (sectionId === STUDENT_SECTIONS.COUNSEL_CREATE) {
    return 'counsel-create';
  }
  if (
    sectionId === STUDENT_SECTIONS.COUNSEL_LIST ||
    sectionId === STUDENT_SECTIONS.COUNSEL_DETAIL
  ) {
    return 'counsel-list';
  }
  return null;
}

export function getTodayDateInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}
