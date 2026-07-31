import { useEffect, useState } from 'react';
import {
  getTeacherNotificationSettings,
  updateTeacherNotificationSettings,
} from '../../api/teacher.api';
import { ApiError } from '../../api/types/api-error';
import { Btn, CardHelper, Field, Input } from '../../components/ui';
import { TEACHER_SECTIONS } from '../constants';
import TeacherSectionCard from './TeacherSectionCard';

interface SectionNotificationSettingsProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function SectionNotificationSettings({
  onSuccess,
  onError,
}: SectionNotificationSettingsProps) {
  const [phone, setPhone] = useState('');
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [statusText, setStatusText] = useState('설정을 불러오는 중…');
  const [statusReady, setStatusReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getTeacherNotificationSettings()
      .then((data) => {
        if (!cancelled) {
          applySettings(data.phone ?? '', data.smsNotifyEnabled, data.ready, data.message);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setIsLoading(false);
          onError(resolveErrorMessage(error, '알림 설정을 불러오지 못했습니다.'));
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function applySettings(
    nextPhone: string,
    nextSmsEnabled: boolean,
    ready: boolean,
    message?: string | null,
  ) {
    setPhone(nextPhone);
    setSmsEnabled(nextSmsEnabled);
    setStatusReady(ready);
    setStatusText(
      message ||
        (ready
          ? 'SMS 알림이 설정되었습니다. 학생 상담 신청 시 문자를 받습니다.'
          : 'SMS 알림을 받으려면 휴대전화 번호와 수신 동의를 설정해 주세요.'),
    );
  }

  async function handleSave() {
    setIsSaving(true);

    try {
      const data = await updateTeacherNotificationSettings({
        phone: phone.trim(),
        smsNotifyEnabled: smsEnabled,
      });
      applySettings(data.phone ?? phone.trim(), data.smsNotifyEnabled, data.ready, data.message);
      onSuccess(data.message || '상담 알림 설정이 저장되었습니다.');
    } catch (error) {
      onError(resolveErrorMessage(error, '알림 설정을 저장하지 못했습니다.'));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <TeacherSectionCard
      id={TEACHER_SECTIONS.NOTIFICATION_SETTINGS}
      title="상담 SMS 알림"
      helper="학생이 상담을 신청하면 휴대전화로 알림을 받을 수 있습니다. 상담 내용은 문자에 포함되지 않습니다."
    >
      <p
        className={`teacher-notification-status${statusReady ? ' is-ready' : ' is-pending'}`}
      >
        {statusText}
      </p>

      <Field id="notificationPhone" label="휴대전화 번호">
        <Input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="01012345678"
          disabled={isLoading || isSaving}
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
      </Field>

      <label className="teacher-checkbox-row" htmlFor="notificationSmsEnabled">
        <input
          id="notificationSmsEnabled"
          type="checkbox"
          disabled={isLoading || isSaving}
          checked={smsEnabled}
          onChange={(event) => setSmsEnabled(event.target.checked)}
        />
        <span>상담 신청 SMS 수신에 동의합니다.</span>
      </label>

      <CardHelper>번호와 수신 동의를 모두 설정해야 SMS 알림이 발송됩니다.</CardHelper>

      <div className="teacher-form-actions">
        <Btn
          type="button"
          variant="primary"
          size="student"
          disabled={isLoading || isSaving}
          onClick={handleSave}
        >
          {isSaving ? '저장 중…' : '저장'}
        </Btn>
      </div>
    </TeacherSectionCard>
  );
}

function resolveErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
}
