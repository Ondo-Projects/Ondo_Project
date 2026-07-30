import { type FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { resetPassword, sendPasswordResetCode } from '../api/recovery.api';
import { mapVerificationError } from '../join/joinErrors';
import { validatePassword } from '../join/joinValidation';
import AppLayout from '../components/layout/AppLayout';
import BrandMark from '../components/BrandMark';
import { usePageTitle } from '../hooks/usePageTitle';
import { PATHS } from '../routes/paths';
import '../auth/auth.css';

function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) {
    return '이메일을 입력해 주세요.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return '올바른 이메일 형식인지 확인해 주세요.';
  }
  return null;
}

function getPasswordRuleChecks(password: string, username: string) {
  return [
    {
      id: 'length',
      label: '8~100자',
      valid: password.length >= 8 && password.length <= 100,
    },
    {
      id: 'letter',
      label: '영문 1자 이상',
      valid: /[A-Za-z]/.test(password),
    },
    {
      id: 'digit',
      label: '숫자 1자 이상',
      valid: /[0-9]/.test(password),
    },
    {
      id: 'special',
      label: '특수문자 1자 이상',
      valid: /[!@#$%^&*(),.?":{}|[\]\-_=+;'/`~\\]/.test(password),
    },
    {
      id: 'noSpace',
      label: '공백 사용 불가',
      valid: password.length > 0 && !password.includes(' '),
    },
    {
      id: 'notUsername',
      label: '아이디와 다르게 설정',
      valid:
        !username.trim() ||
        !password ||
        password.toLowerCase() !== username.trim().toLowerCase(),
    },
  ];
}

export default function ResetPasswordPage() {
  usePageTitle('비밀번호 재설정 | 온도');

  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordRules = useMemo(
    () => getPasswordRuleChecks(password, username),
    [password, username],
  );

  function validateAccountFields(): string | null {
    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 4 || trimmedUsername.length > 50) {
      return '아이디는 4~50자로 입력해 주세요.';
    }
    return validateEmail(email);
  }

  async function handleSendCode() {
    setStatusMessage(null);
    setErrorMessage(null);

    const validationError = validateAccountFields();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSending(true);
    try {
      const response = await sendPasswordResetCode({
        username: username.trim(),
        email: email.trim(),
      });
      setStatusMessage(response.message || '인증번호를 보냈어요. 메일함을 확인해 주세요.');
    } catch (error) {
      setErrorMessage(mapVerificationError(error, '인증번호를 보내지 못했어요.'));
    } finally {
      setIsSending(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);

    const accountError = validateAccountFields();
    if (accountError) {
      setErrorMessage(accountError);
      return;
    }

    const trimmedCode = code.trim();
    if (!/^\d{6}$/.test(trimmedCode)) {
      setErrorMessage('인증번호 6자리를 입력해 주세요.');
      return;
    }

    const passwordError = validatePassword(password, username.trim());
    if (passwordError) {
      setErrorMessage(passwordError);
      return;
    }

    if (password !== passwordConfirm) {
      setErrorMessage('비밀번호 확인이 일치하지 않아요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await resetPassword({
        username: username.trim(),
        email: email.trim(),
        code: trimmedCode,
        password,
        passwordConfirm,
      });
      navigate(PATHS.LOGIN, {
        replace: true,
        state: {
          signupSuccess: true,
          username: username.trim(),
          message: response.message || '비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.',
        },
      });
    } catch (error) {
      setErrorMessage(mapVerificationError(error, '비밀번호를 변경하지 못했어요.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppLayout>
      <div className="auth-shell">
        <BrandMark size="auth" />
        <div className="auth-card">
          <h1 className="auth-card__title">비밀번호 재설정</h1>
          <p className="auth-card__subtitle">
            가입 시 등록한 아이디와 이메일로 본인 확인 후 새 비밀번호를 설정할 수 있어요.
          </p>

          {statusMessage ? (
            <p className="auth-message auth-message--success" role="status">
              <span className="auth-message__icon" aria-hidden="true">
                ✓
              </span>
              <span>{statusMessage}</span>
            </p>
          ) : null}

          {errorMessage ? (
            <p className="auth-message auth-message--error" role="alert">
              <span className="auth-message__icon" aria-hidden="true">
                !
              </span>
              <span>{errorMessage}</span>
            </p>
          ) : null}

          <form className="auth-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
            <div className="auth-field">
              <label className="auth-field__label" htmlFor="reset-username">
                아이디 (필수)
              </label>
              <input
                id="reset-username"
                className="auth-field__input"
                type="text"
                name="username"
                minLength={4}
                maxLength={50}
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                disabled={isSending || isSubmitting}
              />
            </div>

            <div className="auth-field">
              <label className="auth-field__label" htmlFor="reset-email">
                이메일 (필수)
              </label>
              <input
                id="reset-email"
                className="auth-field__input"
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isSending || isSubmitting}
              />
            </div>

            <div className="auth-inline-actions">
              <button
                type="button"
                className="auth-btn auth-btn--secondary"
                disabled={isSending || isSubmitting}
                onClick={() => void handleSendCode()}
              >
                {isSending ? '발송 중…' : '인증번호 발송'}
              </button>
            </div>

            <div className="auth-field">
              <label className="auth-field__label" htmlFor="reset-code">
                인증번호 6자리
              </label>
              <input
                id="reset-code"
                className="auth-field__input"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                autoComplete="one-time-code"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                disabled={isSubmitting}
              />
            </div>

            <div className="auth-field">
              <label className="auth-field__label" htmlFor="reset-password">
                새 비밀번호 (필수)
              </label>
              <input
                id="reset-password"
                className="auth-field__input"
                type="password"
                name="password"
                minLength={8}
                maxLength={100}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <ul className="auth-password-rules" aria-label="비밀번호 규칙">
              {passwordRules.map((rule) => (
                <li key={rule.id} className={rule.valid ? 'is-valid' : undefined}>
                  <span className="auth-password-rules__marker" aria-hidden="true">
                    {rule.valid ? '✓' : '○'}
                  </span>
                  <span>{rule.label}</span>
                </li>
              ))}
            </ul>

            <div className="auth-field">
              <label className="auth-field__label" htmlFor="reset-password-confirm">
                새 비밀번호 확인 (필수)
              </label>
              <input
                id="reset-password-confirm"
                className="auth-field__input"
                type="password"
                name="passwordConfirm"
                minLength={8}
                maxLength={100}
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <button className="auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? '변경 중…' : '비밀번호 변경'}
            </button>
          </form>

          <div className="auth-footer">
            <Link className="auth-footer__link" to={PATHS.LOGIN}>
              로그인
            </Link>
            <Link className="auth-footer__link" to={PATHS.FIND_ID}>
              아이디 찾기
            </Link>
            <Link className="auth-footer__link" to={PATHS.JOIN}>
              회원가입
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
