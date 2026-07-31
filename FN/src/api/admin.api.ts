import { apiClient } from './client';
import type {
  AdminActivityLog,
  AdminCounselingAccessLog,
  AdminDashboardResponse,
  AdminNeisSyncResponse,
  AdminPageResponse,
  AdminPreCounselAccessLog,
  AdminSchoolSearchParams,
  AdminSchoolSummary,
  AdminSchoolSyncResponse,
  AdminStatisticsResponse,
  AdminSuggestionReplyRequest,
  AdminSuggestionSearchParams,
  AdminSuggestionStatusRequest,
  AdminSuggestionSummary,
  AdminSystemStatusResponse,
  AdminUserSchoolChangeRequest,
  AdminUserSearchParams,
  AdminUserStatusRequest,
  AdminUserSummary,
} from './types/admin';
import type {
  AnnouncementCreateRequest,
  AnnouncementDetail,
  AnnouncementPageResponse,
  AnnouncementUpdateRequest,
} from './types/announcement';
import type { SuggestionPost } from './types/suggestion';

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '') {
      return;
    }
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

export function getAdminDashboard() {
  return apiClient<AdminDashboardResponse>('/api/admin/dashboard');
}

export function getAdminSystemStatus() {
  return apiClient<AdminSystemStatusResponse>('/api/admin/system-status');
}

export function getAdminStatistics() {
  return apiClient<AdminStatisticsResponse>('/api/admin/statistics');
}

export function searchAdminUsers(params: AdminUserSearchParams) {
  return apiClient<AdminPageResponse<AdminUserSummary>>(
    `/api/admin/users${buildQuery({
      role: params.role || undefined,
      keyword: params.keyword,
      schoolCode: params.schoolCode,
      page: params.page ?? 0,
      size: params.size ?? 20,
    })}`,
  );
}

export function updateAdminUserStatus(username: string, body: AdminUserStatusRequest) {
  return apiClient<AdminUserSummary>(`/api/admin/users/${encodeURIComponent(username)}/status`, {
    method: 'PATCH',
    body,
  });
}

export function changeAdminUserSchool(username: string, body: AdminUserSchoolChangeRequest) {
  return apiClient<AdminUserSummary>(`/api/admin/users/${encodeURIComponent(username)}/school`, {
    method: 'PATCH',
    body,
  });
}

export function searchAdminSchools(params: AdminSchoolSearchParams) {
  const mapped =
    params.mapped === true ? true : params.mapped === false ? false : undefined;
  return apiClient<AdminPageResponse<AdminSchoolSummary>>(
    `/api/admin/schools${buildQuery({
      keyword: params.keyword,
      mapped,
      page: params.page ?? 0,
      size: params.size ?? 20,
    })}`,
  );
}

export function syncAdminSchoolsCsv() {
  return apiClient<AdminSchoolSyncResponse>('/api/admin/schools/sync-csv', {
    method: 'POST',
  });
}

export function syncAdminNeisSchools(limit = 50) {
  return apiClient<AdminNeisSyncResponse>(`/api/admin/schools/sync-neis?limit=${limit}`, {
    method: 'POST',
  });
}

export function getAdminActivityLogs(page = 0, size = 20) {
  return apiClient<AdminPageResponse<AdminActivityLog>>(
    `/api/admin/activity-logs${buildQuery({ page, size })}`,
  );
}

export function getAdminCounselingAccessLogs(page = 0, size = 20) {
  return apiClient<AdminPageResponse<AdminCounselingAccessLog>>(
    `/api/admin/access-logs/counseling${buildQuery({ page, size })}`,
  );
}

export function getAdminPreCounselAccessLogs(page = 0, size = 20) {
  return apiClient<AdminPageResponse<AdminPreCounselAccessLog>>(
    `/api/admin/access-logs/pre-counseling${buildQuery({ page, size })}`,
  );
}

export function searchAdminSuggestions(params: AdminSuggestionSearchParams) {
  return apiClient<AdminPageResponse<AdminSuggestionSummary>>(
    `/api/admin/suggestions${buildQuery({
      status: params.status || undefined,
      category: params.category || undefined,
      role: params.role || undefined,
      keyword: params.keyword,
      page: params.page ?? 0,
      size: params.size ?? 20,
    })}`,
  );
}

export function getAdminSuggestion(id: number) {
  return apiClient<SuggestionPost>(`/api/admin/suggestions/${id}`);
}

export function updateAdminSuggestionStatus(id: number, body: AdminSuggestionStatusRequest) {
  return apiClient<SuggestionPost>(`/api/admin/suggestions/${id}/status`, {
    method: 'PATCH',
    body,
  });
}

export function replyAdminSuggestion(id: number, body: AdminSuggestionReplyRequest) {
  return apiClient<SuggestionPost>(`/api/admin/suggestions/${id}/reply`, {
    method: 'POST',
    body,
  });
}

export function getAdminAnnouncements(page = 0, size = 20) {
  return apiClient<AnnouncementPageResponse>(
    `/api/admin/announcements?page=${page}&size=${size}`,
  );
}

export function createAdminAnnouncement(body: AnnouncementCreateRequest) {
  return apiClient<AnnouncementDetail>('/api/admin/announcements', {
    method: 'POST',
    body,
  });
}

export function updateAdminAnnouncement(id: number, body: AnnouncementUpdateRequest) {
  return apiClient<AnnouncementDetail>(`/api/admin/announcements/${id}`, {
    method: 'PATCH',
    body,
  });
}

export function deleteAdminAnnouncement(id: number) {
  return apiClient<{ message: string }>(`/api/admin/announcements/${id}`, {
    method: 'DELETE',
  });
}
