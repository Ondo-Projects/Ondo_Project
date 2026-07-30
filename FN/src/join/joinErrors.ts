import { ApiError } from '../api/types/api-error';

const SERVER_ERROR_FALLBACK = '회원가입하지 못했어요. 잠시 후 다시 시도해 주세요.';

export function mapSignupError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message || SERVER_ERROR_FALLBACK;
  }

  return SERVER_ERROR_FALLBACK;
}

export function mapVerificationError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }

  return fallback;
}
