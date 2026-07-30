import { apiClient } from './client';
import type { UsernameCheckResponse } from './types/signup';

export function checkUsername(username: string) {
  const params = new URLSearchParams({ username: username.trim() });

  return apiClient<UsernameCheckResponse>(`/api/auth/username/check?${params.toString()}`, {
    auth: false,
  });
}
