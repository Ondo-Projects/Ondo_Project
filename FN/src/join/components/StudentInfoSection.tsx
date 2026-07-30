import { validateStudentEmail } from '../joinValidation';
import { useJoinForm } from '../JoinFormProvider';
import EmailVerificationBlock from './EmailVerificationBlock';
import JoinField from './JoinField';
import JoinSection from './JoinSection';

export default function StudentInfoSection() {
  const { state, fieldErrors, actions } = useJoinForm();

  if (state.role !== 'STUDENT') {
    return null;
  }

  return (
    <JoinSection title="4. 학생 정보">
      <JoinField
        id="birthDate"
        label="생년월일"
        helper="만 14세 미만인 경우 법정대리인(보호자) SMS 동의가 필요합니다."
        error={fieldErrors.birthDate}
        required
      >
        <input
          type="date"
          name="birthDate"
          value={state.birthDate}
          onChange={(event) => actions.setBirthDate(event.target.value)}
        />
      </JoinField>

      <EmailVerificationBlock
        id="studentEmail"
        codeFieldId="studentVerificationCode"
        label="이메일"
        placeholder="example@gmail.com"
        helper="가입 전 이메일 인증이 필요합니다."
        required
        role="STUDENT"
        email={state.email}
        emailVerified={state.emailVerified}
        emailError={fieldErrors.email ?? fieldErrors.emailVerification}
        onEmailChange={actions.setEmail}
        onVerifiedChange={actions.setEmailVerified}
        validateEmail={validateStudentEmail}
      />
    </JoinSection>
  );
}
