import type { UserRole } from '../api/types/auth';
import { PATHS } from '../routes/paths';

export function getPostLoginPath(role: UserRole): string {
  switch (role) {
    case 'ADMIN':
      return PATHS.ADMIN;
    case 'STUDENT':
    case 'TEACHER':
    default:
      return PATHS.HOME;
  }
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
