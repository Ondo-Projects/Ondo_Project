import { apiClient } from './client';
import type { LoginRequest, LoginResponse, MeResponse } from './types/auth';

/** 로그인 — 토큰은 응답 쿠키(httpOnly)로 저장되고, 본문에는 사용자 정보만 옵니다. */
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

export function logout() {
  return apiClient<{ message: string }>('/api/auth/logout', {
    method: 'POST',
    auth: false,
    skipAuthRetry: true,
  });
}
