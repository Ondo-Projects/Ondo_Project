import { apiClient } from './client';
import type {
  FindIdSendRequest,
  FindIdVerifyRequest,
  FindIdVerifyResponse,
  MessageResponse,
  PasswordRecoveryResetRequest,
  PasswordRecoverySendRequest,
} from './types/recovery';

export function sendFindIdCode(request: FindIdSendRequest) {
  return apiClient<MessageResponse>('/api/auth/recovery/id/send', {
    method: 'POST',
    body: request,
    auth: false,
  });
}

export function verifyFindIdCode(request: FindIdVerifyRequest) {
  return apiClient<FindIdVerifyResponse>('/api/auth/recovery/id/verify', {
    method: 'POST',
    body: request,
    auth: false,
  });
}

export function sendPasswordResetCode(request: PasswordRecoverySendRequest) {
  return apiClient<MessageResponse>('/api/auth/recovery/password/send', {
    method: 'POST',
    body: request,
    auth: false,
  });
}

export function resetPassword(request: PasswordRecoveryResetRequest) {
  return apiClient<MessageResponse>('/api/auth/recovery/password/reset', {
    method: 'POST',
    body: request,
    auth: false,
  });
}
