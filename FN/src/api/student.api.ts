import { apiClient } from './client';
import { ApiError } from './types/api-error';
import type { ProfileSchoolResponse } from './types/home';
import type { StudentAssignment, StudentNotice } from './types/student';

export {
  getTodayMeals as getStudentTodayMeals,
  getTodayTimetable as getStudentTodayTimetable,
  getUpcomingSchoolSchedule as getStudentUpcomingSchoolSchedule,
} from './home.api';
export type {
  MealDayResponse,
  SchoolScheduleUpcomingResponse,
  TimetableDayResponse,
  WeatherTodayResponse,
} from './types/home';

export function getStudentProfileSchool() {
  return apiClient<ProfileSchoolResponse>('/api/student/profile/school');
}

export function getStudentTodayWeather() {
  return apiClient<import('./types/home').WeatherTodayResponse>('/api/student/weather/today');
}

export function getStudentNotices() {
  return apiClient<StudentNotice[]>('/api/student/notices');
}

export async function getStudentAssignmentOptional(): Promise<StudentAssignment | null> {
  try {
    return await apiClient<StudentAssignment>('/api/student/assignment');
  } catch (error) {
    if (error instanceof ApiError) {
      return null;
    }
    throw error;
  }
}
