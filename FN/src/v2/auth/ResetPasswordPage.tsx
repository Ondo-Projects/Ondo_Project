import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resetPassword, sendPasswordResetCode } from '../../api/recovery.api';
import { Button, Field, Input, Notice } from '../../ds';
import { usePageTitle } from '../../hooks/usePageTitle';
import { mapVerificationError } from '../../join/joinErrors';
import { validatePassword } from '../../join/joinValidation';
import { PATHS } from '../../routes/paths';
import { AuthCard, AuthLinks, AuthShell } from './AuthShell';
import { PasswordRules } from './PasswordRules';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ResetPasswordPage() {
  usePageTitle('비밀번호 재설정 | 온도');
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [sent, setSent] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'send' | 'submit' | null>(null);

  function accountError(): string | null {
    const id = username.trim();
    if (id.length < 4 || id.length > 50) return '아이디는 4~50자로 입력해 주세요.';
    if (!EMAIL_PATTERN.test(email.trim())) return '가입할 때 쓴 이메일을 정확히 입력해 주세요.';
    return null;
  }

  async function send() {
    setInfo(null);
    setError(null);
    const problem = accountError();
    if (problem) {
      setError(problem);
      return;
    }
    setBusy('send');
    try {
      const response = await sendPasswordResetCode({ username: username.trim(), email: email.trim() });
      setSent(true);
      setInfo(response.message || '인증번호를 보냈어요. 메일함을 확인해 주세요.');
    } catch (err) {
      setError(mapVerificationError(err, '인증번호를 보내지 못했어요.'));
    } finally {
      setBusy(null);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInfo(null);
    setError(null);
    const problem =
      accountError() ??
      (!/^\d{6}$/.test(code) ? '메일로 받은 인증번호 6자리를 입력해 주세요.' : null) ??
      validatePassword(password, username.trim()) ??
      (password !== passwordConfirm ? '새 비밀번호 확인이 일치하지 않아요.' : null);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy('submit');
    try {
      const response = await resetPassword({
        username: username.trim(),
        email: email.trim(),
        code,
        password,
        passwordConfirm,
      });
      navigate(PATHS.LOGIN, {
        replace: true,
        state: {
          signupSuccess: true,
          username: username.trim(),
          message: response.message || '비밀번호를 바꿨어요. 새 비밀번호로 로그인해 주세요.',
        },
      });
    } catch (err) {
      setError(mapVerificationError(err, '비밀번호를 바꾸지 못했어요.'));
    } finally {
      setBusy(null);
    }
  }

  return (
    <AuthShell
      title="비밀번호 재설정"
      description="아이디와 가입할 때 쓴 이메일로 확인한 뒤 새 비밀번호를 정합니다."
      footer={
        <AuthLinks
          links={[
            { to: PATHS.LOGIN, label: '로그인' },
            { to: PATHS.FIND_ID, label: '아이디 찾기' },
            { to: PATHS.JOIN, label: '회원가입' },
          ]}
        />
      }
    >
      <AuthCard>
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          {error ? <Notice tone="danger">{error}</Notice> : null}
          {info ? <Notice tone="success">{info}</Notice> : null}
          <Field label="아이디">
            <Input
              autoComplete="username"
              autoCapitalize="none"
              value={username}
              disabled={busy !== null}
              onChange={(event) => setUsername(event.target.value)}
            />
          </Field>
          <Field label="이메일">
            <Input
              type="email"
              autoComplete="email"
              value={email}
              disabled={busy !== null}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <div className="flex items-end gap-2">
            <Field label="인증번호" className="flex-1">
              <Input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="6자리"
                value={code}
                disabled={busy === 'submit'}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
              />
            </Field>
            <Button loading={busy === 'send'} disabled={busy !== null} onClick={() => void send()}>
              {sent ? '다시 보내기' : '인증번호 받기'}
            </Button>
          </div>

          <div className="flex flex-col gap-4 border-t border-gray-100 pt-4">
            <Field label="새 비밀번호">
              <Input
                type="password"
                autoComplete="new-password"
                maxLength={100}
                value={password}
                disabled={busy === 'submit'}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>
            <PasswordRules password={password} username={username} />
            <Field
              label="새 비밀번호 확인"
              error={passwordConfirm && password !== passwordConfirm ? '위에 입력한 비밀번호와 달라요.' : null}
            >
              <Input
                type="password"
                autoComplete="new-password"
                maxLength={100}
                value={passwordConfirm}
                disabled={busy === 'submit'}
                onChange={(event) => setPasswordConfirm(event.target.value)}
              />
            </Field>
          </div>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={busy === 'submit'}
            disabled={busy !== null}
          >
            비밀번호 바꾸기
          </Button>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
