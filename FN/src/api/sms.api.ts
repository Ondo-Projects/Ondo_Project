import { apiClient } from './client';
import type {
  GuardianSmsSendRequest,
  GuardianSmsVerifyRequest,
  MessageResponse,
} from './types/signup';

export function sendGuardianSms(request: GuardianSmsSendRequest) {
  return apiClient<MessageResponse>('/api/auth/sms/send', {
    method: 'POST',
    body: request,
    auth: false,
  });
}

export function verifyGuardianSms(request: GuardianSmsVerifyRequest) {
  return apiClient<MessageResponse>('/api/auth/sms/verify', {
    method: 'POST',
    body: request,
    auth: false,
  });
}
