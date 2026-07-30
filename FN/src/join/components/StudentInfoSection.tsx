import { useState } from 'react';
import { getEmailStatus, sendEmailCode, verifyEmailCode } from '../../api/email.api';
import { mapVerificationError } from '../joinErrors';
import { validateStudentEmail } from '../joinValidation';
import { useJoinForm } from '../JoinFormProvider';
import JoinField from './JoinField';
import JoinSection from './JoinSection';

export default function StudentInfoSection() {
  const { state, fieldErrors, actions } = useJoinForm();
  const [verificationCode, setVerificationCode] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  if (state.role !== 'STUDENT') {
    return null;
  }

  async function handleSendCode() {
    setStatusMessage(null);
    const emailError = validateStudentEmail(state.email);
    if (emailError) {
      setStatusMessage(emailError);
      return;
    }

    setIsSending(true);
    try {
      const response = await sendEmailCode({ email: state.email.trim(), role: 'STUDENT' });
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
        role: 'STUDENT',
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
      const status = await getEmailStatus({ email: state.email.trim(), role: 'STUDENT' });
      actions.setEmailVerified(status.verified);
    } catch {
      actions.setEmailVerified(false);
    }
  }

  return (
    <JoinSection title="4. 학생 정보">
      <JoinField
        id="birthDate"
        label="생년월일"
        helper="만 14세 미만인 경우 법정대리인(보호자) SMS 동의가 필요합니다."
        error={fieldErrors.birthDate}
      >
        <input
          id="birthDate"
          className={`join-field__input${fieldErrors.birthDate ? ' join-field__input--error' : ''}`}
          type="date"
          name="birthDate"
          value={state.birthDate}
          onChange={(event) => actions.setBirthDate(event.target.value)}
        />
      </JoinField>

      <JoinField
        id="studentEmail"
        label="이메일"
        helper="가입 전 이메일 인증이 필요합니다."
        error={fieldErrors.email ?? fieldErrors.emailVerification}
      >
        <input
          id="studentEmail"
          className={`join-field__input${fieldErrors.email || fieldErrors.emailVerification ? ' join-field__input--error' : ''}`}
          type="email"
          name="email"
          placeholder="example@gmail.com"
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

      <JoinField id="studentVerificationCode" label="인증번호 6자리">
        <input
          id="studentVerificationCode"
          className="join-field__input"
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="123456"
          value={verificationCode}
          onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ''))}
        />
      </JoinField>

      {state.emailVerified ? (
        <p className="join-message join-message--success" role="status">
          이메일 인증이 완료되었어요.
        </p>
      ) : null}

      {statusMessage && !state.emailVerified ? (
        <p className="join-message join-message--error" role="alert">
          {statusMessage}
        </p>
      ) : null}
    </JoinSection>
  );
}
