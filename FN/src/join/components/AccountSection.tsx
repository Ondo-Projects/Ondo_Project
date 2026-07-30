import { useMemo } from 'react';
import { useJoinForm } from '../JoinFormProvider';
import JoinField from './JoinField';
import JoinSection from './JoinSection';

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

export default function AccountSection() {
  const { state, fieldErrors, isCheckingUsername, computed, actions } = useJoinForm();
  const sectionNumber =
    state.role === 'TEACHER' ? '5' : computed.canShowGuardianSection ? '6' : '5';

  const passwordRules = useMemo(
    () => getPasswordRuleChecks(state.password, state.username),
    [state.password, state.username],
  );

  return (
    <JoinSection title={`${sectionNumber}. 계정 정보`}>
      <JoinField id="username" label="아이디" error={fieldErrors.username} required>
        <input
          type="text"
          name="username"
          minLength={4}
          maxLength={50}
          autoComplete="username"
          value={state.username}
          onChange={(event) => actions.setUsername(event.target.value)}
        />
      </JoinField>

      <div className="join-inline-actions">
        <button
          type="button"
          className="join-btn join-btn--secondary"
          disabled={isCheckingUsername}
          onClick={() => void actions.runUsernameCheck()}
        >
          {isCheckingUsername ? '확인 중…' : '중복 확인'}
        </button>
      </div>

      {state.usernameChecked && state.usernameAvailable ? (
        <p className="join-message join-message--success" role="status">
          <span className="join-message__icon" aria-hidden="true">
            ✓
          </span>
          <span>사용 가능한 아이디예요.</span>
        </p>
      ) : null}

      <JoinField id="password" label="비밀번호" error={fieldErrors.password} required>
        <input
          type="password"
          name="password"
          minLength={8}
          maxLength={100}
          autoComplete="new-password"
          value={state.password}
          onChange={(event) => actions.setPassword(event.target.value)}
        />
      </JoinField>
      <ul className="join-password-rules" aria-label="비밀번호 규칙">
        {passwordRules.map((rule) => (
          <li key={rule.id} className={rule.valid ? 'is-valid' : undefined}>
            <span className="join-password-rules__marker" aria-hidden="true">
              {rule.valid ? '✓' : '○'}
            </span>
            <span>{rule.label}</span>
          </li>
        ))}
      </ul>

      <JoinField
        id="passwordConfirm"
        label="비밀번호 확인"
        error={fieldErrors.passwordConfirm}
        required
      >
        <input
          type="password"
          name="passwordConfirm"
          minLength={8}
          maxLength={100}
          autoComplete="new-password"
          value={state.passwordConfirm}
          onChange={(event) => actions.setPasswordConfirm(event.target.value)}
        />
      </JoinField>
    </JoinSection>
  );
}
