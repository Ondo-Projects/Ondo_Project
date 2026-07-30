import { apiClient } from './client';
import type {
  SuggestionCreateRequest,
  SuggestionDeleteResponse,
  SuggestionPost,
  SuggestionUpdateRequest,
} from './types/suggestion';

export function getMySuggestions() {
  return apiClient<SuggestionPost[]>('/api/student/suggestions');
}

export function getSuggestion(id: number) {
  return apiClient<SuggestionPost>(`/api/student/suggestions/${id}`);
}

export function createSuggestion(body: SuggestionCreateRequest) {
  return apiClient<SuggestionPost>('/api/student/suggestions', {
    method: 'POST',
    body,
  });
}

export function updateSuggestion(id: number, body: SuggestionUpdateRequest) {
  return apiClient<SuggestionPost>(`/api/student/suggestions/${id}`, {
    method: 'PUT',
    body,
  });
}

export function deleteSuggestion(id: number) {
  return apiClient<SuggestionDeleteResponse>(`/api/student/suggestions/${id}`, {
    method: 'DELETE',
  });
}
