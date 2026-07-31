import type { CounselingPost } from '../api/types/counseling';
import type {
  MealDayResponse,
  SchoolScheduleUpcomingResponse,
  TimetableDayResponse,
} from '../api/types/home';
import type { SuggestionPost } from '../api/types/suggestion';
import type { StudentNotice } from '../api/types/student';
import { MOOD_OPTIONS, STUDENT_SECTIONS } from './constants';
import {
  mergeConsecutiveScheduleEvents,
  resolveMealStatus,
  resolveScheduleStatus,
  resolveTimetableStatus,
} from './studentUtils';

export type TodayTodoTone = 'done' | 'pending' | 'warn' | '';

export interface TodayTodoItem {
  label: string;
  status: string;
  tone: TodayTodoTone;
  target: string;
  disabled?: boolean;
}

export interface StudentTodayTodoContext {
  pageLoading: boolean;
  hasAssignment: boolean;
  meals: MealDayResponse | null;
  schedule: SchoolScheduleUpcomingResponse | null;
  timetable: TimetableDayResponse | null;
  notices: StudentNotice[] | null;
  moodRecorded: boolean | null;
  moodSummary: string;
  preCounselCompleted: boolean | null;
  counselingPosts: CounselingPost[] | null;
  suggestions: SuggestionPost[] | null;
  suggestionsLoaded: boolean;
}

function getTodayDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function findTodayScheduleEvent(events: SchoolScheduleUpcomingResponse['events']) {
  if (!events?.length) {
    return null;
  }
  const todayKey = getTodayDateKey();
  return events.find((event) => event.date === todayKey) ?? null;
}

function buildAssignmentTodoItem(hasAssignment: boolean): TodayTodoItem | null {
  if (hasAssignment) {
    return null;
  }
  return {
    label: '담당 교사',
    status: '등록하기',
    tone: 'pending',
    target: STUDENT_SECTIONS.ASSIGNMENT,
  };
}

function buildMealTodoItem(meals: MealDayResponse | null, pageLoading: boolean): TodayTodoItem {
  if (pageLoading || !meals) {
    return {
      label: '오늘 급식',
      status: '불러오는 중…',
      tone: '',
      target: STUDENT_SECTIONS.TODAY,
      disabled: true,
    };
  }

  const status = resolveMealStatus(meals);
  if (status === 'OK' && meals.meals?.length) {
    const summary =
      meals.meals.length === 1 ? meals.meals[0].mealType : `${meals.meals.length}끼 확인`;
    return { label: '오늘 급식', status: summary, tone: 'done', target: STUDENT_SECTIONS.TODAY };
  }
  if (status === 'NO_MEALS') {
    return {
      label: '오늘 급식',
      status: '등록 없음',
      tone: 'pending',
      target: STUDENT_SECTIONS.TODAY,
    };
  }
  if (status === 'MAPPING_FAILED' || status === 'UNAVAILABLE') {
    return {
      label: '오늘 급식',
      status: status === 'MAPPING_FAILED' ? '연동 준비 중' : '일시 오류',
      tone: 'warn',
      target: STUDENT_SECTIONS.TODAY,
    };
  }
  return { label: '오늘 급식', status: '확인하기', tone: 'pending', target: STUDENT_SECTIONS.TODAY };
}

function buildSchoolScheduleTodoItem(
  schedule: SchoolScheduleUpcomingResponse | null,
  pageLoading: boolean,
): TodayTodoItem {
  if (pageLoading || !schedule) {
    return {
      label: '학사일정',
      status: '불러오는 중…',
      tone: '',
      target: STUDENT_SECTIONS.SCHOOL_CALENDAR,
      disabled: true,
    };
  }

  const status = resolveScheduleStatus(schedule);
  if (status === 'OK' && schedule.events?.length) {
    const todayEvent = findTodayScheduleEvent(schedule.events);
    if (todayEvent) {
      return {
        label: '학사일정',
        status: todayEvent.eventName,
        tone: 'pending',
        target: STUDENT_SECTIONS.SCHOOL_CALENDAR,
      };
    }
    const mergedCount = mergeConsecutiveScheduleEvents(schedule.events).length;
    return {
      label: '학사일정',
      status: `${mergedCount}건 예정`,
      tone: 'done',
      target: STUDENT_SECTIONS.SCHOOL_CALENDAR,
    };
  }
  if (status === 'NO_EVENTS') {
    return {
      label: '학사일정',
      status: '예정 없음',
      tone: 'done',
      target: STUDENT_SECTIONS.SCHOOL_CALENDAR,
    };
  }
  if (status === 'MAPPING_FAILED' || status === 'UNAVAILABLE') {
    return {
      label: '학사일정',
      status: status === 'MAPPING_FAILED' ? '연동 준비 중' : '일시 오류',
      tone: 'warn',
      target: STUDENT_SECTIONS.SCHOOL_CALENDAR,
    };
  }
  return {
    label: '학사일정',
    status: '확인하기',
    tone: 'pending',
    target: STUDENT_SECTIONS.SCHOOL_CALENDAR,
  };
}

