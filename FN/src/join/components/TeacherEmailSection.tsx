import { useState } from 'react';
import { getEmailStatus, sendEmailCode, verifyEmailCode } from '../../api/email.api';
import { mapVerificationError } from '../joinErrors';
import { validateTeacherEmail } from '../joinValidation';
import { useJoinForm } from '../JoinFormProvider';
import JoinField from './JoinField';
import JoinSection from './JoinSection';

export default function TeacherEmailSection() {
  const { state, fieldErrors, actions } = useJoinForm();
  const [verificationCode, setVerificationCode] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  if (state.role !== 'TEACHER') {
    return null;
  }

  async function handleSendCode() {
    setStatusMessage(null);
    const emailError = validateTeacherEmail(state.email);
    if (emailError) {
      setStatusMessage(emailError);
      return;
    }

    setIsSending(true);
    try {
      const response = await sendEmailCode({ email: state.email.trim(), role: 'TEACHER' });
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
        email: state.email.trim(),
        code: trimmedCode,
        role: 'TEACHER',
      });
      actions.setEmailVerified(true);
      setStatusMessage(response.message || '이메일 인증이 완료되었어요.');
    } catch (error) {
      actions.setEmailVerified(false);
      setStatusMessage(mapVerificationError(error, '인증번호를 다시 확인해 주세요.'));
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleCheckStatus() {
    if (!state.email.trim()) {
      return;
    }

    try {
      const status = await getEmailStatus({ email: state.email.trim(), role: 'TEACHER' });
      actions.setEmailVerified(status.verified);
    } catch {
      actions.setEmailVerified(false);
    }
  }

  return (
    <JoinSection title="4. 교사 이메일 인증">
      <p className="join-field__helper">교사 가입은 공직 메일(@korea.kr) 인증이 필요합니다.</p>

      <JoinField
        id="teacherEmail"
        label="교사 이메일"
        error={fieldErrors.email ?? fieldErrors.emailVerification}
        required
      >
        <input
          type="email"
          name="email"
          placeholder="example@korea.kr"
          autoComplete="email"
          value={state.email}
          onChange={(event) => {
            actions.setEmail(event.target.value);
            setVerificationCode('');
            setStatusMessage(null);
          }}
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

      <JoinField id="teacherVerificationCode" label="인증번호 6자리">
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

      {state.emailVerified ? (
        <p className="join-message join-message--success" role="status">
          <span className="join-message__icon" aria-hidden="true">
            ✓
          </span>
          <span>이메일 인증이 완료되었어요.</span>
        </p>
      ) : null}

      {statusMessage && !state.emailVerified ? (
        <p className="join-message join-message--error" role="alert">
          <span className="join-message__icon" aria-hidden="true">
            !
          </span>
          <span>{statusMessage}</span>
        </p>
      ) : null}
    </JoinSection>
  );
}
