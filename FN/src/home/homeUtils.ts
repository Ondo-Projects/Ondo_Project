import type { AuthUser } from '../api/types/auth';
import type {
  MealDayResponse,
  ProfileSchoolResponse,
  SchoolScheduleUpcomingResponse,
  TimetableDayResponse,
} from '../api/types/home';

export function truncateText(text: string | null | undefined, maxLength: number): string {
  if (!text) {
    return '';
  }
  const normalized = String(text).replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength)}…`;
}

export function formatTodayDate(): string {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'full' }).format(new Date());
}

export function formatScheduleDate(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(date);
}

export function formatSchoolTypeLabel(schoolType: string | null | undefined): string {
  if (schoolType === '중') return '중학교';
  if (schoolType === '고') return '고등학교';
  return schoolType || '-';
}

export function resolveSchoolName(user: AuthUser, schoolProfile: ProfileSchoolResponse | null): string {
  if (schoolProfile?.schoolName?.trim()) {
    return schoolProfile.schoolName.trim();
  }
  if (user.schoolName?.trim()) {
    return user.schoolName.trim();
  }
  return '학교 미등록';
}

export function buildUserGreeting(user: AuthUser, schoolProfile: ProfileSchoolResponse | null): string {
  const displayName = user.name?.trim() || user.username;
  return `${displayName} · ${resolveSchoolName(user, schoolProfile)}`;
}

export function buildSchoolMeta(
  user: AuthUser,
  schoolProfile: ProfileSchoolResponse | null,
): string {
  if (schoolProfile?.schoolName) {
    return `${schoolProfile.schoolName} · ${formatSchoolTypeLabel(schoolProfile.schoolType)} · ${schoolProfile.region || '지역 정보 없음'}`;
  }

  const fallbackSchool = resolveSchoolName(user, null);
  if (fallbackSchool === '학교 미등록') {
    return '등록된 학교가 없습니다. 학생·교사 홈에서 학교를 등록해 주세요.';
  }

  const region = user.schoolRegion?.trim() || '지역 정보 없음';
  return `${fallbackSchool} · ${region}`;
}

export function resolveScheduleStatus(data: SchoolScheduleUpcomingResponse): string {
  if (data.status) {
    return data.status;
  }
  if (data.events?.length) {
    return 'OK';
  }
  return 'NO_EVENTS';
}

export function scheduleDisplayMessage(data: SchoolScheduleUpcomingResponse, status: string): string {
  if (data.message) {
    return data.message;
  }
  switch (status) {
    case 'NO_EVENTS':
      return '다가오는 학사일정이 없습니다. 방학·주말에는 등록된 행사가 없을 수 있습니다.';
    case 'MAPPING_FAILED':
      return '학사일정 연동 준비 중입니다. 학교 일정 정보가 곧 표시됩니다.';
    case 'UNAVAILABLE':
      return '학사일정을 일시적으로 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.';
    default:
      return '다가오는 학사일정이 없습니다.';
  }
}

export function scheduleStatusClass(status: string): string {
  if (status === 'MAPPING_FAILED' || status === 'UNAVAILABLE') {
    return 'home-status home-status--warn';
  }
  if (status === 'NO_EVENTS') {
    return 'home-status home-status--info';
  }
  return 'home-status';
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
    return 'home-status home-status--warn';
  }
  if (status === 'NO_MEALS') {
    return 'home-status home-status--info';
  }
  return 'home-status';
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
      return '오늘 등록된 시간표가 없습니다.';
    case 'PROFILE_INCOMPLETE':
      return '학년·반을 입력하면 시간표를 볼 수 있습니다.';
    case 'MAPPING_FAILED':
      return '시간표 연동 준비 중입니다.';
    case 'UNAVAILABLE':
      return '시간표를 일시적으로 불러올 수 없습니다.';
    default:
      return '오늘 등록된 시간표가 없습니다.';
  }
}

export function timetableStatusClass(status: string): string {
  if (status === 'MAPPING_FAILED' || status === 'UNAVAILABLE') {
    return 'home-status home-status--warn';
  }
  if (status === 'NO_CLASSES' || status === 'PROFILE_INCOMPLETE') {
    return 'home-status home-status--info';
  }
  return 'home-status';
}