function buildTimetableTodoItem(
  timetable: TimetableDayResponse | null,
  pageLoading: boolean,
): TodayTodoItem {
  if (pageLoading || !timetable) {
    return {
      label: '오늘 시간표',
      status: '불러오는 중…',
      tone: '',
      target: STUDENT_SECTIONS.TIMETABLE,
      disabled: true,
    };
  }

  const status = resolveTimetableStatus(timetable);
  if (status === 'PROFILE_INCOMPLETE') {
    return {
      label: '오늘 시간표',
      status: '학년·반 입력',
      tone: 'warn',
      target: STUDENT_SECTIONS.CLASS_PROFILE,
    };
  }
  if (status === 'OK' && timetable.periods?.length) {
    const firstPeriod = timetable.periods[0];
    const summary =
      timetable.periods.length === 1
        ? `${firstPeriod.period}교시 ${firstPeriod.subject}`
        : `${timetable.periods.length}교시`;
    return {
      label: '오늘 시간표',
      status: summary,
      tone: 'done',
      target: STUDENT_SECTIONS.TIMETABLE,
    };
  }
  if (status === 'NO_CLASSES') {
    return {
      label: '오늘 시간표',
      status: '수업 없음',
      tone: 'done',
      target: STUDENT_SECTIONS.TIMETABLE,
    };
  }
  if (status === 'MAPPING_FAILED' || status === 'UNAVAILABLE') {
    return {
      label: '오늘 시간표',
      status: status === 'MAPPING_FAILED' ? '연동 준비 중' : '일시 오류',
      tone: 'warn',
      target: STUDENT_SECTIONS.TIMETABLE,
    };
  }
  return {
    label: '오늘 시간표',
    status: '확인하기',
    tone: 'pending',
    target: STUDENT_SECTIONS.TIMETABLE,
  };
}

function buildMoodTodoItem(moodRecorded: boolean | null, moodSummary: string): TodayTodoItem {
  if (moodRecorded) {
    return {
      label: '마음 날씨',
      status: moodSummary || '기록 완료',
      tone: 'done',
      target: STUDENT_SECTIONS.MOOD,
    };
  }
  return {
    label: '마음 날씨',
    status: moodRecorded === null ? '불러오는 중…' : '오늘 기록하기',
    tone: moodRecorded === null ? '' : 'pending',
    target: STUDENT_SECTIONS.MOOD,
    disabled: moodRecorded === null,
  };
}

function buildNoticeTodoItem(
  hasAssignment: boolean,
  notices: StudentNotice[] | null,
): TodayTodoItem {
  if (!hasAssignment) {
    return {
      label: '선생님 알림',
      status: '담당 교사 등록 후',
      tone: 'warn',
      target: STUDENT_SECTIONS.ASSIGNMENT,
    };
  }
  if (notices === null) {
    return {
      label: '선생님 알림',
      status: '불러오는 중…',
      tone: '',
      target: STUDENT_SECTIONS.NOTICE,
      disabled: true,
    };
  }
  if (notices.length > 0) {
    return {
      label: '선생님 알림',
      status: `${notices.length}건 확인`,
      tone: 'pending',
      target: STUDENT_SECTIONS.NOTICE,
    };
  }
  return {
    label: '선생님 알림',
    status: '새 알림 없음',
    tone: 'done',
    target: STUDENT_SECTIONS.NOTICE,
  };
}

