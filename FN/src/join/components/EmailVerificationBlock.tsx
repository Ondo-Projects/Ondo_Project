import { useState } from 'react';
import { getEmailStatus, sendEmailCode, verifyEmailCode } from '../../api/email.api';
import type { SignUpRole } from '../../api/types/signup';
import { mapVerificationError } from '../joinErrors';
import JoinField from './JoinField';
import VerificationFeedback from './VerificationFeedback';

interface EmailVerificationBlockProps {
  id: string;
  codeFieldId: string;
  label: string;
  placeholder: string;
  helper?: string;
  required?: boolean;
  role: SignUpRole;
  email: string;
  emailVerified: boolean;
  emailError?: string;
  onEmailChange: (email: string) => void;
  onVerifiedChange: (verified: boolean) => void;
  validateEmail: (email: string) => string | null;
}

export default function EmailVerificationBlock({
  id,
  codeFieldId,
  label,
  placeholder,
  helper,
  required = false,
  role,
  email,
  emailVerified,
  emailError,
  onEmailChange,
  onVerifiedChange,
  validateEmail,
}: EmailVerificationBlockProps) {
  const [verificationCode, setVerificationCode] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  async function handleSendCode() {
    setStatusMessage(null);
    const validationError = validateEmail(email);
    if (validationError) {
      setStatusMessage(validationError);
      return;
    }

    setIsSending(true);
    try {
      const response = await sendEmailCode({ email: email.trim(), role });
      setStatusMessage(response.message || '인증번호를 보냈어요. 메일함을 확인해 주세요.');
    } catch (error) {
      setStatusMessage(mapVerificationError(error, '인증번호를 보내지 못했어요.'));
    } finally {
      setIsSending(false);
    }
  }

  async function handleVerifyCode() {
    setStatusMessage(null);
    const trimmedCode = verificationCode.trim();

    if (!trimmedCode) {
      setStatusMessage('인증번호 6자리를 입력해 주세요.');
      return;
    }

    setIsVerifying(true);
    try {
      const response = await verifyEmailCode({
        email: email.trim(),
        code: trimmedCode,
        role,
      });
      onVerifiedChange(true);
      setStatusMessage(response.message || '이메일 인증이 완료되었어요.');
    } catch (error) {
      onVerifiedChange(false);
      setStatusMessage(mapVerificationError(error, '인증번호를 다시 확인해 주세요.'));
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleCheckStatus() {
    if (!email.trim()) {
      return;
    }

    try {
      const status = await getEmailStatus({ email: email.trim(), role });
      onVerifiedChange(status.verified);
    } catch {
      onVerifiedChange(false);
    }
  }

  function handleEmailInputChange(value: string) {
    onEmailChange(value);
    setVerificationCode('');
    setStatusMessage(null);
  }

  return (
    <>
      <JoinField id={id} label={label} helper={helper} error={emailError} required={required}>
        <input
          type="email"
          name="email"
          placeholder={placeholder}
          autoComplete="email"
          value={email}
          onChange={(event) => handleEmailInputChange(event.target.value)}
          onBlur={() => {
            void handleCheckStatus();
          }}
        />
      </JoinField>

      <div className="join-inline-actions">
        <button
          type="button"
          className="join-btn join-btn--secondary"
          disabled={isSending}
          onClick={() => void handleSendCode()}
        >
          {isSending ? '발송 중…' : '인증번호 발송'}
        </button>
        <button
          type="button"
          className="join-btn join-btn--primary"
          disabled={isVerifying}
          onClick={() => void handleVerifyCode()}
        >
          {isVerifying ? '확인 중…' : '인증 확인'}
        </button>
      </div>

      <JoinField id={codeFieldId} label="인증번호 6자리">
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="123456"
          autoComplete="one-time-code"
          value={verificationCode}
          onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ''))}
        />
      </JoinField>

      <VerificationFeedback
        showSuccess={emailVerified}
        successMessage="이메일 인증이 완료되었어요."
        errorMessage={!emailVerified ? statusMessage : null}
      />
    </>
  );
}
