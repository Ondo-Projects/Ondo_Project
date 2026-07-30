import { apiClient } from './client';
import type {
  CounselingCreateRequest,
  CounselingDeleteResponse,
  CounselingPost,
  CounselingStatus,
  CounselingUpdateRequest,
} from './types/counseling';

export function getMyCounselingPosts() {
  return apiClient<CounselingPost[]>('/api/counseling/my');
}

export function getTeacherCounselingPosts(status?: CounselingStatus) {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiClient<CounselingPost[]>(`/api/counseling/teacher${query}`);
}

export function getTeacherUnreadCount() {
  return apiClient<{ count: number }>('/api/counseling/unread-count');
}

export function getCounselingPost(id: number) {
  return apiClient<CounselingPost>(`/api/counseling/${id}`);
}

export function createCounselingPost(body: CounselingCreateRequest) {
  return apiClient<CounselingPost>('/api/counseling', {
    method: 'POST',
    body,
  });
}

export function updateCounselingPost(id: number, body: CounselingUpdateRequest) {
  return apiClient<CounselingPost>(`/api/counseling/${id}`, {
    method: 'PUT',
    body,
  });
}

export function deleteCounselingPost(id: number) {
  return apiClient<CounselingDeleteResponse>(`/api/counseling/${id}`, {
    method: 'DELETE',
  });
}

export function updateCounselingStatus(id: number, status: CounselingStatus) {
  return apiClient<CounselingPost>(`/api/counseling/${id}/status`, {
    method: 'PATCH',
    body: { status },
  });
}

export function replyCounselingPost(id: number, reply: string) {
  return apiClient<CounselingPost>(`/api/counseling/${id}/reply`, {
    method: 'POST',
    body: { reply },
  });
}
