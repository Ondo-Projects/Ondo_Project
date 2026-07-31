import { CardHelper, Input, Select } from '../../components/ui';
import { GUARDIAN_RELATION_OPTIONS } from '../constants';
import { GUARDIAN_CONSENT_TERM } from '../terms/content';
import { useJoinForm } from '../JoinFormProvider';
import GuardianSmsVerification from './GuardianSmsVerification';
import JoinCheckboxField from './JoinCheckboxField';
import JoinField from './JoinField';
import JoinSection from './JoinSection';
import TermsTextbox from './TermsTextbox';

export default function GuardianSection() {
  const { state, fieldErrors, computed, actions } = useJoinForm();

  if (!computed.canShowGuardianSection) {
    return null;
  }

  return (
    <JoinSection title="5. 법정대리인(보호자) 동의">
      <CardHelper>만 14세 미만 학생은 보호자 SMS 인증 후 가입할 수 있습니다.</CardHelper>

      <JoinField id="guardianName" label="보호자 성명" error={fieldErrors.guardianName} required>
        <Input
          type="text"
          name="guardianName"
          maxLength={50}
          placeholder="법정대리인 성명"
          value={state.guardianName}
          onChange={(event) => actions.setGuardianName(event.target.value)}
        />
      </JoinField>

      <JoinField id="guardianPhone" label="보호자 휴대전화" error={fieldErrors.guardianPhone} required>
        <Input
          type="tel"
          name="guardianPhone"
          maxLength={20}
          placeholder="010-1234-5678"
          autoComplete="tel"
          value={state.guardianPhone}
          onChange={(event) => actions.setGuardianPhone(event.target.value)}
        />
      </JoinField>

      <JoinField id="guardianRelation" label="학생과의 관계" error={fieldErrors.guardianRelation} required>
        <Select
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
        </Select>
      </JoinField>

      <TermsTextbox id="guardian-consent" label={GUARDIAN_CONSENT_TERM.label} text={GUARDIAN_CONSENT_TERM.text} />

      <JoinCheckboxField
        id="agreeGuardianChildPrivacy"
        label="[필수] 만 14세 미만 아동 개인정보 수집·이용에 동의합니다."
        checked={state.agreeGuardianChildPrivacy}
        error={fieldErrors.agreeGuardianChildPrivacy}
        onChange={actions.setAgreeGuardianChildPrivacy}
      />

      <JoinCheckboxField
        id="agreeGuardianChildSensitive"
        label="[필수] 만 14세 미만 아동 민감정보(상담 내용) 수집·이용에 동의합니다."
        checked={state.agreeGuardianChildSensitive}
        error={fieldErrors.agreeGuardianChildSensitive}
        onChange={actions.setAgreeGuardianChildSensitive}
      />

      <JoinCheckboxField
        id="agreeGuardianIdentity"
        label="[필수] 법정대리인 본인 확인 및 개인정보 수집에 동의합니다."
        checked={state.agreeGuardianIdentity}
        error={fieldErrors.agreeGuardianIdentity}
        onChange={actions.setAgreeGuardianIdentity}
      />

      <GuardianSmsVerification
        studentName={state.name}
        guardianName={state.guardianName}
        guardianPhone={state.guardianPhone}
        smsVerified={state.smsVerified}
        smsError={fieldErrors.smsVerification}
        onVerifiedChange={actions.setSmsVerified}
      />
    </JoinSection>
  );
}
