import { useEffect, useState } from 'react';
import { ApiError } from '../../api/types/api-error';
import type { StudentAssignment } from '../../api/types/student';
import {
  getStudentAssignmentOptional,
  registerStudentAssignment,
} from '../../api/student.api';
import { STUDENT_SECTIONS } from '../constants';
import { formatDateTime, formatTeacherDisplay } from '../studentUtils';
import StudentSectionCard from './StudentSectionCard';

interface SectionAssignmentProps {
  assignment: StudentAssignment | null;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onAssignmentChanged: (assignment: StudentAssignment) => Promise<void>;
}

export default function SectionAssignment({
  assignment,
  onSuccess,
  onError,
  onAssignmentChanged,
}: SectionAssignmentProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(!assignment);

  const summaryHint = assignment
    ? `${assignment.schoolName || '-'} · ${formatTeacherDisplay(assignment)} 선생님`
    : '초대 코드로 등록해 주세요';

  useEffect(() => {
    if (assignment) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  }, [assignment]);

  async function handleRegister() {
    const normalizedCode = inviteCode.trim();
    if (!/^\d{6}$/.test(normalizedCode)) {
      onError('초대 코드는 6자리 숫자여야 합니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await registerStudentAssignment({ inviteCode: normalizedCode });
      setInviteCode('');
      setIsOpen(false);
      await onAssignmentChanged(data);
      onSuccess(`${formatTeacherDisplay(data)} 선생님이 담당 교사로 등록되었습니다.`);
    } catch (error) {
      if (error instanceof ApiError && error.message.includes('이미 담당 교사')) {
        const existing = await getStudentAssignmentOptional();
        if (existing) {
          await onAssignmentChanged(existing);
          onSuccess('이미 담당 교사가 등록되어 있습니다.');
          setIsSubmitting(false);
          return;
        }
      }
      onError(resolveErrorMessage(error, '담당 교사를 등록하지 못했습니다.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <StudentSectionCard
      id={STUDENT_SECTIONS.ASSIGNMENT}
      title="담당 교사"
      helper="교사가 알려준 초대 코드로 등록합니다."
      compact
    >
      <details
        className="student-assignment-details"
        open={isOpen}
        onToggle={(event) => setIsOpen((event.currentTarget as HTMLDetailsElement).open)}
      >
        <summary className="student-assignment-summary">
          <span className="student-assignment-summary__title">담당 교사</span>
          <span className="student-assignment-summary__hint">{summaryHint}</span>
        </summary>

        {assignment ? (
          <div className="student-assignment-info">
            <span className="student-assignment-info__badge">담당 교사 등록 완료</span>
            <p className="student-assignment-info__summary">{summaryHint}</p>
            <p>
              <strong>학교:</strong> {assignment.schoolName || '-'}
            </p>
            <p>
              <strong>담당 교사:</strong> {formatTeacherDisplay(assignment)}
            </p>
            <p className="student-card__helper">등록일: {formatDateTime(assignment.assignedAt)}</p>
          </div>
        ) : (
          <div className="student-assignment-register">
            <p className="student-card__helper">교사가 알려준 6자리 초대 코드를 입력해 주세요.</p>
            <div className="student-field">
              <label className="student-field__label" htmlFor="inviteCode">
                초대 코드
              </label>
              <input
                id="inviteCode"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="student-form-actions">
              <button
                type="button"
                className="student-btn student-btn--primary"
                disabled={isSubmitting}
                onClick={handleRegister}
              >
                {isSubmitting ? '등록 중…' : '담당 교사 등록'}
              </button>
            </div>
          </div>
        )}
      </details>
    </StudentSectionCard>
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
