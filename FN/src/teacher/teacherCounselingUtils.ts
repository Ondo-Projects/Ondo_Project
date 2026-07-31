import type { CounselingStatus } from '../api/types/counseling';

export const COUNSEL_STATUS_FILTERS: Array<{ value: CounselingStatus | ''; label: string }> = [
  { value: '', label: '전체' },
  { value: 'WAITING', label: '대기' },
  { value: 'CONFIRMED', label: '확정' },
  { value: 'COMPLETED', label: '완료' },
  { value: 'CANCELLED', label: '취소' },
];

export function getAllowedStatusTransitions(status: CounselingStatus): CounselingStatus[] {
  switch (status) {
    case 'WAITING':
      return ['CONFIRMED', 'CANCELLED'];
    case 'CONFIRMED':
      return ['COMPLETED', 'CANCELLED'];
    default:
      return [];
  }
}

export function getStatusTransitionLabel(status: CounselingStatus): string {
  switch (status) {
    case 'CONFIRMED':
      return '확정';
    case 'COMPLETED':
      return '완료';
    case 'CANCELLED':
      return '취소';
    default:
      return status;
  }
}
