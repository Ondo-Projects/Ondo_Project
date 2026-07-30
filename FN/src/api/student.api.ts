import { apiClient } from './client';
import { ApiError } from './types/api-error';
import type { ProfileSchoolResponse } from './types/home';
import type { StudentAssignment, StudentNotice } from './types/student';
import type {
  StudentAssignmentRegisterRequest,
  StudentClassProfile,
  StudentClassProfileUpdateRequest,
  MoodLevelCode,
  MoodRecordResponse,
  MoodTodayResponse,
  PreCounselingProfile,
  PreCounselingProfileSaveRequest,
  PreCounselingProfileSaveResponse,
} from './types/student';

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

export function getStudentClassProfile() {
  return apiClient<StudentClassProfile>('/api/student/profile/class');
}

export function updateStudentClassProfile(body: StudentClassProfileUpdateRequest) {
  return apiClient<StudentClassProfile>('/api/student/profile/class', {
    method: 'PATCH',
    body,
  });
}

export function registerStudentAssignment(body: StudentAssignmentRegisterRequest) {
  return apiClient<StudentAssignment>('/api/student/assignment', {
    method: 'POST',
    body,
  });
}

export function getStudentTodayMood() {
  return apiClient<MoodTodayResponse>('/api/student/mood/today');
}

export function saveStudentTodayMood(moodLevel: MoodLevelCode) {
  return apiClient<MoodRecordResponse>('/api/student/mood', {
    method: 'POST',
    body: { moodLevel },
  });
}

export function getStudentPreCounselingProfile() {
  return apiClient<PreCounselingProfile>('/api/student/pre-counseling-profile');
}

export function saveStudentPreCounselingProfile(body: PreCounselingProfileSaveRequest) {
  return apiClient<PreCounselingProfileSaveResponse>('/api/student/pre-counseling-profile', {
    method: 'PUT',
    body,
  });
}
