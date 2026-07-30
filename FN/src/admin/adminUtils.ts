import type { UserRole } from '../api/types/auth';
import { ROLE_LABELS } from './constants';

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }
  return value.replace('T', ' ').slice(0, 16);
}

export function getRoleBadgeClass(role: UserRole): string {
  return `admin-badge admin-badge--role-${role.toLowerCase()}`;
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
  if (error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
}
