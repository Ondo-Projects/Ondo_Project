/** BN `teacher.html` element ids — hash scroll targets must match exactly. */
export const TEACHER_SECTIONS = {
  NOTIFICATION_SETTINGS: 'notificationSettingsCard',
  TODAY_SUMMARY: 'todaySummaryCard',
  INVITE_CODE: 'teacherInviteSection',
  POST_LIST: 'postList',
  DETAIL_CARD: 'detailCard',
  MOOD_SUMMARY: 'moodSummaryList',
  PRE_COUNSEL_SUMMARY: 'preCounselSummaryList',
  PRE_COUNSEL_DETAIL: 'preCounselDetailPanel',
  NOTICE_LIST: 'noticeList',
  SUGGESTION: 'section-suggestion',
} as const;

export const TEACHER_QUICK_ACTIONS = [
  { label: '상담', target: TEACHER_SECTIONS.POST_LIST },
  { label: '마음', target: TEACHER_SECTIONS.MOOD_SUMMARY },
  { label: '사전카드', target: TEACHER_SECTIONS.PRE_COUNSEL_SUMMARY },
  { label: '알림', target: TEACHER_SECTIONS.NOTICE_LIST },
  { label: 'SMS', target: TEACHER_SECTIONS.NOTIFICATION_SETTINGS },
  { label: '건의', target: TEACHER_SECTIONS.SUGGESTION },
] as const;

/** BN `home.html` `#teacherQuickLinks` — hash must match `TEACHER_SECTIONS`. */
export const TEACHER_HOME_QUICK_LINKS = [
  { label: '상담', target: TEACHER_SECTIONS.POST_LIST },
  { label: '마음', target: TEACHER_SECTIONS.MOOD_SUMMARY },
  { label: '사전카드', target: TEACHER_SECTIONS.PRE_COUNSEL_SUMMARY },
] as const;

export const TEACHER_SECTION_LABELS: Record<string, string> = {
  [TEACHER_SECTIONS.NOTIFICATION_SETTINGS]: '상담 SMS 알림',
  [TEACHER_SECTIONS.TODAY_SUMMARY]: '오늘 확인할 것',
  [TEACHER_SECTIONS.INVITE_CODE]: '학생 초대 코드',
  [TEACHER_SECTIONS.POST_LIST]: '상담 목록',
  [TEACHER_SECTIONS.DETAIL_CARD]: '상담 상세',
  [TEACHER_SECTIONS.MOOD_SUMMARY]: '마음 날씨',
  [TEACHER_SECTIONS.PRE_COUNSEL_SUMMARY]: '사전 상담 카드',
  [TEACHER_SECTIONS.PRE_COUNSEL_DETAIL]: '사전 상담 상세',
  [TEACHER_SECTIONS.NOTICE_LIST]: '알림판',
  [TEACHER_SECTIONS.SUGGESTION]: '운영 건의',
};
