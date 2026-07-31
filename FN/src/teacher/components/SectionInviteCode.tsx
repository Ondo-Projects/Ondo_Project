import { useEffect, useState } from 'react';
import {
  getTeacherInviteCode,
  regenerateTeacherInviteCode,
} from '../../api/teacher.api';
import { ApiError } from '../../api/types/api-error';
import { Btn, CardHelper } from '../../components/ui';
import { TEACHER_SECTIONS } from '../constants';
import { formatDateTime } from '../teacherUtils';
import TeacherSectionCard from './TeacherSectionCard';

interface SectionInviteCodeProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function SectionInviteCode({ onSuccess, onError }: SectionInviteCodeProps) {
  const [code, setCode] = useState('------');
  const [createdAt, setCreatedAt] = useState('-');
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    loadInviteCode().catch((error) => {
      onError(resolveErrorMessage(error, '초대 코드를 불러오지 못했습니다.'));
    });
  }, []);

  async function loadInviteCode() {
    setIsLoading(true);
    try {
      const data = await getTeacherInviteCode();
      setCode(data.code);
      setCreatedAt(formatDateTime(data.createdAt));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      onSuccess('초대 코드가 복사되었습니다.');
    } catch {
      onError('복사에 실패했습니다. 코드를 직접 복사해 주세요.');
    }
  }

  async function handleRegenerate() {
    if (!window.confirm('초대 코드를 재발급할까요? 기존 코드는 사용할 수 없습니다.')) {
      return;
    }

    setIsRegenerating(true);

    try {
      const data = await regenerateTeacherInviteCode();
      setCode(data.code);
      setCreatedAt(formatDateTime(data.createdAt));
      onSuccess('초대 코드가 재발급되었습니다.');
    } catch (error) {
      onError(resolveErrorMessage(error, '초대 코드를 재발급하지 못했습니다.'));
    } finally {
      setIsRegenerating(false);
    }
  }

  return (
    <TeacherSectionCard
      id={TEACHER_SECTIONS.INVITE_CODE}
      title="1. 학생 초대 코드"
      helper="학생에게 아래 코드를 알려주세요."
      compact
    >
      <div className="teacher-invite-box">
        <div>
          <div className="teacher-invite-code" id="inviteCode">
            {isLoading ? '불러오는 중…' : code}
          </div>
          <CardHelper>발급: {createdAt}</CardHelper>
        </div>

        <div className="teacher-form-actions">
          <Btn
            type="button"
            variant="secondary"
            size="student"
            disabled={isLoading || isRegenerating}
            onClick={handleCopy}
          >
            복사
          </Btn>
          <Btn
            type="button"
            variant="primary"
            size="student"
            disabled={isLoading || isRegenerating}
            onClick={handleRegenerate}
          >
            {isRegenerating ? '재발급 중…' : '재발급'}
          </Btn>
        </div>
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
