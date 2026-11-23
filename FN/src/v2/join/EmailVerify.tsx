import { useEffect, useState } from 'react';
import { getEmailStatus, sendEmailCode, verifyEmailCode } from '../../api/email.api';
import { Field, Input, Select } from '../../ds';
import { mapVerificationError } from '../../join/joinErrors';
import { useJoinForm } from '../../join/JoinFormProvider';
import {
  TEACHER_EMAIL_DOMAIN_OPTIONS,
  buildTeacherEmail,
  formatTeacherDomainLabel,
  parseTeacherEmail,
} from '../../join/teacherEmailDomains';
import { validateStudentEmail, validateTeacherEmail } from '../../join/joinValidation';
import { VerifyRow } from './VerifyRow';

/** 이메일 인증 — 학생은 아무 이메일, 교사는 교육청·korea.kr 도메인만 */
export function EmailVerify() {
  const { state, fieldErrors, actions } = useJoinForm();
  const isTeacher = state.role === 'TEACHER';
  const [localPart, setLocalPart] = useState('');
  const [domain, setDomain] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'send' | 'verify' | null>(null);

  // 역할을 바꾸면 이메일 입력 상태를 처음으로
  useEffect(() => {
    const parsed = isTeacher ? parseTeacherEmail(state.email) : null;
    setLocalPart(parsed?.localPart ?? '');
    setDomain(parsed?.domain ?? '');
    setCode('');
    setSent(false);
    setMessage(null);
    setError(null);
  }, [state.role]);

  const email = isTeacher ? buildTeacherEmail(localPart, domain) : state.email.trim();

  function resetVerification() {
    setCode('');
    setSent(false);
    setMessage(null);
    setError(null);
  }

  function changeTeacher(nextLocal: string, nextDomain: string) {
    setLocalPart(nextLocal);
    setDomain(nextDomain);
    actions.setEmail(buildTeacherEmail(nextLocal, nextDomain));
    resetVerification();
  }

  async function checkStatus() {
    if (!email) return;
    try {
      const status = await getEmailStatus({ email, role: state.role });
      actions.setEmailVerified(status.verified);
    } catch {
      actions.setEmailVerified(false);
    }
  }

  async function send() {
    setMessage(null);
    setError(null);
    if (isTeacher && !domain) {
      setError('소속 교육청을 골라 주세요.');
      return;
    }
    const problem = isTeacher ? validateTeacherEmail(email) : validateStudentEmail(email);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy('send');
    try {
      const response = await sendEmailCode({ email, role: state.role });
      setSent(true);
      setMessage(response.message || '인증번호를 보냈어요. 메일함(스팸함 포함)을 확인해 주세요.');
    } catch (err) {
      setError(mapVerificationError(err, '인증번호를 보내지 못했어요.'));
    } finally {
      setBusy(null);
    }
  }

  async function verify() {
    setMessage(null);
    setError(null);
    if (code.length !== 6) {
      setError('인증번호 6자리를 입력해 주세요.');
      return;
    }
    setBusy('verify');
    try {
      await verifyEmailCode({ email, code, role: state.role });
      actions.setEmailVerified(true);
    } catch (err) {
      actions.setEmailVerified(false);
      setError(mapVerificationError(err, '인증번호를 다시 확인해 주세요.'));
    } finally {
      setBusy(null);
    }
  }

  const formError = fieldErrors.email ?? fieldErrors.emailVerification;

  return (
    <div className="flex flex-col gap-3">
      {isTeacher ? (
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-[13px] font-medium text-gray-700">
            학교·교육청 이메일
            <span className="ml-0.5 text-red-600" aria-hidden>
              *
            </span>
          </legend>
          <div id="teacherEmail" tabIndex={-1} className="flex items-center gap-1.5 outline-none">
            <Input
              aria-label="이메일 아이디"
              placeholder="아이디"
              autoCapitalize="none"
              inputMode="email"
              value={localPart}
              invalid={Boolean(fieldErrors.email)}
              disabled={state.emailVerified}
              onChange={(event) => changeTeacher(event.target.value.trim().toLowerCase().replace(/@/g, ''), domain)}
              onBlur={() => void checkStatus()}
            />
            <span className="text-gray-400" aria-hidden>
              @
            </span>
            <Select
              aria-label="소속 교육청"
              value={domain}
              invalid={Boolean(fieldErrors.email)}
              disabled={state.emailVerified}
              onChange={(event) => changeTeacher(localPart, event.target.value)}
              onBlur={() => void checkStatus()}
            >
              <option value="">교육청 선택</option>
              {TEACHER_EMAIL_DOMAIN_OPTIONS.map((option) => (
                <option key={option.domain} value={option.domain}>
                  {formatTeacherDomainLabel(option)}
                </option>
              ))}
            </Select>
          </div>
          <p className={fieldErrors.email ? 'text-xs text-red-600' : 'text-xs text-gray-500'}>
            {fieldErrors.email ??
              '시·도교육청 메일(sen.go.kr 등) 또는 korea.kr 만 쓸 수 있어요. 교사 확인에 사용합니다.'}
          </p>
        </fieldset>
      ) : (
        <Field label="이메일" required hint="아이디 찾기와 비밀번호 재설정에 쓰여요." error={fieldErrors.email}>
          <Input
            id="studentEmail"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            value={state.email}
            disabled={state.emailVerified}
            onChange={(event) => {
              actions.setEmail(event.target.value);
              resetVerification();
            }}
            onBlur={() => void checkStatus()}
          />
        </Field>
      )}
      <VerifyRow
        codeId={isTeacher ? 'teacherVerificationCode' : 'studentVerificationCode'}
        code={code}
        onCodeChange={setCode}
        onSend={() => void send()}
        onVerify={() => void verify()}
        sending={busy === 'send'}
        verifying={busy === 'verify'}
        verified={state.emailVerified}
        sent={sent}
        message={message}
        error={error ?? (fieldErrors.email ? null : formError)}
        doneText={`${email} 인증을 마쳤어요.`}
      />
      {state.emailVerified ? (
        <button
          type="button"
          className="self-start text-xs font-medium text-gray-500 underline-offset-4 hover:underline"
          onClick={() => {
            actions.setEmailVerified(false);
            resetVerification();
          }}
        >
          다른 이메일로 바꾸기
        </button>
      ) : null}
    </div>
  );
}
