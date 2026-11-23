import { useEffect, useState } from 'react';
import { Copy, House, LogOut, RefreshCw, UserX } from 'lucide-react';
import {
  getTeacherInviteCode,
  getTeacherNotificationSettings,
  regenerateTeacherInviteCode,
  updateTeacherNotificationSettings,
} from '../../api/teacher.api';
import { Button, Field, Input, ListRow, Notice, PageTitle, Panel, Skeleton, Toggle } from '../../ds';
import { PATHS } from '../../routes/paths';
import { type FeedbackHandlers, formatCompactDateTime, resolveErrorMessage } from './shared';

interface SettingsViewProps extends FeedbackHandlers {
  onLogout: () => void;
}

export default function SettingsView({ onSuccess, onError, onLogout }: SettingsViewProps) {
  return (
    <div className="flex flex-col gap-5">
      <PageTitle title="설정" description="학생 연결, 문자 알림, 계정을 관리합니다." />
      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-5">
          <InviteCodePanel onSuccess={onSuccess} onError={onError} />
          <Panel title="계정" flush>
            <div className="divide-y divide-gray-100">
              <ListRow label="공통 홈" description="급식·시간표·플랫폼 공지" icon={<House size={18} />} to={PATHS.HOME} />
              <ListRow label="로그아웃" icon={<LogOut size={18} />} onClick={onLogout} />
              <ListRow label="회원 탈퇴" icon={<UserX size={18} />} to={PATHS.WITHDRAW} destructive />
            </div>
          </Panel>
        </div>
        <SmsSettingsPanel onSuccess={onSuccess} onError={onError} />
      </div>
    </div>
  );
}

function InviteCodePanel({ onSuccess, onError }: FeedbackHandlers) {
  const [code, setCode] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    getTeacherInviteCode()
      .then((data) => {
        setCode(data.code);
        setCreatedAt(data.createdAt);
      })
      .catch((error) => onError(resolveErrorMessage(error, '초대 코드를 불러오지 못했습니다.')));
  }, [onError]);

  async function copy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      onSuccess('초대 코드를 복사했습니다.');
    } catch {
      onError('복사하지 못했습니다. 코드를 직접 선택해 복사해 주세요.');
    }
  }

  async function regenerate() {
    if (!window.confirm('초대 코드를 새로 만들까요? 지금 코드는 더 이상 쓸 수 없습니다. 이미 연결된 학생은 그대로 유지됩니다.')) return;
    setIsRegenerating(true);
    try {
      const data = await regenerateTeacherInviteCode();
      setCode(data.code);
      setCreatedAt(data.createdAt);
      onSuccess('새 초대 코드를 만들었습니다.');
    } catch (error) {
      onError(resolveErrorMessage(error, '초대 코드를 새로 만들지 못했습니다.'));
    } finally {
      setIsRegenerating(false);
    }
  }

  return (
    <Panel title="학생 초대 코드" description="학생이 이 코드를 입력하면 선생님 학급으로 연결됩니다.">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          {code ? (
            <p className="font-mono text-2xl font-semibold tracking-[0.2em] text-gray-900 select-all" id="inviteCode">
              {code}
            </p>
          ) : (
            <Skeleton className="h-8 w-36" />
          )}
          <p className="mt-1 text-xs text-gray-500 tabular-nums">발급 {formatCompactDateTime(createdAt)}</p>
        </div>
        <div className="flex gap-1.5">
          <Button size="sm" icon={<Copy size={16} aria-hidden />} disabled={!code} onClick={() => void copy()}>
            복사
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={<RefreshCw size={16} aria-hidden />}
            disabled={!code}
            loading={isRegenerating}
            onClick={() => void regenerate()}
          >
            새로 만들기
          </Button>
        </div>
      </div>
    </Panel>
  );
}

function SmsSettingsPanel({ onSuccess, onError }: FeedbackHandlers) {
  const [phone, setPhone] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getTeacherNotificationSettings()
      .then((data) => {
        setPhone(data.phone ?? '');
        setEnabled(data.smsNotifyEnabled);
        setReady(data.ready);
        setMessage(data.message ?? null);
      })
      .catch((error) => onError(resolveErrorMessage(error, '문자 알림 설정을 불러오지 못했습니다.')))
      .finally(() => setIsLoading(false));
  }, [onError]);

  async function save() {
    setIsSaving(true);
    try {
      const data = await updateTeacherNotificationSettings({ phone: phone.trim(), smsNotifyEnabled: enabled });
      setPhone(data.phone ?? phone.trim());
      setEnabled(data.smsNotifyEnabled);
      setReady(data.ready);
      setMessage(data.message ?? null);
      onSuccess(data.message || '문자 알림 설정을 저장했습니다.');
    } catch (error) {
      onError(resolveErrorMessage(error, '문자 알림 설정을 저장하지 못했습니다.'));
    } finally {
      setIsSaving(false);
    }
  }

  const disabled = isLoading || isSaving;

  return (
    <Panel title="상담 신청 문자 알림" description="학생이 상담을 신청하면 휴대전화로 알려 드립니다.">
      <div className="flex flex-col gap-4">
        {isLoading ? (
          <Skeleton className="h-9 w-full" />
        ) : (
          <Notice tone={ready ? 'success' : 'info'}>
            {message ||
              (ready ? '문자 알림을 받고 있습니다.' : '번호를 입력하고 수신에 동의해야 문자를 받을 수 있습니다.')}
          </Notice>
        )}

        <Field label="휴대전화 번호" hint="숫자만 입력해 주세요.">
          <Input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="01012345678"
            value={phone}
            disabled={disabled}
            onChange={(event) => setPhone(event.target.value)}
          />
        </Field>

        <div className="flex items-center justify-between gap-4 rounded-md border border-gray-200 px-3 py-2.5">
          <div>
            <p className="text-[13px] font-medium text-gray-900">상담 신청 문자 받기</p>
            <p className="text-xs text-gray-500">수신에 동의합니다. 문자에는 상담 내용이 들어가지 않습니다.</p>
          </div>
          <Toggle checked={enabled} onChange={setEnabled} label="상담 신청 문자 받기" disabled={disabled} />
        </div>

        <div className="flex justify-end">
          <Button variant="primary" loading={isSaving} disabled={isLoading} onClick={() => void save()}>
            저장
          </Button>
        </div>
      </div>
    </Panel>
  );
}
