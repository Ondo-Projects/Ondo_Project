export interface FindIdSendRequest {
  name: string;
  email: string;
  birthDate: string;
}

export interface FindIdVerifyRequest {
  name: string;
  email: string;
  birthDate: string;
  code: string;
}

export interface FindIdVerifyResponse {
  username: string;
  maskedUsername: string;
  message: string;
}

export interface PasswordRecoverySendRequest {
  username: string;
  email: string;
}

export interface PasswordRecoveryResetRequest {
  username: string;
  email: string;
  code: string;
  password: string;
  passwordConfirm: string;
}

export interface MessageResponse {
  message: string;
}
