import type { GuardianRelation, SchoolTypeFilter } from '../api/types/signup';

export const GUARDIAN_RELATION_OPTIONS: { value: GuardianRelation; label: string }[] = [
  { value: 'FATHER', label: '부' },
  { value: 'MOTHER', label: '모' },
  { value: 'OTHER', label: '기타' },
];

export const SCHOOL_TYPE_FILTERS: { value: SchoolTypeFilter; label: string }[] = [
  { value: '', label: '전체' },
  { value: '중', label: '중학교' },
  { value: '고', label: '고등학교' },
];
