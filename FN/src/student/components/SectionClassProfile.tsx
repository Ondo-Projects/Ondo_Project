import { type FormEvent, useEffect, useState } from 'react';
import { ApiError } from '../../api/types/api-error';
import type { StudentClassProfile } from '../../api/types/student';
import {
  getStudentClassProfile,
  updateStudentClassProfile,
} from '../../api/student.api';
import { STUDENT_SECTIONS } from '../constants';
import StudentSectionCard from './StudentSectionCard';

interface SectionClassProfileProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onProfileChanged: () => Promise<void>;
}

export default function SectionClassProfile({
  onSuccess,
  onError,
  onProfileChanged,
}: SectionClassProfileProps) {
  const [profile, setProfile] = useState<StudentClassProfile | null>(null);
  const [grade, setGrade] = useState('');
  const [classNumber, setClassNumber] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getStudentClassProfile()
      .then((data) => {
        if (!cancelled) {
          applyProfile(data);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setIsLoading(false);
          onError(resolveErrorMessage(error, '학년·반 정보를 불러오지 못했습니다.'));
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function applyProfile(data: StudentClassProfile) {
    setProfile(data);
    setGrade(data.grade != null ? String(data.grade) : '');
    setClassNumber(data.classNumber != null ? String(data.classNumber) : '');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const data = await updateStudentClassProfile({
        grade: grade.trim() ? Number(grade) : null,
        classNumber: classNumber.trim() ? Number(classNumber) : null,
      });
      applyProfile(data);
      onSuccess(data.message || '학년·반이 저장되었습니다.');
      await onProfileChanged();
    } catch (error) {
      onError(resolveErrorMessage(error, '학년·반을 저장하지 못했습니다.'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleClear() {
    setIsSaving(true);

    try {
      const data = await updateStudentClassProfile({
        grade: null,
        classNumber: null,
      });
      applyProfile(data);
      onSuccess(data.message || '학년·반 정보가 초기화되었습니다.');
      await onProfileChanged();
    } catch (error) {
      onError(resolveErrorMessage(error, '학년·반을 초기화하지 못했습니다.'));
    } finally {
      setIsSaving(false);
    }
  }

  const statusText = profile?.completed
    ? `${profile.grade}학년 · ${profile.classNumber}반`
    : '아직 입력하지 않았습니다. 시간표 기능을 위해 학년·반을 입력해 주세요.';

  return (
    <StudentSectionCard
      id={STUDENT_SECTIONS.CLASS_PROFILE}
      title="학년 · 반"
      helper="시간표 등 학교생활 기능에 사용됩니다."
      compact
    >
      {isLoading ? (
        <p className="student-status">불러오는 중…</p>
      ) : (
        <>
          <p className="student-profile-status">{statusText}</p>
          <form className="student-form" onSubmit={handleSubmit}>
            <div className="student-form-grid">
              <div className="student-field">
                <label className="student-field__label" htmlFor="classProfileGrade">
                  학년
                </label>
                <input
                  id="classProfileGrade"
                  type="number"
                  min={1}
                  max={6}
                  placeholder="예: 2"
                  value={grade}
                  onChange={(event) => setGrade(event.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div className="student-field">
                <label className="student-field__label" htmlFor="classProfileClassNumber">
                  반
                </label>
                <input
                  id="classProfileClassNumber"
                  type="number"
                  min={1}
                  max={20}
                  placeholder="예: 3"
                  value={classNumber}
                  onChange={(event) => setClassNumber(event.target.value)}
                  disabled={isSaving}
                />
              </div>
            </div>
            <div className="student-form-actions">
              <button type="submit" className="student-btn student-btn--primary" disabled={isSaving}>
                {isSaving ? '저장 중…' : '저장'}
              </button>
              <button
                type="button"
                className="student-btn student-btn--secondary"
                disabled={isSaving}
                onClick={handleClear}
              >
                초기화
              </button>
            </div>
          </form>
        </>
      )}
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
