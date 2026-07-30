import { apiClient } from './client';
import type { Announcement } from './types/announcement';
import type {
  CounselingPostSummary,
  MealDayResponse,
  PreCounselingProfileSummary,
  ProfileSchoolResponse,
  SchoolScheduleUpcomingResponse,
  TimetableDayResponse,
  UnreadCountResponse,
  WeatherTodayResponse,
} from './types/home';
import type { UserRole } from './types/auth';

export function getTodayWeather() {
  return apiClient<WeatherTodayResponse>('/api/common/weather/today');
}

export function getCommonAnnouncements() {
  return apiClient<Announcement[]>('/api/common/announcements');
}

export function getUpcomingSchoolSchedule(days = 14) {
  return apiClient<SchoolScheduleUpcomingResponse>(
    `/api/common/school-schedule/upcoming?days=${days}`,
  );
}

export function getProfileSchool(role: UserRole) {
  if (role === 'STUDENT') {
    return apiClient<ProfileSchoolResponse>('/api/student/profile/school');
  }
  if (role === 'TEACHER') {
    return apiClient<ProfileSchoolResponse>('/api/teacher/profile/school');
  }
  return Promise.resolve(null);
}

export function getTodayMeals() {
  return apiClient<MealDayResponse>('/api/student/meals/today');
}

export function getTodayTimetable() {
  return apiClient<TimetableDayResponse>('/api/student/timetable/today');
}

export function getTeacherUnreadCount() {
  return apiClient<UnreadCountResponse>('/api/counseling/unread-count');
}

export function getTeacherCounselingPosts() {
  return apiClient<CounselingPostSummary[]>('/api/counseling/teacher');
}

export function getTeacherPreCounselingProfiles() {
  return apiClient<PreCounselingProfileSummary[]>('/api/teacher/pre-counseling-profiles');
}
