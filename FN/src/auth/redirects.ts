import type { UserRole } from '../api/types/auth';
import { PATHS } from '../routes/paths';

/**
 * 로그인 직후·첫 화면(/) 접속 시 이동할 곳 — 역할별 홈으로 바로 보냅니다.
 * (공통 "학교 홈"(/home)은 학생·교사 홈 상단 버튼으로 이동)
 */
export function getPostLoginPath(role: UserRole): string {
  return getRoleHomePath(role);
}

export function getRoleHomePath(role: UserRole): string {
  switch (role) {
    case 'STUDENT':
      return PATHS.STUDENT;
    case 'TEACHER':
      return PATHS.TEACHER;
    case 'ADMIN':
      return PATHS.ADMIN;
    default:
      return PATHS.HOME;
  }
}
