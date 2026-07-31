import { type FormEvent, useState } from 'react';
import { sendFindIdCode, verifyFindIdCode } from '../api/recovery.api';
import { mapVerificationError } from '../join/joinErrors';
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

export default function FindIdPage() {
  usePageTitle('아이디 찾기 | 온도');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [code, setCode] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [foundUsername, setFoundUsername] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  function buildIdentityPayload() {
    return {
      name: name.trim(),
      email: email.trim(),
      birthDate: birthDate.trim(),
    };
  }

  function validateIdentity(): string | null {
    if (!name.trim()) {
      return '성명을 입력해 주세요.';
    }
    const emailError = validateEmail(email);
    if (emailError) {
      return emailError;
    }
    if (!birthDate.trim()) {
      return '생년월일을 입력해 주세요.';
    }
    return null;
  }

  async function handleSendCode() {
    setStatusMessage(null);
    setErrorMessage(null);
    setFoundUsername(null);

    const validationError = validateIdentity();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSending(true);
    try {
      const response = await sendFindIdCode(buildIdentityPayload());
      setStatusMessage(response.message || '인증번호를 보냈어요. 메일함을 확인해 주세요.');
    } catch (error) {
      setErrorMessage(mapVerificationError(error, '인증번호를 보내지 못했어요.'));
    } finally {
      setIsSending(false);
    }
  }

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);
    setFoundUsername(null);

    const validationError = validateIdentity();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const trimmedCode = code.trim();
    if (!/^\d{6}$/.test(trimmedCode)) {
      setErrorMessage('인증번호 6자리를 입력해 주세요.');
      return;
    }

    setIsVerifying(true);
    try {
      const response = await verifyFindIdCode({
        ...buildIdentityPayload(),
        code: trimmedCode,
      });
      setFoundUsername(response.username);
      setStatusMessage(response.message || '아이디를 확인했어요.');
    } catch (error) {
      setErrorMessage(mapVerificationError(error, '인증번호를 다시 확인해 주세요.'));
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <AppLayout>
      <AuthPageShell
        title="아이디 찾기"
        subtitle="가입 시 등록한 성명, 이메일, 생년월일로 본인 확인 후 아이디를 확인할 수 있어요."
      >
        <Card compact>
          {statusMessage ? <Alert variant="success">{statusMessage}</Alert> : null}

          {errorMessage ? <Alert variant="error">{errorMessage}</Alert> : null}

          {foundUsername ? (
            <div className="auth-result" role="status">
              <p className="auth-result__label">확인된 아이디</p>
              <p className="auth-result__value">{foundUsername}</p>
              <Btn variant="primary" size="student" fullWidth to={PATHS.LOGIN}>
                로그인하러 가기
              </Btn>
            </div>
          ) : (
            <form className="auth-form" onSubmit={(event) => void handleVerify(event)} noValidate>
              <Field id="find-id-name" label="성명" required>
                <Input
                  type="text"
                  name="name"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={isSending || isVerifying}
                />
              </Field>

              <Field id="find-id-email" label="이메일" required>
                <Input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isSending || isVerifying}
                />
              </Field>

              <Field id="find-id-birth-date" label="생년월일" required>
                <Input
                  type="date"
                  name="birthDate"
                  value={birthDate}
                  onChange={(event) => setBirthDate(event.target.value)}
                  disabled={isSending || isVerifying}
                />
              </Field>

              <div className="auth-inline-actions">
                <Btn
                  type="button"
                  variant="secondary"
                  size="student"
                  disabled={isSending || isVerifying}
                  onClick={() => void handleSendCode()}
                >
                  {isSending ? '발송 중…' : '인증번호 발송'}
                </Btn>
              </div>

              <Field id="find-id-code" label="인증번호 6자리">
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                  disabled={isVerifying}
                />
              </Field>

              <Btn type="submit" variant="primary" size="student" fullWidth disabled={isVerifying}>
                {isVerifying ? '확인 중…' : '아이디 확인'}
              </Btn>
            </form>
          )}

          <nav className="auth-footer" aria-label="인증 관련 링크">
            <Btn variant="ghost" size="student" to={PATHS.LOGIN}>
              로그인
            </Btn>
            <Btn variant="ghost" size="student" to={PATHS.RESET_PASSWORD}>
              비밀번호 재설정
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
