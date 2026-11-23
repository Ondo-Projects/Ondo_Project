import { useState } from 'react';
import { sendGuardianSms, verifyGuardianSms } from '../../api/sms.api';
import { Checkbox, Field, Input, Select } from '../../ds';
import { GUARDIAN_RELATION_OPTIONS } from '../../join/constants';
import { mapVerificationError } from '../../join/joinErrors';
import { useJoinForm } from '../../join/JoinFormProvider';
import { GUARDIAN_CONSENT_TERM } from '../../join/terms/content';
import { TermsText } from './TermsBlock';
import { VerifyRow } from './VerifyRow';

/** 만 14세 미만 — 보호자 정보, 동의, 휴대전화 인증 */
export function GuardianBlock() {
  const { state, fieldErrors, actions } = useJoinForm();
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'send' | 'verify' | null>(null);

  async function send() {
    setMessage(null);
    setError(null);
    if (!state.name.trim()) return setError('학생 이름을 먼저 입력해 주세요.');
    if (!state.guardianName.trim()) return setError('보호자 이름을 입력해 주세요.');
    if (!state.guardianPhone.trim()) return setError('보호자 휴대전화 번호를 입력해 주세요.');
    setBusy('send');
    try {
      const response = await sendGuardianSms({
        studentName: state.name.trim(),
        guardianName: state.guardianName.trim(),
        phone: state.guardianPhone.trim(),
      });
      setSent(true);
      setMessage(response.message || '보호자 휴대전화로 인증번호를 보냈어요.');
    } catch (err) {
      setError(mapVerificationError(err, '인증번호를 보내지 못했어요.'));
    } finally {
      setBusy(null);
    }
  }

  async function verify() {
    setMessage(null);
    setError(null);
    setBusy('verify');
    try {
      await verifyGuardianSms({ phone: state.guardianPhone.trim(), code });
      actions.setSmsVerified(true);
    } catch (err) {
      actions.setSmsVerified(false);
      setError(mapVerificationError(err, '인증번호를 다시 확인해 주세요.'));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-md border border-gray-200 bg-gray-50/60 px-3 py-2.5 text-[13px] leading-relaxed text-gray-700">
        만 14세 미만은 개인정보 보호법에 따라 보호자 동의가 필요해요. 보호자 휴대전화로 인증번호를 보내 확인합니다.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="보호자 이름" required error={fieldErrors.guardianName}>
          <Input
            id="guardianName"
            maxLength={50}
            value={state.guardianName}
            onChange={(event) => actions.setGuardianName(event.target.value)}
          />
        </Field>
        <Field label="학생과의 관계" required error={fieldErrors.guardianRelation}>
          <Select
            id="guardianRelation"
            value={state.guardianRelation}
            onChange={(event) => actions.setGuardianRelation(event.target.value as typeof state.guardianRelation)}
          >
            <option value="">골라 주세요</option>
            {GUARDIAN_RELATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="보호자 휴대전화" required error={fieldErrors.guardianPhone}>
        <Input
          id="guardianPhone"
          type="tel"
          autoComplete="tel"
          maxLength={20}
          placeholder="010-1234-5678"
          value={state.guardianPhone}
          disabled={state.smsVerified}
          onChange={(event) => {
            actions.setGuardianPhone(event.target.value);
            setSent(false);
            setCode('');
          }}
        />
      </Field>

      <TermsText id="guardian-consent" label={GUARDIAN_CONSENT_TERM.label} text={GUARDIAN_CONSENT_TERM.text} />
      <div className="flex flex-col gap-2.5">
        <Checkbox
          id="agreeGuardianChildPrivacy"
          checked={state.agreeGuardianChildPrivacy}
          onChange={actions.setAgreeGuardianChildPrivacy}
          error={fieldErrors.agreeGuardianChildPrivacy}
        >
          [필수] 만 14세 미만 아동 개인정보 수집·이용에 동의합니다.
        </Checkbox>
        <Checkbox
          id="agreeGuardianChildSensitive"
          checked={state.agreeGuardianChildSensitive}
          onChange={actions.setAgreeGuardianChildSensitive}
          error={fieldErrors.agreeGuardianChildSensitive}
        >
          [필수] 만 14세 미만 아동 민감정보(상담 내용) 수집·이용에 동의합니다.
        </Checkbox>
        <Checkbox
          id="agreeGuardianIdentity"
          checked={state.agreeGuardianIdentity}
          onChange={actions.setAgreeGuardianIdentity}
          error={fieldErrors.agreeGuardianIdentity}
        >
          [필수] 법정대리인 본인 확인 및 개인정보 수집에 동의합니다.
        </Checkbox>
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-[13px] font-medium text-gray-700">보호자 휴대전화 인증</p>
        <VerifyRow
          codeId="smsVerificationCode"
          code={code}
          onCodeChange={setCode}
          onSend={() => void send()}
          onVerify={() => void verify()}
          sending={busy === 'send'}
          verifying={busy === 'verify'}
          verified={state.smsVerified}
          sent={sent}
          message={message}
          error={error ?? fieldErrors.smsVerification}
          doneText="보호자 휴대전화 인증을 마쳤어요."
        />
      </div>
    </div>
  );
}
