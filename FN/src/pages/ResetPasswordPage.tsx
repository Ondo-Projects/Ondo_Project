import { type FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resetPassword, sendPasswordResetCode } from '../api/recovery.api';
import { mapVerificationError } from '../join/joinErrors';
import { validatePassword } from '../join/joinValidation';
import AppLayout from '../components/layout/AppLayout';
import AuthPageShell from '../components/AuthPageShell';
import { Alert, Btn, Card, Field, Input } from '../components/ui';
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
      <AuthPageShell
        title="비밀번호 재설정"
        subtitle="가입 시 등록한 아이디와 이메일로 본인 확인 후 새 비밀번호를 설정할 수 있어요."
      >
        <Card compact>
          {statusMessage ? <Alert variant="success">{statusMessage}</Alert> : null}

          {errorMessage ? <Alert variant="error">{errorMessage}</Alert> : null}

          <form className="auth-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
            <Field id="reset-username" label="아이디" required>
              <Input
                type="text"
                name="username"
                minLength={4}
                maxLength={50}
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                disabled={isSending || isSubmitting}
              />
            </Field>

            <Field id="reset-email" label="이메일" required>
              <Input
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isSending || isSubmitting}
              />
            </Field>

            <div className="auth-inline-actions">
              <Btn
                type="button"
                variant="secondary"
                size="student"
                disabled={isSending || isSubmitting}
                onClick={() => void handleSendCode()}
              >
                {isSending ? '발송 중…' : '인증번호 발송'}
              </Btn>
            </div>

            <Field id="reset-code" label="인증번호 6자리">
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                autoComplete="one-time-code"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                disabled={isSubmitting}
              />
            </Field>

            <Field id="reset-password" label="새 비밀번호" required>
              <Input
                type="password"
                name="password"
                minLength={8}
                maxLength={100}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isSubmitting}
              />
            </Field>

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

            <Field id="reset-password-confirm" label="새 비밀번호 확인" required>
              <Input
                type="password"
                name="passwordConfirm"
                minLength={8}
                maxLength={100}
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
                disabled={isSubmitting}
              />
            </Field>

            <Btn type="submit" variant="primary" size="student" fullWidth disabled={isSubmitting}>
              {isSubmitting ? '변경 중…' : '비밀번호 변경'}
            </Btn>
          </form>

          <nav className="auth-footer" aria-label="인증 관련 링크">
            <Btn variant="ghost" size="student" to={PATHS.LOGIN}>
              로그인
            </Btn>
            <Btn variant="ghost" size="student" to={PATHS.FIND_ID}>
              아이디 찾기
            </Btn>
            <Btn variant="ghost" size="student" to={PATHS.JOIN}>
              회원가입
            </Btn>
          </nav>
        </Card>
      </AuthPageShell>
    </AppLayout>
  );
}
