import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { sendFindIdCode, verifyFindIdCode } from '../api/recovery.api';
import { mapVerificationError } from '../join/joinErrors';
import AppLayout from '../components/layout/AppLayout';
import AuthPageShell from '../components/AuthPageShell';
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
        <div className="auth-card">
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

          {foundUsername ? (
            <div className="auth-result" role="status">
              <p className="auth-result__label">확인된 아이디</p>
              <p className="auth-result__value">{foundUsername}</p>
              <Link className="auth-submit auth-result__link" to={PATHS.LOGIN}>
                로그인하러 가기
              </Link>
            </div>
          ) : (
            <form className="auth-form" onSubmit={(event) => void handleVerify(event)} noValidate>
              <div className="auth-field">
                <label className="auth-field__label" htmlFor="find-id-name">
                  성명 (필수)
                </label>
                <input
                  id="find-id-name"
                  className="auth-field__input"
                  type="text"
                  name="name"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={isSending || isVerifying}
                />
              </div>

              <div className="auth-field">
                <label className="auth-field__label" htmlFor="find-id-email">
                  이메일 (필수)
                </label>
                <input
                  id="find-id-email"
                  className="auth-field__input"
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isSending || isVerifying}
                />
              </div>

              <div className="auth-field">
                <label className="auth-field__label" htmlFor="find-id-birth-date">
                  생년월일 (필수)
                </label>
                <input
                  id="find-id-birth-date"
                  className="auth-field__input"
                  type="date"
                  name="birthDate"
                  value={birthDate}
                  onChange={(event) => setBirthDate(event.target.value)}
                  disabled={isSending || isVerifying}
                />
              </div>

              <div className="auth-inline-actions">
                <button
                  type="button"
                  className="auth-btn auth-btn--secondary"
                  disabled={isSending || isVerifying}
                  onClick={() => void handleSendCode()}
                >
                  {isSending ? '발송 중…' : '인증번호 발송'}
                </button>
              </div>

              <div className="auth-field">
                <label className="auth-field__label" htmlFor="find-id-code">
                  인증번호 6자리
                </label>
                <input
                  id="find-id-code"
                  className="auth-field__input"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                  disabled={isVerifying}
                />
              </div>

              <button className="auth-submit" type="submit" disabled={isVerifying}>
                {isVerifying ? '확인 중…' : '아이디 확인'}
              </button>
            </form>
          )}

          <div className="auth-footer">
            <Link className="auth-footer__link" to={PATHS.LOGIN}>
              로그인
            </Link>
            <Link className="auth-footer__link" to={PATHS.RESET_PASSWORD}>
              비밀번호 재설정
            </Link>
            <Link className="auth-footer__link" to={PATHS.JOIN}>
              회원가입
            </Link>
          </div>
        </div>
      </AuthPageShell>
    </AppLayout>
  );
}
