import { type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { getSignupSuccessMessage } from '../auth/loginNavigation';
import { PATHS } from '../routes/paths';
import { useJoinForm } from './JoinFormProvider';
import AccountSection from './components/AccountSection';
import GuardianSection from './components/GuardianSection';
import ProfileNameSection from './components/ProfileNameSection';
import RoleSection from './components/RoleSection';
import SchoolSearchSection from './components/SchoolSearchSection';
import StudentInfoSection from './components/StudentInfoSection';
import TeacherEmailSection from './components/TeacherEmailSection';
import TermsSection from './components/TermsSection';
import './join.css';

export default function JoinForm() {
  const navigate = useNavigate();
  const { submitError, isSubmitting, actions } = useJoinForm();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    actions.clearSubmitError();

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
      // fieldErrors / submitError are set in useJoinForm
    }
  }

  return (
    <AppLayout>
      <div className="join-shell">
        <div className="join-card">
          <h1 className="join-card__title">회원가입</h1>
          <p className="join-card__subtitle">
            학교 선택, 계정 정보, 약관 동의 후 가입을 완료해 주세요.
          </p>

          {submitError ? (
            <p className="join-message join-message--error" role="alert">
              {submitError}
            </p>
          ) : null}

          <form className="join-form" onSubmit={handleSubmit} noValidate>
            <RoleSection />
            <SchoolSearchSection />
            <ProfileNameSection />
            <StudentInfoSection />
            <TeacherEmailSection />
            <GuardianSection />
            <AccountSection />
            <TermsSection />

            <button
              className="join-btn join-btn--primary join-submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? '가입 처리 중…' : '가입하기'}
            </button>
          </form>

          <div className="join-footer">
            <Link className="join-footer__link" to={PATHS.LOGIN}>
              로그인
            </Link>
            <Link className="join-footer__link" to={PATHS.ROOT}>
              처음으로
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
