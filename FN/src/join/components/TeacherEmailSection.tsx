import { validateTeacherEmail } from '../joinValidation';
import { useJoinForm } from '../JoinFormProvider';
import EmailVerificationBlock from './EmailVerificationBlock';
import JoinSection from './JoinSection';

export default function TeacherEmailSection() {
  const { state, fieldErrors, actions } = useJoinForm();

  if (state.role !== 'TEACHER') {
    return null;
  }

  return (
    <JoinSection title="4. 교사 이메일 인증">
      <p className="join-field__helper">교사 가입은 공직 메일(@korea.kr) 인증이 필요합니다.</p>

      <EmailVerificationBlock
        id="teacherEmail"
        codeFieldId="teacherVerificationCode"
        label="교사 이메일"
        placeholder="example@korea.kr"
        required
        role="TEACHER"
        email={state.email}
        emailVerified={state.emailVerified}
        emailError={fieldErrors.email ?? fieldErrors.emailVerification}
        onEmailChange={actions.setEmail}
        onVerifiedChange={actions.setEmailVerified}
        validateEmail={validateTeacherEmail}
      />
    </JoinSection>
  );
}
