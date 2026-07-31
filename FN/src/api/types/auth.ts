export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  username: string;
  role: UserRole;
}

export interface TokenRefreshResponse {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
}

export interface MeResponse {
  username: string;
  role: UserRole;
  name?: string | null;
  schoolName?: string | null;
  schoolRegion?: string | null;
}

export interface AuthUser extends MeResponse {}
