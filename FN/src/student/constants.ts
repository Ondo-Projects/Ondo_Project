export const STUDENT_SECTIONS = {
  TODAY: 'section-today',
  MOOD: 'section-mood',
  NOTICE: 'section-notice',
  SCHOOL_CALENDAR: 'section-school-calendar',
  TIMETABLE: 'section-timetable',
  CLASS_PROFILE: 'section-class-profile',
  ASSIGNMENT: 'section-assignment',
  PRE_COUNSEL: 'section-pre-counsel',
  COUNSEL_CREATE: 'section-counsel-create',
  COUNSEL_LIST: 'section-counsel-list',
  SUGGESTION: 'section-suggestion',
} as const;

export const STUDENT_QUICK_ACTIONS = [
  { label: '오늘', target: STUDENT_SECTIONS.TODAY },
  { label: '마음', target: STUDENT_SECTIONS.MOOD },
  { label: '알림', target: STUDENT_SECTIONS.NOTICE },
  { label: '상담', target: STUDENT_SECTIONS.COUNSEL_CREATE },
  { label: '사전카드', target: STUDENT_SECTIONS.PRE_COUNSEL },
  { label: '일정', target: STUDENT_SECTIONS.SCHOOL_CALENDAR },
  { label: '시간표', target: STUDENT_SECTIONS.TIMETABLE },
  { label: '건의', target: STUDENT_SECTIONS.SUGGESTION },
] as const;

export const SCHEDULE_SUMMARY_LIMIT = 2;
export const TIMETABLE_SUMMARY_LIMIT = 3;

export const MOOD_OPTIONS = [
  { code: 'SUNNY' as const, emoji: '☀️', label: '맑음' },
  { code: 'FAIR' as const, emoji: '🌤️', label: '보통' },
  { code: 'CLOUDY' as const, emoji: '☁️', label: '흐림' },
  { code: 'RAINY' as const, emoji: '🌧️', label: '우울' },
  { code: 'STORMY' as const, emoji: '⛈️', label: '힘듦' },
];

export const PRE_COUNSEL_SECTIONS = {
  BASIC: 'preCounselSection1',
  SELF: 'preCounselSection2',
  SCHOOL: 'preCounselSection3',
} as const;
