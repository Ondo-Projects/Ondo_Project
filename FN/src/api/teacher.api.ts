import { apiClient } from './client';
import type { ProfileSchoolResponse } from './types/home';
import type {
  ClassReleaseResult,
  ClassStudent,
  InviteCodeResponse,
  StudentAttention,
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

/** 먼저 살펴보면 좋을 학생 (오늘 '힘듦', 최근 기분 저하, 진행 중인 학교폭력 상담) */
export function getTeacherAttention() {
  return apiClient<StudentAttention[]>('/api/teacher/attention');
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

export function getTeacherHomeAggregate() {
  return apiClient<import('./types/home').TeacherHomeAggregateResponse>('/api/teacher/home');
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

/** 우리 반(연결된) 학생 목록 */
export function getClassStudents() {
  return apiClient<ClassStudent[]>('/api/teacher/class/students');
}

/** 학생 한 명 연결 해제 — 이 학생이 보낸 끝나지 않은 상담은 취소됩니다 */
export function releaseClassStudent(studentUsername: string) {
  return apiClient<ClassReleaseResult>(`/api/teacher/class/students/${encodeURIComponent(studentUsername)}`, {
    method: 'DELETE',
  });
}

/** 새 학기 학급 정리 — 연결을 모두 풀고 초대 코드를 새로 만듭니다 */
export function releaseClass() {
  return apiClient<ClassReleaseResult>('/api/teacher/class/release', { method: 'POST' });
}
