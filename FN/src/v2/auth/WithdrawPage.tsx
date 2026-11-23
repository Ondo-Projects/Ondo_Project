import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/types/api-error';
import type { WithdrawReason } from '../../api/types/withdraw';
import { withdrawAccount } from '../../api/withdraw.api';
import { useAuth } from '../../auth/AuthProvider';
import AuthLoading from '../../auth/AuthLoading';
import { getSignupSuccessMessage } from '../../auth/loginNavigation';
import { Button, Checkbox, Field, Input, Notice, cn } from '../../ds';
import { usePageTitle } from '../../hooks/usePageTitle';
import { PATHS } from '../../routes/paths';
import { getWithdrawReasonOptions } from '../../withdraw/withdrawReasons';
import { AuthCard, AuthShell } from './AuthShell';

export default function WithdrawPage() {
  usePageTitle('회원 탈퇴 | 온도');
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [reason, setReason] = useState<WithdrawReason | ''>('');
  const [detail, setDetail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!user) return <AuthLoading message="회원 탈퇴 화면을 준비하고 있어요" />;

  const options = getWithdrawReasonOptions(user.role);
  const backPath = user.role === 'TEACHER' ? `${PATHS.TEACHER}#settings` : `${PATHS.STUDENT}#me`;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!agreed) return setError('안내를 확인하고 동의에 체크해 주세요.');
    if (reason === 'OTHER' && !detail.trim()) return setError('기타 이유를 적어 주세요.');
    if (!password) return setError('비밀번호를 입력해 주세요.');
    if (!window.confirm('정말 탈퇴할까요?\n탈퇴하면 이 계정으로 다시 로그인할 수 없어요.')) return;

    setBusy(true);
    try {
      const response = await withdrawAccount({
        password,
        agreed: true,
        reason: reason || undefined,
        reasonDetail: reason === 'OTHER' ? detail.trim() : undefined,
      });
      await logout();
      navigate(PATHS.LOGIN, {
        replace: true,
        state: {
          signupSuccess: true,
          message: getSignupSuccessMessage(response.message || '회원 탈퇴가 완료되었습니다.'),
        },
      });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message || '탈퇴하지 못했어요.'
          : '탈퇴하지 못했어요. 잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="회원 탈퇴"
      description={`${user.name?.trim() || user.username}님, 탈퇴하기 전에 아래 내용을 확인해 주세요.`}
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <AuthCard className="flex flex-col gap-5">
          <ul className="flex list-disc flex-col gap-1.5 pl-4 text-[13px] leading-relaxed text-gray-700">
            <li>서비스 이용과 상담 내역 조회가 바로 중단되고, 이 계정으로 다시 로그인할 수 없어요.</li>
            <li>상담 기록은 관련 법령과 이용약관에 따라 일정 기간 보관한 뒤 파기돼요.</li>
          </ul>

          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1.5 text-[13px] font-medium text-gray-700">떠나는 이유 (선택)</legend>
            {options.map((option) => (
              <label
                key={option.value}
                className={cn(
                  'flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2 text-[13px] transition-colors duration-150',
                  reason === option.value
                    ? 'border-blue-600 bg-blue-50 text-gray-900'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50',
                )}
              >
                <input
                  type="radio"
                  name="withdrawReason"
                  value={option.value}
                  checked={reason === option.value}
                  onChange={() => setReason(option.value)}
                  disabled={busy}
                  className="h-4 w-4 accent-blue-700"
                />
                {option.label}
              </label>
            ))}
          </fieldset>
          {reason === 'OTHER' ? (
            <Field label="기타 이유">
              <Input
                maxLength={500}
                value={detail}
                disabled={busy}
                onChange={(event) => setDetail(event.target.value)}
              />
            </Field>
          ) : null}

          <div className="flex flex-col gap-4 border-t border-gray-100 pt-4">
            <Checkbox checked={agreed} onChange={setAgreed} disabled={busy}>
              위 내용을 모두 확인했고, 탈퇴에 동의합니다. (필수)
            </Checkbox>
            <Field label="비밀번호" hint="본인 확인을 위해 입력해 주세요.">
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                disabled={busy}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>
          </div>
        </AuthCard>

        {error ? <Notice tone="danger">{error}</Notice> : null}
        <div className="flex gap-2">
          <Button size="lg" className="flex-1" disabled={busy} onClick={() => navigate(backPath)}>
            계속 이용하기
          </Button>
          <Button type="submit" variant="danger" size="lg" className="flex-1" loading={busy}>
            탈퇴하기
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}
