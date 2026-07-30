/** React Router location.state for /login */
export interface LoginLocationState {
  from?: string;
  signupSuccess?: boolean;
  username?: string;
  message?: string;
}

export const SIGNUP_SUCCESS_MESSAGE = '회원가입이 완료되었습니다. 로그인해 주세요.';

export function getSignupSuccessMessage(message?: string): string {
  return message?.trim() || SIGNUP_SUCCESS_MESSAGE;
}
