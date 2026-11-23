import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, Copy, House, LogOut, RefreshCw, UserMinus, UserX } from 'lucide-react';
import {
  getClassStudents,
  getTeacherInviteCode,
  getTeacherNotificationSettings,
  regenerateTeacherInviteCode,
  releaseClass,
  releaseClassStudent,
  updateTeacherNotificationSettings,
} from '../../api/teacher.api';
import type { ClassStudent } from '../../api/types/teacher';
import { Button, Field, Input, ListRow, Notice, PageTitle, Panel, Skeleton, Toggle } from '../../ds';
import { PATHS } from '../../routes/paths';
import { type FeedbackHandlers, displayName, formatCompactDateTime, resolveErrorMessage } from './shared';

interface SettingsViewProps extends FeedbackHandlers {
  onLogout: () => void;
}

export default function SettingsView({ onSuccess, onError, onLogout }: SettingsViewProps) {
  // 학급 정리로 초대 코드가 바뀌면 코드 칸도 새로 불러옵니다.
  const [inviteKey, setInviteKey] = useState(0);
  return (
    <div className="flex flex-col gap-5">
      <PageTitle title="설정" description="학생 연결, 문자 알림, 계정을 관리합니다." />
      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-5">
          <InviteCodePanel reloadKey={inviteKey} onSuccess={onSuccess} onError={onError} />
          <ClassStudentsPanel
            onClassReleased={() => setInviteKey((key) => key + 1)}
            onSuccess={onSuccess}
            onError={onError}
          />
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

function InviteCodePanel({ reloadKey, onSuccess, onError }: FeedbackHandlers & { reloadKey: number }) {
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
  }, [onError, reloadKey]);

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

function classLabel(student: ClassStudent): string {
  return student.grade && student.classNumber ? `${student.grade}학년 ${student.classNumber}반` : '학년·반 미입력';
}

/** 우리 반 학생 — 한 명씩 연결 해제, 새 학기 학급 정리 */
function ClassStudentsPanel({ onClassReleased, onSuccess, onError }: FeedbackHandlers & { onClassReleased: () => void }) {
  const [students, setStudents] = useState<ClassStudent[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    getClassStudents()
      .then(setStudents)
      .catch((error) => {
        setStudents([]);
        onError(resolveErrorMessage(error, '우리 반 학생을 불러오지 못했습니다.'));
      });
  }, [onError]);

  useEffect(load, [load]);

  async function releaseOne(student: ClassStudent) {
    const name = displayName(student.studentName, student.studentUsername);
    if (
      !window.confirm(
        `${name} 학생의 연결을 풀까요?\n\n` +
          '· 이 학생의 상담·마음 날씨·사전상담 카드가 더 이상 보이지 않습니다.\n' +
          '· 이 학생이 보낸 끝나지 않은 상담(대기·확정)은 취소됩니다.\n' +
          '· 학생은 초대 코드로 다시 연결할 수 있습니다.',
      )
    )
      return;
    setBusy(student.studentUsername);
    try {
      const result = await releaseClassStudent(student.studentUsername);
      onSuccess(
        `${name} 학생의 연결을 풀었습니다.` +
          (result.cancelledCounselings > 0 ? ` 끝나지 않은 상담 ${result.cancelledCounselings}건을 취소했습니다.` : ''),
      );
      load();
    } catch (error) {
      onError(resolveErrorMessage(error, '연결을 풀지 못했습니다.'));
    } finally {
      setBusy(null);
    }
  }

  async function releaseAll() {
    if (!students || students.length === 0) return;
    if (
      !window.confirm(
        `학급 연결 ${students.length}명을 모두 풀까요? 되돌릴 수 없습니다.\n\n` +
          '· 학생들의 상담·마음 날씨·사전상담 카드가 더 이상 보이지 않습니다.\n' +
          '· 학생들이 보낸 끝나지 않은 상담(대기·확정)은 취소됩니다.\n' +
          '· 초대 코드를 새로 만들어, 지난 코드로는 다시 연결할 수 없습니다.\n' +
          '· 학생이 남긴 기록은 학생 계정에 그대로 남습니다.',
      )
    )
      return;
    setBusy('ALL');
    try {
      const result = await releaseClass();
      onSuccess(
        `학생 ${result.releasedStudents}명의 연결을 풀고 새 초대 코드(${result.newInviteCode ?? '-'})를 만들었습니다.` +
          (result.cancelledCounselings > 0 ? ` 끝나지 않은 상담 ${result.cancelledCounselings}건을 취소했습니다.` : ''),
      );
      onClassReleased();
      load();
    } catch (error) {
      onError(resolveErrorMessage(error, '학급을 정리하지 못했습니다.'));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Panel
      title={students ? `우리 반 학생 ${students.length}명` : '우리 반 학생'}
      description="초대 코드로 연결된 학생입니다."
      flush
    >
      {students === null ? (
        <div className="p-4">
          <Skeleton className="h-16 w-full" />
        </div>
      ) : students.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-gray-500">아직 연결된 학생이 없습니다. 위 초대 코드를 학생에게 알려 주세요.</p>
      ) : (
        <ul className="max-h-80 divide-y divide-gray-100 overflow-y-auto">
          {students.map((student) => (
            <li key={student.studentUsername} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {displayName(student.studentName, student.studentUsername)}
                </p>
                <p className="text-xs text-gray-500 tabular-nums">
                  {classLabel(student)} · 연결 {formatCompactDateTime(student.assignedAt)}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                icon={<UserMinus size={16} aria-hidden />}
                loading={busy === student.studentUsername}
                disabled={busy !== null}
                onClick={() => void releaseOne(student)}
              >
                연결 해제
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
              <CalendarClock size={16} className="text-gray-500" aria-hidden />새 학기 학급 정리
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-gray-600">
              학년이 끝나면 연결을 모두 풀고 새 초대 코드를 만듭니다.
            </p>
          </div>
          <Button
            size="sm"
            variant="danger"
            loading={busy === 'ALL'}
            disabled={busy !== null || !students || students.length === 0}
            onClick={() => void releaseAll()}
          >
            학급 정리
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
