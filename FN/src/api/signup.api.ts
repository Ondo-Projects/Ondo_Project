import { apiClient } from './client';
import type { SignUpRequest, SignUpResponse } from './types/signup';

export function signUp(request: SignUpRequest) {
  return apiClient<SignUpResponse>('/api/auth/signup', {
    method: 'POST',
    body: request,
    auth: false,
  });
}
