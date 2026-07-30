import { useState } from 'react';
import { sendGuardianSms, verifyGuardianSms } from '../../api/sms.api';
import { mapVerificationError } from '../joinErrors';
import JoinField from './JoinField';
import VerificationFeedback from './VerificationFeedback';

interface GuardianSmsVerificationProps {
  studentName: string;
  guardianName: string;
  guardianPhone: string;
  smsVerified: boolean;
  smsError?: string;
  onVerifiedChange: (verified: boolean) => void;
}

export default function GuardianSmsVerification({
  studentName,
  guardianName,
  guardianPhone,
  smsVerified,
  smsError,
  onVerifiedChange,
}: GuardianSmsVerificationProps) {
  const [verificationCode, setVerificationCode] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  async function handleSendSms() {
    setStatusMessage(null);

    if (!studentName.trim()) {
      setStatusMessage('학생 성명을 먼저 입력해 주세요.');
      return;
    }
    if (!guardianName.trim()) {
      setStatusMessage('보호자 성명을 입력해 주세요.');
      return;
    }
    if (!guardianPhone.trim()) {
      setStatusMessage('보호자 휴대전화번호를 입력해 주세요.');
      return;
    }

    setIsSending(true);
    try {
      const response = await sendGuardianSms({
        studentName: studentName.trim(),
        guardianName: guardianName.trim(),
        phone: guardianPhone.trim(),
      });
      setStatusMessage(response.message || '인증번호를 보냈어요.');
    } catch (error) {
      setStatusMessage(mapVerificationError(error, 'SMS 인증번호를 보내지 못했어요.'));
    } finally {
      setIsSending(false);
    }
  }

  async function handleVerifySms() {
    setStatusMessage(null);
    const trimmedCode = verificationCode.trim();

    if (!trimmedCode) {
      setStatusMessage('인증번호 6자리를 입력해 주세요.');
      return;
    }

    setIsVerifying(true);
    try {
      const response = await verifyGuardianSms({
        phone: guardianPhone.trim(),
        code: trimmedCode,
      });
      onVerifiedChange(true);
      setStatusMessage(response.message || '법정대리인 SMS 인증이 완료되었어요.');
    } catch (error) {
      onVerifiedChange(false);
      setStatusMessage(mapVerificationError(error, '인증번호를 다시 확인해 주세요.'));
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <>
      <div className="join-inline-actions">
        <button
          type="button"
          className="join-btn join-btn--secondary"
          disabled={isSending}
          onClick={() => void handleSendSms()}
        >
          {isSending ? '발송 중…' : '인증번호 발송'}
        </button>
        <button
          type="button"
          className="join-btn join-btn--primary"
          disabled={isVerifying}
          onClick={() => void handleVerifySms()}
        >
          {isVerifying ? '확인 중…' : '인증 확인'}
        </button>
      </div>

      <JoinField id="smsVerificationCode" label="인증번호 6자리" error={smsError}>
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
        showSuccess={smsVerified}
        successMessage="법정대리인 SMS 인증이 완료되었어요."
        errorMessage={!smsVerified ? statusMessage : null}
      />
    </>
  );
}
