import { apiClient } from './client';
import type { AccountWithdrawRequest, MessageResponse } from './types/withdraw';

export function withdrawAccount(request: AccountWithdrawRequest) {
  return apiClient<MessageResponse>('/api/auth/me/withdraw', {
    method: 'POST',
    body: request,
  });
}
