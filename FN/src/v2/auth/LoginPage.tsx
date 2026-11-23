import { type FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/types/api-error';
import { useAuth } from '../../auth/AuthProvider';
import { getSignupSuccessMessage, type LoginLocationState } from '../../auth/loginNavigation';
import { getPostLoginPath } from '../../auth/redirects';
import { Button, Field, Input, Notice } from '../../ds';
import { usePageTitle } from '../../hooks/usePageTitle';
import { PATHS } from '../../routes/paths';
import { AuthCard, AuthLinks, AuthShell } from './AuthShell';

export default function LoginPage() {
  usePageTitle('로그인 | 온도');
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state as LoginLocationState | null) ?? null;
  const { login } = useAuth();
  const [username, setUsername] = useState(locationState?.username ?? '');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState<string | null>(
    locationState?.signupSuccess ? getSignupSuccessMessage(locationState.message) : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess(null);
    setError(null);
    const id = username.trim();
    if (!id || !password) {
      setError('아이디와 비밀번호를 입력해 주세요.');
      return;
    }
    setBusy(true);
    try {
      const profile = await login({ username: id, password });
      navigate(locationState?.from ?? getPostLoginPath(profile.role), { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message || '아이디 또는 비밀번호를 다시 확인해 주세요.'
          : '로그인하지 못했어요. 잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="로그인"
      description="학생·교사 계정으로 들어갑니다."
      footer={
        <AuthLinks
          links={[
            { to: PATHS.FIND_ID, label: '아이디 찾기' },
            { to: PATHS.RESET_PASSWORD, label: '비밀번호 재설정' },
            { to: PATHS.JOIN, label: '회원가입' },
          ]}
        />
      }
    >
      <AuthCard>
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          {success ? <Notice tone="success">{success}</Notice> : null}
          {error ? <Notice tone="danger">{error}</Notice> : null}
          <Field label="아이디">
            <Input
              id="login-username"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              value={username}
              disabled={busy}
              onChange={(event) => setUsername(event.target.value)}
              autoFocus={!locationState?.username}
            />
          </Field>
          <Field label="비밀번호">
            <Input
              id="login-password"
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              disabled={busy}
              onChange={(event) => setPassword(event.target.value)}
              autoFocus={Boolean(locationState?.username)}
            />
          </Field>
          <Button type="submit" variant="primary" size="lg" className="mt-1 w-full" loading={busy}>
            로그인
          </Button>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
