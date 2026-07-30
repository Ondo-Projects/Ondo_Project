export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  username: string;
  role: UserRole;
}

export interface MeResponse {
  username: string;
  role: UserRole;
  name?: string;
  schoolName?: string;
  schoolCode?: string;
}
