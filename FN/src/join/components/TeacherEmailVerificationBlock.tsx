import { useEffect, useState } from 'react';
import { getEmailStatus, sendEmailCode, verifyEmailCode } from '../../api/email.api';
import { Btn, Input, Select } from '../../components/ui';
import { mapVerificationError } from '../joinErrors';
import {
  buildTeacherEmail,
  formatTeacherDomainLabel,
  parseTeacherEmail,
  TEACHER_EMAIL_DOMAIN_OPTIONS,
} from '../teacherEmailDomains';
import { validateTeacherEmail } from '../joinValidation';
import { useJoinForm } from '../JoinFormProvider';
import JoinField from './JoinField';
import VerificationFeedback from './VerificationFeedback';

export default function TeacherEmailVerificationBlock() {
  const { state, fieldErrors, actions } = useJoinForm();
  const [localPart, setLocalPart] = useState('');
  const [domain, setDomain] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (state.role !== 'TEACHER') {
      return;
    }

    if (!state.email.trim()) {
      setLocalPart('');
      setDomain('');
      return;
    }

    const parsed = parseTeacherEmail(state.email);
    if (parsed) {
      setLocalPart(parsed.localPart);
      setDomain(parsed.domain);
    }
  }, [state.role]);

  function syncEmail(nextLocalPart: string, nextDomain: string) {
    const composed = buildTeacherEmail(nextLocalPart, nextDomain);
    actions.setEmail(composed);
    actions.setEmailVerified(false);
    setVerificationCode('');
    setStatusMessage(null);
  }

  function handleLocalPartChange(value: string) {
    const sanitized = value.trim().toLowerCase().replace(/@/g, '');
    setLocalPart(sanitized);
    syncEmail(sanitized, domain);
  }

  function handleDomainChange(value: string) {
    setDomain(value);
    syncEmail(localPart, value);
  }

  async function handleSendCode() {
    setStatusMessage(null);
    const composedEmail = buildTeacherEmail(localPart, domain);
    if (!domain) {
      setStatusMessage('소속 교육청을 선택해 주세요.');
      return;
    }

    const validationError = validateTeacherEmail(composedEmail);
    if (validationError) {
      setStatusMessage(validationError);
      return;
    }

    setIsSending(true);
    try {
      const response = await sendEmailCode({ email: composedEmail, role: 'TEACHER' });
      setStatusMessage(response.message || '인증번호를 보냈어요. 메일함을 확인해 주세요.');
    } catch (error) {
      setStatusMessage(mapVerificationError(error, '인증번호를 보내지 못했어요.'));
    } finally {
      setIsSending(false);
    }
  }

  async function handleVerifyCode() {
    setStatusMessage(null);
    const composedEmail = buildTeacherEmail(localPart, domain);
    const trimmedCode = verificationCode.trim();

    if (!trimmedCode) {
      setStatusMessage('인증번호 6자리를 입력해 주세요.');
      return;
    }

    setIsVerifying(true);
    try {
      const response = await verifyEmailCode({
        email: composedEmail,
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
    const composedEmail = buildTeacherEmail(localPart, domain);
    if (!composedEmail) {
      return;
    }

    try {
      const status = await getEmailStatus({ email: composedEmail, role: 'TEACHER' });
      actions.setEmailVerified(status.verified);
    } catch {
      actions.setEmailVerified(false);
    }
  }

  return (
    <>
      <JoinField
        id="teacherEmail"
        label="교사 이메일"
        helper="아이디(@ 앞)를 입력하고 소속 교육청을 선택해 주세요."
        error={fieldErrors.email ?? fieldErrors.emailVerification}
        required
      >
        <div className="join-email-split">
          <Input
            type="text"
            name="teacherEmailLocal"
            placeholder="example"
            autoComplete="username"
            inputMode="email"
            value={localPart}
            onChange={(event) => handleLocalPartChange(event.target.value)}
            onBlur={() => {
              void handleCheckStatus();
            }}
            aria-label="교사 이메일 아이디"
          />
          <span className="join-email-split__at" aria-hidden="true">
            @
          </span>
          <Select
            value={domain}
            onChange={(event) => handleDomainChange(event.target.value)}
            onBlur={() => {
              void handleCheckStatus();
            }}
            aria-label="소속 교육청 도메인"
          >
            <option value="">교육청 선택</option>
            {TEACHER_EMAIL_DOMAIN_OPTIONS.map((option) => (
              <option key={option.domain} value={option.domain}>
                {formatTeacherDomainLabel(option)}
              </option>
            ))}
          </Select>
        </div>
      </JoinField>

      <div className="join-inline-actions">
        <Btn
          type="button"
          variant="secondary"
          disabled={isSending}
          onClick={() => void handleSendCode()}
        >
          {isSending ? '발송 중…' : '인증번호 발송'}
        </Btn>
        <Btn
          type="button"
          variant="primary"
          disabled={isVerifying}
          onClick={() => void handleVerifyCode()}
        >
          {isVerifying ? '확인 중…' : '인증 확인'}
        </Btn>
      </div>

      <JoinField id="teacherVerificationCode" label="인증번호 6자리">
        <Input
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
        showSuccess={state.emailVerified}
        successMessage="이메일 인증이 완료되었어요."
        errorMessage={!state.emailVerified ? statusMessage : null}
      />
    </>
  );
}
