import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { sendFindIdCode, verifyFindIdCode } from '../../api/recovery.api';
import { Button, Field, Input, Notice } from '../../ds';
import { usePageTitle } from '../../hooks/usePageTitle';
import { mapVerificationError } from '../../join/joinErrors';
import { PATHS } from '../../routes/paths';
import { AuthCard, AuthLinks, AuthShell } from './AuthShell';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function FindIdPage() {
  usePageTitle('아이디 찾기 | 온도');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState<string | null>(null);
  const [busy, setBusy] = useState<'send' | 'verify' | null>(null);

  function identityError(): string | null {
    if (!name.trim()) return '이름을 입력해 주세요.';
    if (!EMAIL_PATTERN.test(email.trim())) return '가입할 때 쓴 이메일을 정확히 입력해 주세요.';
    if (!birthDate) return '생년월일을 입력해 주세요.';
    return null;
  }

  const identity = () => ({ name: name.trim(), email: email.trim(), birthDate });

  async function send() {
    setInfo(null);
    setError(null);
    const problem = identityError();
    if (problem) {
      setError(problem);
      return;
    }
    setBusy('send');
    try {
      const response = await sendFindIdCode(identity());
      setSent(true);
      setInfo(response.message || '인증번호를 보냈어요. 메일함을 확인해 주세요.');
    } catch (err) {
      setError(mapVerificationError(err, '인증번호를 보내지 못했어요.'));
    } finally {
      setBusy(null);
    }
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInfo(null);
    setError(null);
    const problem = identityError();
    if (problem) {
      setError(problem);
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setError('메일로 받은 인증번호 6자리를 입력해 주세요.');
      return;
    }
    setBusy('verify');
    try {
      const response = await verifyFindIdCode({ ...identity(), code });
      setFound(response.username);
    } catch (err) {
      setError(mapVerificationError(err, '인증번호를 다시 확인해 주세요.'));
    } finally {
      setBusy(null);
    }
  }

  return (
    <AuthShell
      title="아이디 찾기"
      description="가입할 때 입력한 이름, 이메일, 생년월일로 확인합니다."
      footer={
        <AuthLinks
          links={[
            { to: PATHS.LOGIN, label: '로그인' },
            { to: PATHS.RESET_PASSWORD, label: '비밀번호 재설정' },
            { to: PATHS.JOIN, label: '회원가입' },
          ]}
        />
      }
    >
      <AuthCard>
        {found ? (
          <div className="flex flex-col gap-4" role="status">
            <div>
              <p className="text-[13px] text-gray-500">가입한 아이디</p>
              <p className="mt-1 font-mono text-xl font-semibold text-gray-900 select-all">{found}</p>
            </div>
            <Link
              to={PATHS.LOGIN}
              state={{ username: found }}
              className="inline-flex h-10 items-center justify-center rounded-md bg-blue-700 text-sm font-medium text-white hover:bg-blue-800"
            >
              이 아이디로 로그인
            </Link>
          </div>
        ) : (
          <form onSubmit={verify} noValidate className="flex flex-col gap-4">
            {error ? <Notice tone="danger">{error}</Notice> : null}
            {info ? <Notice tone="success">{info}</Notice> : null}
            <Field label="이름">
              <Input
                autoComplete="name"
                value={name}
                disabled={busy !== null}
                onChange={(event) => setName(event.target.value)}
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
            <Field label="생년월일">
              <Input
                type="date"
                value={birthDate}
                disabled={busy !== null}
                onChange={(event) => setBirthDate(event.target.value)}
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
                  disabled={busy === 'verify'}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                />
              </Field>
              <Button loading={busy === 'send'} disabled={busy !== null} onClick={() => void send()}>
                {sent ? '다시 보내기' : '인증번호 받기'}
              </Button>
            </div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={busy === 'verify'}
              disabled={busy !== null}
            >
              아이디 확인
            </Button>
          </form>
        )}
      </AuthCard>
    </AuthShell>
  );
}
