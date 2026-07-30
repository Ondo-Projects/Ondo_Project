import { type FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { withdrawAccount } from '../api/withdraw.api';
import { ApiError } from '../api/types/api-error';
import type { WithdrawReason } from '../api/types/withdraw';
import { useAuth } from '../auth/AuthProvider';
import AuthLoading from '../auth/AuthLoading';
import { getSignupSuccessMessage } from '../auth/loginNavigation';
import AppLayout from '../components/layout/AppLayout';
import { usePageTitle } from '../hooks/usePageTitle';
import { PATHS } from '../routes/paths';
import { getWithdrawReasonOptions } from '../withdraw/withdrawReasons';
import '../auth/auth.css';

function mapWithdrawError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }
  return fallback;
}

export default function WithdrawPage() {
  usePageTitle('회원 탈퇴 | 온도');

  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [reason, setReason] = useState<WithdrawReason | ''>('');
  const [reasonDetail, setReasonDetail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasonOptions = useMemo(
    () => (user ? getWithdrawReasonOptions(user.role) : []),
    [user],
  );

  const greetingName = user?.name?.trim() || user?.username || '회원';
  const continuePath = user?.role === 'TEACHER' ? PATHS.TEACHER : PATHS.STUDENT;

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(continuePath);
  }

  async function handleWithdraw(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!agreed) {
      setErrorMessage('탈퇴 안내에 동의해 주세요.');
      return;
    }

    if (!password) {
      setErrorMessage('비밀번호를 입력해 주세요.');
      return;
    }

    if (reason === 'OTHER' && !reasonDetail.trim()) {
      setErrorMessage('기타 사유를 입력해 주세요.');
      return;
    }

    const confirmed = window.confirm(
      '정말 탈퇴하시겠어요?\n탈퇴 후에는 같은 계정으로 다시 로그인할 수 없습니다.',
    );
    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await withdrawAccount({
        password,
        agreed: true,
        reason: reason || undefined,
        reasonDetail: reason === 'OTHER' ? reasonDetail.trim() : undefined,
      });

      await logout();

      navigate(PATHS.LOGIN, {
        replace: true,
        state: {
          signupSuccess: true,
          message: getSignupSuccessMessage(response.message || '회원 탈퇴가 완료되었습니다.'),
        },
      });
    } catch (error) {
      setErrorMessage(mapWithdrawError(error, '회원 탈퇴를 완료하지 못했어요. 잠시 후 다시 시도해 주세요.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!user) {
    return <AuthLoading message="회원 탈퇴 페이지를 준비하고 있어요" />;
  }

  return (
    <AppLayout>
      <div className="auth-shell auth-shell--wide">
        <div className="auth-card auth-card--withdraw">
          <div className="auth-withdraw-top">
            <button
              type="button"
              className="auth-withdraw-back"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              ← 뒤로가기
            </button>
            <h1 className="auth-card__title auth-card__title--center">회원 탈퇴</h1>
          </div>

          <section className="auth-withdraw-intro" aria-labelledby="withdraw-intro-title">
            <h2 id="withdraw-intro-title" className="auth-withdraw-intro__title">
              {greetingName}님, 정말 떠나시겠어요?
            </h2>
            <p className="auth-withdraw-intro__text">
              탈퇴하시기 전에 아래 내용을 꼭 확인해 주세요.
            </p>
          </section>

          <section className="auth-withdraw-notice" aria-labelledby="withdraw-notice-title">
            <h3 id="withdraw-notice-title" className="auth-withdraw-notice__title">
              탈퇴 시 유의사항
            </h3>
            <ul className="auth-withdraw-notice__list">
              <li>
                서비스 이용과 상담 내역 조회는 즉시 중단되며, 탈퇴 후에는 계정으로 다시
                로그인할 수 없습니다.
              </li>
              <li>
                상담 기록은 관련 법령 및 이용약관에 따라 일정 기간 보관된 뒤 파기됩니다.
              </li>
            </ul>
          </section>

          {errorMessage ? (
            <p className="auth-message auth-message--error" role="alert">
              <span className="auth-message__icon" aria-hidden="true">
                !
              </span>
              <span>{errorMessage}</span>
            </p>
          ) : null}

          <form className="auth-form" onSubmit={(event) => void handleWithdraw(event)} noValidate>
            <fieldset className="auth-withdraw-reasons">
              <legend className="auth-withdraw-reasons__legend">탈퇴하려는 이유가 궁금해요 (선택)</legend>
              <div className="auth-radio-group">
                {reasonOptions.map((option) => (
                  <label key={option.value} className="auth-radio-option">
                    <input
                      type="radio"
                      name="withdrawReason"
                      value={option.value}
                      checked={reason === option.value}
                      onChange={() => setReason(option.value)}
                      disabled={isSubmitting}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {reason === 'OTHER' ? (
              <div className="auth-field">
                <label className="auth-field__label" htmlFor="withdraw-reason-detail">
                  기타 사유
                </label>
                <input
                  id="withdraw-reason-detail"
                  className="auth-field__input"
                  type="text"
                  name="reasonDetail"
                  maxLength={500}
                  value={reasonDetail}
                  onChange={(event) => setReasonDetail(event.target.value)}
                  disabled={isSubmitting}
                  placeholder="탈퇴 사유를 입력해 주세요."
                />
              </div>
            ) : null}

            <label className="auth-checkbox-field">
              <input
                type="checkbox"
                name="agreed"
                checked={agreed}
                onChange={(event) => setAgreed(event.target.checked)}
                disabled={isSubmitting}
              />
              <span>안내 사항을 모두 확인하였으며, 탈퇴에 동의합니다. (필수)</span>
            </label>

            <div className="auth-field">
              <label className="auth-field__label" htmlFor="withdraw-password">
                비밀번호 (필수)
              </label>
              <input
                id="withdraw-password"
                className="auth-field__input"
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="auth-withdraw-actions">
              <Link
                className="auth-submit auth-withdraw-actions__continue"
                to={continuePath}
                onClick={(event) => {
                  if (isSubmitting) {
                    event.preventDefault();
                  }
                }}
              >
                계속 이용하기
              </Link>
              <button
                className="auth-submit auth-submit--muted"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? '탈퇴 처리 중…' : '탈퇴하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
