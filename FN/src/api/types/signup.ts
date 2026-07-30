import type { UserRole } from './auth';

/** 회원가입 가능 역할 (ADMIN 제외) */
export type SignUpRole = Extract<UserRole, 'STUDENT' | 'TEACHER'>;

export type GuardianRelation = 'FATHER' | 'MOTHER' | 'OTHER';

/** BN SignUpRequestDTO 대응 */
export interface SignUpRequest {
  role: SignUpRole;
  schoolCode: string;
  name?: string;
  birthDate?: string;
  username: string;
  password: string;
  passwordConfirm: string;
  email?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianRelation?: GuardianRelation;
  agreeGuardianChildPrivacy?: boolean;
  agreeGuardianChildSensitive?: boolean;
  agreeGuardianIdentity?: boolean;
  agreeService: boolean;
  agreePrivacy: boolean;
  agreeSensitive: boolean;
}

export interface SignUpResponse {
  username: string;
  role: SignUpRole;
  message: string;
}

export interface School {
  schoolCode: string;
  schoolName: string;
  region: string;
  schoolType: string;
}

export type SchoolTypeFilter = '' | '중' | '고';

export interface UsernameCheckResponse {
  available: boolean;
  message: string;
}

export interface EmailSendRequest {
  email: string;
  role: SignUpRole;
}

export interface EmailVerifyRequest {
  email: string;
  code: string;
  role: SignUpRole;
}

export interface EmailStatusResponse {
  verified: boolean;
}

export interface MessageResponse {
  message: string;
}

export interface GuardianSmsSendRequest {
  studentName: string;
  guardianName: string;
  phone: string;
}

export interface GuardianSmsVerifyRequest {
  phone: string;
  code: string;
}
