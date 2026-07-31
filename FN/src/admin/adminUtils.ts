import type { BadgeVariant } from '../components/ui';
import type { UserRole } from '../api/types/auth';
import { ApiError } from '../api/types/api-error';
import { ROLE_LABELS } from './constants';

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }
  return value.replace('T', ' ').slice(0, 16);
}

export function getRoleBadgeVariant(role: UserRole): BadgeVariant {
  switch (role) {
    case 'STUDENT':
      return 'student';
    case 'TEACHER':
      return 'teacher';
    case 'ADMIN':
      return 'admin';
    default:
      return 'neutral';
  }
}

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role] ?? role;
}

export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '-';
  }
  return String(value);
}

export function resolveErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
}
