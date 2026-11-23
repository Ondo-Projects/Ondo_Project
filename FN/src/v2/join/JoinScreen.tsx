import { type FormEvent, type ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleCheck, GraduationCap, UserRound } from 'lucide-react';
import type { SignUpRole } from '../../api/types/signup';
import { getSignupSuccessMessage } from '../../auth/loginNavigation';
import { Button, Field, Input, Notice, cn } from '../../ds';
import { usePageTitle } from '../../hooks/usePageTitle';
import { getJoinErrorSummary, scrollToFirstJoinError } from '../../join/joinA11y';
import { useJoinForm } from '../../join/JoinFormProvider';
import { PATHS } from '../../routes/paths';
import { AuthLinks, AuthShell } from '../auth/AuthShell';
import { PasswordRules } from '../auth/PasswordRules';
import { EmailVerify } from './EmailVerify';
import { GuardianBlock } from './GuardianBlock';
import { SchoolPicker } from './SchoolPicker';
import { TermsBlock } from './TermsBlock';

const ROLES: Array<{ value: SignUpRole; title: string; description: string; icon: typeof UserRound }> = [
  { value: 'STUDENT', title: '학생', description: '상담 신청, 마음 날씨, 급식·시간표', icon: UserRound },
  { value: 'TEACHER', title: '교사', description: '상담 답변, 학급 관리 · 교육청 메일 인증', icon: GraduationCap },
];

export default function JoinScreen() {
  usePageTitle('회원가입 | 온도');
  const navigate = useNavigate();
  const { state, fieldErrors, submitError, isSubmitting, isCheckingUsername, computed, actions } = useJoinForm();
  const [tried, setTried] = useState(false);
  const isTeacher = state.role === 'TEACHER';
  let step = 0;
  const next = () => (step += 1);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    actions.clearSubmitError();
    setTried(true);
    try {
      const response = await actions.submitSignup();
      navigate(PATHS.LOGIN, {
        replace: true,
        state: { signupSuccess: true, username: response.username, message: getSignupSuccessMessage(response.message) },
      });
    } catch {
      const validation = actions.validateClient();
      if (!validation.valid) scrollToFirstJoinError(validation.errors, state.role);
    }
  }

  const summary = tried ? getJoinErrorSummary(fieldErrors) : null;

  return (
    <AuthShell
      wide
      title="회원가입"
      description="가입 유형을 고르고 차례대로 입력해 주세요. 별표(*)는 꼭 입력해야 해요."
      footer={<AuthLinks links={[{ to: PATHS.LOGIN, label: '이미 계정이 있어요 · 로그인' }]} />}
    >
      <form onSubmit={submit} noValidate aria-busy={isSubmitting} className="flex flex-col gap-4">
        {summary ? <Notice tone="danger">{summary}</Notice> : null}

        <Step number={next()} title="가입 유형">
          <div role="radiogroup" aria-label="가입 유형" className="grid gap-2 sm:grid-cols-2">
            {ROLES.map(({ value, title, description, icon: Icon }) => {
              const active = state.role === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => !active && actions.setRole(value)}
                  className={cn(
                    'flex items-start gap-3 rounded-md border p-3 text-left transition-colors duration-150',
                    active ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:bg-gray-50',
                  )}
                >
                  <Icon
                    size={18}
                    className={cn('mt-0.5 shrink-0', active ? 'text-blue-700' : 'text-gray-400')}
                    aria-hidden
                  />
                  <span>
                    <span className={cn('block text-sm font-semibold', active ? 'text-blue-900' : 'text-gray-900')}>
                      {title}
                    </span>
                    <span className="mt-0.5 block text-xs text-gray-500">{description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </Step>

        <Step number={next()} title="학교">
          <SchoolPicker />
        </Step>

        <Step number={next()} title={isTeacher ? '이름과 이메일 인증' : '이름, 생년월일, 이메일 인증'}>
          <div className="flex flex-col gap-4">
            <div className={cn('grid gap-4', !isTeacher && 'sm:grid-cols-2')}>
              <Field
                label="이름"
                required
                hint={isTeacher ? '학생에게 담임 선생님 이름으로 보여요.' : '실명으로 입력해 주세요.'}
                error={fieldErrors.name}
              >
                <Input
                  id="name"
                  autoComplete="name"
                  maxLength={50}
                  value={state.name}
                  onChange={(event) => actions.setName(event.target.value)}
                />
              </Field>
              {!isTeacher ? (
                <Field
                  label="생년월일"
                  required
                  hint="만 14세 미만이면 보호자 동의 단계가 추가돼요."
                  error={fieldErrors.birthDate}
                >
                  <Input
                    id="birthDate"
                    type="date"
                    value={state.birthDate}
                    onChange={(event) => actions.setBirthDate(event.target.value)}
                  />
                </Field>
              ) : null}
            </div>
            <EmailVerify />
          </div>
        </Step>

        {computed.canShowGuardianSection ? (
          <Step number={next()} title="보호자 동의">
            <GuardianBlock />
          </Step>
        ) : null}

        <Step number={next()} title="아이디와 비밀번호">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-end gap-2">
                <Field label="아이디" required className="flex-1" error={fieldErrors.username}>
                  <Input
                    id="username"
                    autoComplete="username"
                    autoCapitalize="none"
                    maxLength={50}
                    value={state.username}
                    onChange={(event) => actions.setUsername(event.target.value)}
                  />
                </Field>
                <Button
                  className={cn('shrink-0', fieldErrors.username && 'mb-5')}
                  loading={isCheckingUsername}
                  onClick={() => void actions.runUsernameCheck()}
                >
                  중복 확인
                </Button>
              </div>
              {state.usernameChecked && state.usernameAvailable ? (
                <p className="flex items-center gap-1 text-xs font-medium text-emerald-700" role="status">
                  <CircleCheck size={14} aria-hidden />쓸 수 있는 아이디예요.
                </p>
              ) : !fieldErrors.username ? (
                <p className="text-xs text-gray-500">4~50자</p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <Field label="비밀번호" required error={fieldErrors.password}>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  maxLength={100}
                  value={state.password}
                  onChange={(event) => actions.setPassword(event.target.value)}
                />
              </Field>
              <PasswordRules password={state.password} username={state.username} />
            </div>
            <Field
              label="비밀번호 확인"
              required
              error={
                fieldErrors.passwordConfirm ??
                (state.passwordConfirm && state.password !== state.passwordConfirm
                  ? '위에 입력한 비밀번호와 달라요.'
                  : null)
              }
            >
              <Input
                id="passwordConfirm"
                type="password"
                autoComplete="new-password"
                maxLength={100}
                value={state.passwordConfirm}
                onChange={(event) => actions.setPasswordConfirm(event.target.value)}
              />
            </Field>
          </div>
        </Step>

        <Step number={next()} title="약관 동의">
          <TermsBlock />
        </Step>

        {submitError ? (
          <Notice tone="danger">
            <span id="join-submit-error">{submitError}</span>
          </Notice>
        ) : null}
        <Button type="submit" variant="primary" size="lg" className="w-full" loading={isSubmitting}>
          {isTeacher ? '교사로 가입하기' : '학생으로 가입하기'}
        </Button>
      </form>
    </AuthShell>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white">
      <header className="flex items-center gap-2.5 border-b border-gray-200 px-4 py-3 sm:px-5">
        <span className="flex h-5 w-5 items-center justify-center rounded bg-gray-900 text-[11px] font-semibold text-white tabular-nums">
          {number}
        </span>
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}
