import { useState } from 'react';
import { sendGuardianSms, verifyGuardianSms } from '../../api/sms.api';
import { mapVerificationError } from '../joinErrors';
import { GUARDIAN_RELATION_OPTIONS } from '../constants';
import { useJoinForm } from '../JoinFormProvider';
import JoinField from './JoinField';
import JoinSection from './JoinSection';

export default function GuardianSection() {
  const { state, fieldErrors, computed, actions } = useJoinForm();
  const [verificationCode, setVerificationCode] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!computed.canShowGuardianSection) {
    return null;
  }

  async function handleSendSms() {
    setStatusMessage(null);

    if (!state.name.trim()) {
      setStatusMessage('학생 성명을 먼저 입력해 주세요.');
      return;
    }
    if (!state.guardianName.trim()) {
      setStatusMessage('보호자 성명을 입력해 주세요.');
      return;
    }
    if (!state.guardianPhone.trim()) {
      setStatusMessage('보호자 휴대전화번호를 입력해 주세요.');
      return;
    }

    setIsSending(true);
    try {
      const response = await sendGuardianSms({
        studentName: state.name.trim(),
        guardianName: state.guardianName.trim(),
        phone: state.guardianPhone.trim(),
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
        phone: state.guardianPhone.trim(),
        code: trimmedCode,
      });
      actions.setSmsVerified(true);
      setStatusMessage(response.message || '법정대리인 SMS 인증이 완료되었어요.');
    } catch (error) {
      actions.setSmsVerified(false);
      setStatusMessage(mapVerificationError(error, '인증번호를 다시 확인해 주세요.'));
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <JoinSection title="5. 법정대리인(보호자) 동의">
      <p className="join-field__helper">
        만 14세 미만 학생은 보호자 SMS 인증 후 가입할 수 있습니다.
      </p>

      <JoinField id="guardianName" label="보호자 성명" error={fieldErrors.guardianName}>
        <input
          id="guardianName"
          className={`join-field__input${fieldErrors.guardianName ? ' join-field__input--error' : ''}`}
          type="text"
          name="guardianName"
          maxLength={50}
          placeholder="법정대리인 성명"
          value={state.guardianName}
          onChange={(event) => actions.setGuardianName(event.target.value)}
        />
      </JoinField>

      <JoinField id="guardianPhone" label="보호자 휴대전화" error={fieldErrors.guardianPhone}>
        <input
          id="guardianPhone"
          className={`join-field__input${fieldErrors.guardianPhone ? ' join-field__input--error' : ''}`}
          type="tel"
          name="guardianPhone"
          maxLength={20}
          placeholder="010-1234-5678"
          value={state.guardianPhone}
          onChange={(event) => {
            actions.setGuardianPhone(event.target.value);
            setVerificationCode('');
            setStatusMessage(null);
          }}
        />
      </JoinField>

      <JoinField id="guardianRelation" label="학생과의 관계" error={fieldErrors.guardianRelation}>
        <select
          id="guardianRelation"
          className={`join-field__select${fieldErrors.guardianRelation ? ' join-field__input--error' : ''}`}
          name="guardianRelation"
          value={state.guardianRelation}
          onChange={(event) =>
            actions.setGuardianRelation(event.target.value as typeof state.guardianRelation)
          }
        >
          <option value="">선택해 주세요</option>
          {GUARDIAN_RELATION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </JoinField>

      <div className="join-terms-item">
        <details>
          <summary>법정대리인 동의 안내</summary>
          <div className="join-terms-item__body">
            만 14세 미만 학생의 개인정보·민감정보(상담 내용) 수집·이용 및 법정대리인 본인 확인을
            위해 보호자 SMS 인증과 필수 약관 동의가 필요합니다.
          </div>
        </details>
      </div>

      <label className="join-checkbox-row">
        <input
          type="checkbox"
          checked={state.agreeGuardianChildPrivacy}
          onChange={(event) => actions.setAgreeGuardianChildPrivacy(event.target.checked)}
        />
        <span>[필수] 만 14세 미만 아동 개인정보 수집·이용에 동의합니다.</span>
      </label>
      {fieldErrors.agreeGuardianChildPrivacy ? (
        <p className="join-field__error" role="alert">
          {fieldErrors.agreeGuardianChildPrivacy}
        </p>
      ) : null}

      <label className="join-checkbox-row">
        <input
          type="checkbox"
          checked={state.agreeGuardianChildSensitive}
          onChange={(event) => actions.setAgreeGuardianChildSensitive(event.target.checked)}
        />
        <span>[필수] 만 14세 미만 아동 민감정보(상담 내용) 수집·이용에 동의합니다.</span>
      </label>
      {fieldErrors.agreeGuardianChildSensitive ? (
        <p className="join-field__error" role="alert">
          {fieldErrors.agreeGuardianChildSensitive}
        </p>
      ) : null}

      <label className="join-checkbox-row">
        <input
          type="checkbox"
          checked={state.agreeGuardianIdentity}
          onChange={(event) => actions.setAgreeGuardianIdentity(event.target.checked)}
        />
        <span>[필수] 법정대리인 본인 확인 및 개인정보 수집에 동의합니다.</span>
      </label>
      {fieldErrors.agreeGuardianIdentity ? (
        <p className="join-field__error" role="alert">
          {fieldErrors.agreeGuardianIdentity}
        </p>
      ) : null}

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

      <JoinField
        id="smsVerificationCode"
        label="인증번호 6자리"
        error={fieldErrors.smsVerification}
      >
        <input
          id="smsVerificationCode"
          className={`join-field__input${fieldErrors.smsVerification ? ' join-field__input--error' : ''}`}
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="123456"
          value={verificationCode}
          onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ''))}
        />
      </JoinField>

      {state.smsVerified ? (
        <p className="join-message join-message--success" role="status">
          법정대리인 SMS 인증이 완료되었어요.
        </p>
      ) : null}

      {statusMessage && !state.smsVerified ? (
        <p className="join-message join-message--error" role="alert">
          {statusMessage}
        </p>
      ) : null}
    </JoinSection>
  );
}