function buildPreCounselTodoItem(
  hasAssignment: boolean,
  preCounselCompleted: boolean | null,
): TodayTodoItem {
  if (!hasAssignment) {
    return {
      label: '사전 상담 카드',
      status: '담당 교사 등록 후',
      tone: 'warn',
      target: STUDENT_SECTIONS.ASSIGNMENT,
    };
  }
  if (preCounselCompleted) {
    return {
      label: '사전 상담 카드',
      status: '작성 완료',
      tone: 'done',
      target: STUDENT_SECTIONS.PRE_COUNSEL,
    };
  }
  return {
    label: '사전 상담 카드',
    status: preCounselCompleted === null ? '불러오는 중…' : '작성하기',
    tone: preCounselCompleted === null ? '' : 'pending',
    target: STUDENT_SECTIONS.PRE_COUNSEL,
    disabled: preCounselCompleted === null,
  };
}

function buildCounselTodoItem(
  hasAssignment: boolean,
  counselingPosts: CounselingPost[] | null,
): TodayTodoItem {
  if (!hasAssignment) {
    return {
      label: '상담',
      status: '담당 교사 등록 후',
      tone: 'warn',
      target: STUDENT_SECTIONS.ASSIGNMENT,
    };
  }
  if (counselingPosts === null) {
    return {
      label: '상담',
      status: '불러오는 중…',
      tone: '',
      target: STUDENT_SECTIONS.COUNSEL_LIST,
      disabled: true,
    };
  }

  const waitingCount = counselingPosts.filter((post) => post.status === 'WAITING').length;
  const confirmedCount = counselingPosts.filter((post) => post.status === 'CONFIRMED').length;
  if (waitingCount > 0) {
    return {
      label: '상담',
      status: `대기 ${waitingCount}건`,
      tone: 'pending',
      target: STUDENT_SECTIONS.COUNSEL_LIST,
    };
  }
  if (confirmedCount > 0) {
    return {
      label: '상담',
      status: `진행 ${confirmedCount}건`,
      tone: 'done',
      target: STUDENT_SECTIONS.COUNSEL_LIST,
    };
  }
  if (!counselingPosts.length) {
    return {
      label: '상담',
      status: '신청하기',
      tone: 'pending',
      target: STUDENT_SECTIONS.COUNSEL_CREATE,
    };
  }
  return {
    label: '상담',
    status: '목록 보기',
    tone: 'done',
    target: STUDENT_SECTIONS.COUNSEL_LIST,
  };
}

function buildSuggestionTodoItem(
  suggestions: SuggestionPost[] | null,
  suggestionsLoaded: boolean,
): TodayTodoItem {
  if (!suggestionsLoaded || suggestions === null) {
    return {
      label: '운영 건의',
      status: '불러오는 중…',
      tone: '',
      target: STUDENT_SECTIONS.SUGGESTION,
      disabled: true,
    };
  }

  const withReplyCount = suggestions.filter((item) => item.adminReply).length;
  if (withReplyCount > 0) {
    return {
      label: '운영 건의',
      status: `답변 ${withReplyCount}건`,
      tone: 'pending',
      target: STUDENT_SECTIONS.SUGGESTION,
    };
  }
  const awaitingReplyCount = suggestions.filter(
    (item) => !item.adminReply && item.status !== 'CLOSED',
  ).length;
  if (awaitingReplyCount > 0) {
    return {
      label: '운영 건의',
      status: `${awaitingReplyCount}건 접수 중`,
      tone: 'done',
      target: STUDENT_SECTIONS.SUGGESTION,
    };
  }
  return {
    label: '운영 건의',
    status: '건의하기',
    tone: 'pending',
    target: STUDENT_SECTIONS.SUGGESTION,
  };
}

export function buildMoodSummary(code: string | null | undefined): string {
  if (!code) {
    return '';
  }
  const option = MOOD_OPTIONS.find((item) => item.code === code);
  return option ? `${option.emoji} ${option.label}` : '';
}

export function buildStudentTodayTodos(context: StudentTodayTodoContext): TodayTodoItem[] {
  return [
    buildAssignmentTodoItem(context.hasAssignment),
    buildMealTodoItem(context.meals, context.pageLoading),
    buildSchoolScheduleTodoItem(context.schedule, context.pageLoading),
    buildTimetableTodoItem(context.timetable, context.pageLoading),
    buildMoodTodoItem(context.moodRecorded, context.moodSummary),
    buildNoticeTodoItem(context.hasAssignment, context.notices),
    buildPreCounselTodoItem(context.hasAssignment, context.preCounselCompleted),
    buildCounselTodoItem(context.hasAssignment, context.counselingPosts),
    buildSuggestionTodoItem(context.suggestions, context.suggestionsLoaded),
  ].filter((item): item is TodayTodoItem => item !== null);
}
