import { apiClient } from './client';
import type { LoginRequest, LoginResponse, MeResponse } from './types/auth';

export function login(request: LoginRequest) {
  return apiClient<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: request,
    auth: false,
  });
}

export function getMe() {
  return apiClient<MeResponse>('/api/auth/me');
}

export function refreshToken(refreshToken: string) {
  return apiClient<LoginResponse>('/api/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
    auth: false,
  });
}

export function logout(refreshToken: string) {
  return apiClient<void>('/api/auth/logout', {
    method: 'POST',
    body: { refreshToken },
    auth: false,
  });
}
