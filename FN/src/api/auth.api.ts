import { apiClient } from './client';
import type {
  LoginRequest,
  LoginResponse,
  MeResponse,
  TokenRefreshResponse,
} from './types/auth';

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

export function refreshToken(refreshTokenValue: string) {
  return apiClient<TokenRefreshResponse>('/api/auth/refresh', {
    method: 'POST',
    body: { refreshToken: refreshTokenValue },
    auth: false,
    skipAuthRetry: true,
  });
}

export function logout(refreshTokenValue: string | null) {
  return apiClient<{ message: string }>('/api/auth/logout', {
    method: 'POST',
    body: refreshTokenValue ? { refreshToken: refreshTokenValue } : undefined,
    auth: false,
    skipAuthRetry: true,
  });
}
