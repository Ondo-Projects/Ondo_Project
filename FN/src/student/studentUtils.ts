import type { SchoolScheduleItem } from '../api/types/home';
import type { MealDayResponse, TimetableDayResponse } from '../api/types/home';
import {
  formatScheduleDate,
  resolveScheduleStatus,
  scheduleDisplayMessage,
  scheduleStatusClass,
  truncateText,
} from '../home/homeUtils';

export {
  formatScheduleDate,
  truncateText,
  resolveScheduleStatus,
  scheduleDisplayMessage,
  scheduleStatusClass,
};

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }
  return value.replace('T', ' ').slice(0, 16);
}

export function formatScheduleDateShort(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' }).format(date);
}

export function formatScheduleEventDate(event: MergedScheduleEvent): string {
  if (event.fromDate && event.toDate && event.fromDate !== event.toDate) {
    return `${formatScheduleDateShort(event.fromDate)} ~ ${formatScheduleDateShort(event.toDate)}`;
  }
  return formatScheduleDate(event.fromDate);
}

export interface MergedScheduleEvent {
  fromDate: string;
  toDate: string;
  eventName: string;
  eventContent?: string | null;
}

function normalizeScheduleEventName(name: string | null | undefined): string {
  return String(name || '').replace(/\s+/g, ' ').trim();
}

function isConsecutiveScheduleDate(previousDate: string, nextDate: string): boolean {
  const previous = new Date(`${previousDate}T00:00:00`);
  const next = new Date(`${nextDate}T00:00:00`);
  if (Number.isNaN(previous.getTime()) || Number.isNaN(next.getTime())) {
    return false;
  }
  const diffDays = Math.round((next.getTime() - previous.getTime()) / 86400000);
  return diffDays === 1;
}

export function mergeConsecutiveScheduleEvents(events: SchoolScheduleItem[]): MergedScheduleEvent[] {
  if (!events.length) {
    return [];
  }

  const sorted = [...events].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const merged: MergedScheduleEvent[] = [];
  let current: MergedScheduleEvent | null = null;

  for (const event of sorted) {
    const eventName = normalizeScheduleEventName(event.eventName);
    if (!eventName) {
      continue;
    }

    if (
      current &&
      normalizeScheduleEventName(current.eventName) === eventName &&
      isConsecutiveScheduleDate(current.toDate, event.date)
    ) {
      current.toDate = event.date;
      if (event.eventContent && !current.eventContent) {
        current.eventContent = event.eventContent;
      }
      continue;
    }

    if (current) {
      merged.push(current);
    }

    current = {
      fromDate: event.date,
      toDate: event.date,
      eventName: event.eventName,
      eventContent: event.eventContent ?? null,
    };
  }

  if (current) {
    merged.push(current);
  }

  return merged;
}

export function resolveMealStatus(data: MealDayResponse): string {
  if (data.status) {
    return data.status;
  }
  if (data.meals?.length) {
    return 'OK';
  }
  return 'NO_MEALS';
}

export function mealDisplayMessage(data: MealDayResponse, status: string): string {
  if (data.message) {
    return data.message;
  }
  switch (status) {
    case 'NO_MEALS':
      return '오늘 등록된 급식 정보가 없습니다. 방학·주말·공휴일에는 급식이 등록되지 않을 수 있습니다.';
    case 'MAPPING_FAILED':
      return '급식 정보 연동 준비 중입니다. 학교 급식 정보가 곧 표시됩니다.';
    case 'UNAVAILABLE':
      return '급식 정보를 일시적으로 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.';
    default:
      return '오늘 등록된 급식 정보가 없습니다.';
  }
}

export function mealStatusClass(status: string): string {
  if (status === 'MAPPING_FAILED' || status === 'UNAVAILABLE') {
    return 'student-status student-status--warn';
  }
  if (status === 'NO_MEALS') {
    return 'student-status student-status--info';
  }
  return 'student-status';
}

export function resolveTimetableStatus(data: TimetableDayResponse): string {
  if (data.status) {
    return data.status;
  }
  if (data.periods?.length) {
    return 'OK';
  }
  return 'NO_CLASSES';
}

export function timetableDisplayMessage(data: TimetableDayResponse, status: string): string {
  if (data.message) {
    return data.message;
  }
  switch (status) {
    case 'NO_CLASSES':
      return '오늘 등록된 시간표가 없습니다. 방학·주말·공휴일에는 수업이 없을 수 있습니다.';
    case 'PROFILE_INCOMPLETE':
      return '학년·반을 입력하면 시간표를 볼 수 있습니다.';
    case 'MAPPING_FAILED':
      return '시간표 연동 준비 중입니다. 학교 시간표 정보가 곧 표시됩니다.';
    case 'UNAVAILABLE':
      return '시간표를 일시적으로 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.';
    default:
      return '오늘 등록된 시간표가 없습니다.';
  }
}

export function timetableStatusClass(status: string): string {
  if (status === 'MAPPING_FAILED' || status === 'UNAVAILABLE') {
    return 'student-status student-status--warn';
  }
  if (status === 'NO_CLASSES' || status === 'PROFILE_INCOMPLETE') {
    return 'student-status student-status--info';
  }
  return 'student-status';
}

export function buildMealSchoolHint(
  schoolName: string | null | undefined,
  region: string | null | undefined,
): string {
  if (schoolName) {
    return `${schoolName} 급식과 ${region || '학교 지역'} 날씨입니다.`;
  }
  return '우리 학교 급식과 지역 날씨입니다.';
}

export function buildTimetableProfileHint(data: TimetableDayResponse): string {
  const status = resolveTimetableStatus(data);
  if (status === 'OK' && data.grade && data.classNumber) {
    return `${data.grade}학년 ${data.classNumber}반 오늘 수업입니다.`;
  }
  if (status === 'PROFILE_INCOMPLETE') {
    return '아래 학년·반 카드에서 입력하면 시간표를 볼 수 있습니다.';
  }
  return '학년·반이 등록되면 오늘 수업을 확인할 수 있습니다.';
}

export function formatTeacherDisplay(assignment: {
  teacherName?: string | null;
  teacherUsername: string;
}): string {
  if (assignment.teacherName?.trim()) {
    return assignment.teacherName.trim();
  }
  return assignment.teacherUsername || '-';
}

export function scrollToStudentSection(sectionId: string) {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
