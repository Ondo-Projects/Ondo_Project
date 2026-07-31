import { apiClient } from './client';
import type {
  EmailSendRequest,
  EmailStatusResponse,
  EmailVerifyRequest,
  MessageResponse,
} from './types/signup';

export function sendEmailCode(request: EmailSendRequest) {
  return apiClient<MessageResponse>('/api/auth/email/send', {
    method: 'POST',
    body: request,
    auth: false,
  });
}

export function verifyEmailCode(request: EmailVerifyRequest) {
  return apiClient<MessageResponse>('/api/auth/email/verify', {
    method: 'POST',
    body: request,
    auth: false,
  });
}

export function getEmailStatus(request: EmailSendRequest) {
  return apiClient<EmailStatusResponse>('/api/auth/email/status', {
    method: 'POST',
    body: request,
    auth: false,
  });
}
