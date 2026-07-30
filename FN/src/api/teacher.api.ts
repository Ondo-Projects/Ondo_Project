import { apiClient } from './client';
import type { ProfileSchoolResponse } from './types/home';
import type {
  InviteCodeResponse,
  StudentMoodSummary,
  TeacherNotice,
  TeacherNoticeCreateRequest,
  TeacherNoticeDeleteResponse,
  TeacherNotificationSettings,
  TeacherNotificationSettingsUpdateRequest,
  TeacherPreCounselingProfile,
  TeacherSuggestionCreateRequest,
  TeacherSuggestionPost,
  TeacherSuggestionUpdateRequest,
  TeacherWeeklyMoodResponse,
} from './types/teacher';
import type { PreCounselingProfileSummary } from './types/home';

export function getTeacherProfileSchool() {
  return apiClient<ProfileSchoolResponse>('/api/teacher/profile/school');
}

export function getTeacherNotificationSettings() {
  return apiClient<TeacherNotificationSettings>('/api/teacher/profile/notification-settings');
}

export function updateTeacherNotificationSettings(body: TeacherNotificationSettingsUpdateRequest) {
  return apiClient<TeacherNotificationSettings>('/api/teacher/profile/notification-settings', {
    method: 'PUT',
    body,
  });
}

export function getTeacherInviteCode() {
  return apiClient<InviteCodeResponse>('/api/teacher/invite-code');
}

export function regenerateTeacherInviteCode() {
  return apiClient<InviteCodeResponse>('/api/teacher/invite-code/regenerate', {
    method: 'POST',
  });
}

export function getTeacherNotices() {
  return apiClient<TeacherNotice[]>('/api/teacher/notices');
}

export function createTeacherNotice(body: TeacherNoticeCreateRequest) {
  return apiClient<TeacherNotice>('/api/teacher/notices', {
    method: 'POST',
    body,
  });
}

export function deleteTeacherNotice(id: number) {
  return apiClient<TeacherNoticeDeleteResponse>(`/api/teacher/notices/${id}`, {
    method: 'DELETE',
  });
}

export function getTeacherTodayMoodSummaries() {
  return apiClient<StudentMoodSummary[]>('/api/teacher/mood/today');
}

export function getTeacherWeeklyMoodSummaries() {
  return apiClient<TeacherWeeklyMoodResponse>('/api/teacher/mood/weekly');
}

export function getTeacherPreCounselingProfiles() {
  return apiClient<PreCounselingProfileSummary[]>('/api/teacher/pre-counseling-profiles');
}

export function getTeacherPreCounselingProfile(studentUsername: string) {
  return apiClient<TeacherPreCounselingProfile>(
    `/api/teacher/pre-counseling-profiles/${encodeURIComponent(studentUsername)}`,
  );
}

export function getTeacherSuggestions() {
  return apiClient<TeacherSuggestionPost[]>('/api/teacher/suggestions');
}

export function getTeacherSuggestion(id: number) {
  return apiClient<TeacherSuggestionPost>(`/api/teacher/suggestions/${id}`);
}

export function createTeacherSuggestion(body: TeacherSuggestionCreateRequest) {
  return apiClient<TeacherSuggestionPost>('/api/teacher/suggestions', {
    method: 'POST',
    body,
  });
}

export function updateTeacherSuggestion(id: number, body: TeacherSuggestionUpdateRequest) {
  return apiClient<TeacherSuggestionPost>(`/api/teacher/suggestions/${id}`, {
    method: 'PUT',
    body,
  });
}

export function deleteTeacherSuggestion(id: number) {
  return apiClient<{ message: string }>(`/api/teacher/suggestions/${id}`, {
    method: 'DELETE',
  });
}
