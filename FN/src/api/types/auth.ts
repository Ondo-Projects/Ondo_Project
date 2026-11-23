export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN';

export interface LoginRequest {
  username: string;
  password: string;
}

/** 로그인 응답 본문 — 토큰은 httpOnly 쿠키로만 전달됩니다. */
export interface LoginResponse {
  username: string;
  role: UserRole;
}

export interface MeResponse {
  username: string;
  role: UserRole;
  name?: string | null;
  schoolName?: string | null;
  schoolRegion?: string | null;
}

export interface AuthUser extends MeResponse {}
