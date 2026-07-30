import { apiClient } from './client';
import type {
  CounselingCreateRequest,
  CounselingDeleteResponse,
  CounselingPost,
  CounselingUpdateRequest,
} from './types/counseling';

export function getMyCounselingPosts() {
  return apiClient<CounselingPost[]>('/api/counseling/my');
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
