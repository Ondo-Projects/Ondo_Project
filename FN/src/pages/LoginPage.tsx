import { type FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import {
  getSignupSuccessMessage,
  type LoginLocationState,
} from '../auth/loginNavigation';
import { getPostLoginPath } from '../auth/redirects';
import { ApiError } from '../api/types/api-error';
import AppLayout from '../components/layout/AppLayout';
import AuthPageShell from '../components/AuthPageShell';
import { Alert, Btn, Card, Field, Input } from '../components/ui';
import { PATHS } from '../routes/paths';
import '../auth/auth.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state as LoginLocationState | null) ?? null;
  const { login } = useAuth();
  const [username, setUsername] = useState(locationState?.username ?? '');
  const [password, setPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(
    locationState?.signupSuccess
      ? getSignupSuccessMessage(locationState.message)
      : null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectPath = locationState?.from ?? null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      setErrorMessage('아이디와 비밀번호를 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const profile = await login({ username: trimmedUsername, password });
      const destination = redirectPath ?? getPostLoginPath(profile.role);
      navigate(destination, { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message || '아이디 또는 비밀번호를 다시 확인해 주세요.');
      } else {
        setErrorMessage('로그인하지 못했어요. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppLayout>
      <AuthPageShell title="로그인" subtitle="학생·교사 계정으로 온도에 접속해요.">
        <Card compact>
          {successMessage ? <Alert variant="success">{successMessage}</Alert> : null}

          {errorMessage ? <Alert variant="error">{errorMessage}</Alert> : null}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <Field id="username" label="아이디" required>
              <Input
                type="text"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                disabled={isSubmitting}
              />
            </Field>

            <Field id="password" label="비밀번호" required>
              <Input
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isSubmitting}
              />
            </Field>

            <Btn type="submit" variant="primary" size="student" fullWidth disabled={isSubmitting}>
              {isSubmitting ? '로그인 중…' : '로그인'}
            </Btn>
          </form>

          <div className="auth-footer">
            <Link className="auth-footer__link" to={PATHS.FIND_ID}>
              아이디 찾기
            </Link>
            <Link className="auth-footer__link" to={PATHS.RESET_PASSWORD}>
              비밀번호 재설정
            </Link>
            <Link className="auth-footer__link" to={PATHS.JOIN}>
              회원가입
            </Link>
            <Link className="auth-footer__link" to={PATHS.ROOT}>
              처음으로
            </Link>
          </div>
        </Card>
      </AuthPageShell>
    </AppLayout>
  );
}
