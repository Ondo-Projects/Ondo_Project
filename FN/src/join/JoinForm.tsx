import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import AuthPageShell from '../components/AuthPageShell';
import { Alert, Btn, Card } from '../components/ui';
import { getSignupSuccessMessage } from '../auth/loginNavigation';
import { PATHS } from '../routes/paths';
import { scrollToFirstJoinError } from './joinA11y';
import { useJoinForm } from './JoinFormProvider';
import AccountSection from './components/AccountSection';
import GuardianSection from './components/GuardianSection';
import JoinErrorSummary from './components/JoinErrorSummary';
import ProfileNameSection from './components/ProfileNameSection';
import RoleSection from './components/RoleSection';
import SchoolSearchSection from './components/SchoolSearchSection';
import StudentInfoSection from './components/StudentInfoSection';
import TeacherEmailSection from './components/TeacherEmailSection';
import TermsSection from './components/TermsSection';
import './join.css';

export default function JoinForm() {
  const navigate = useNavigate();
  const { state, fieldErrors, submitError, isSubmitting, actions } = useJoinForm();
  const [showValidationSummary, setShowValidationSummary] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    actions.clearSubmitError();
    setShowValidationSummary(true);

    try {
      const response = await actions.submitSignup();
      navigate(PATHS.LOGIN, {
        replace: true,
        state: {
          signupSuccess: true,
          username: response.username,
          message: getSignupSuccessMessage(response.message),
        },
      });
    } catch {
      const validation = actions.validateClient();
      if (!validation.valid) {
        scrollToFirstJoinError(validation.errors, state.role);
      }
    }
  }

  return (
    <AppLayout>
      <a className="join-skip-link" href="#join-form-main">
        회원가입 양식으로 바로가기
      </a>
      <AuthPageShell
        title="회원가입"
        subtitle="학교 선택, 계정 정보, 약관 동의 후 가입을 완료해 주세요."
        join
      >
        <Card compact className="join-card">
          <JoinErrorSummary errors={fieldErrors} visible={showValidationSummary} />

          {submitError ? (
            <Alert variant="error" id="join-submit-error">
              {submitError}
            </Alert>
          ) : null}

          <form
            id="join-form-main"
            className="join-form"
            onSubmit={handleSubmit}
            noValidate
            aria-busy={isSubmitting}
          >
            <RoleSection />
            <SchoolSearchSection />
            <ProfileNameSection />
            <StudentInfoSection />
            <TeacherEmailSection />
            <GuardianSection />
            <AccountSection />
            <TermsSection />

            <Btn
              type="submit"
              variant="primary"
              size="student"
              fullWidth
              className="join-submit"
              disabled={isSubmitting}
              aria-describedby={submitError ? 'join-submit-error' : undefined}
            >
              {isSubmitting ? '가입 처리 중…' : '가입하기'}
            </Btn>
          </form>

          <nav className="join-footer" aria-label="회원가입 관련 링크">
            <Btn variant="ghost" to={PATHS.LOGIN}>
              로그인
            </Btn>
            <Btn variant="ghost" to={PATHS.ROOT}>
              처음으로
            </Btn>
          </nav>
        </Card>
      </AuthPageShell>
    </AppLayout>
  );
}
