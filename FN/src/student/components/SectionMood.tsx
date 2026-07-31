import { useEffect, useState } from 'react';
import { ApiError } from '../../api/types/api-error';
import type { MoodLevel, MoodLevelCode, MoodTodayResponse } from '../../api/types/student';
import { saveStudentTodayMood } from '../../api/student.api';
import { CardHelper } from '../../components/ui';
import { MOOD_OPTIONS, STUDENT_SECTIONS } from '../constants';
import StudentSectionCard from './StudentSectionCard';

interface SectionMoodProps {
  prefetchedMood: MoodTodayResponse | null;
  moodLoaded: boolean;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function SectionMood({
  prefetchedMood,
  moodLoaded,
  onSuccess,
  onError,
}: SectionMoodProps) {
  const [selectedMood, setSelectedMood] = useState<MoodLevelCode | null>(null);
  const [statusText, setStatusText] = useState('불러오는 중…');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!moodLoaded) {
      setIsLoading(true);
      setStatusText('불러오는 중…');
      return;
    }

    if (prefetchedMood?.recorded === false || !prefetchedMood?.moodLevel) {
      setSelectedMood(null);
      setStatusText('아직 오늘 기록이 없습니다.');
    } else {
      setSelectedMood(prefetchedMood.moodLevel.code);
      setStatusText(buildMoodStatusText(prefetchedMood.moodLevel));
    }
    setIsLoading(false);
  }, [moodLoaded, prefetchedMood]);

  async function handleSelect(code: MoodLevelCode) {
    if (isSaving || isLoading) {
      return;
    }

    setIsSaving(true);
    setSelectedMood(code);

    try {
      const data = await saveStudentTodayMood(code);
      setStatusText(buildMoodStatusText(data.moodLevel));
      onSuccess('오늘의 마음 날씨가 저장되었습니다.');
    } catch (error) {
      onError(resolveErrorMessage(error, '마음 날씨를 저장하지 못했습니다.'));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <StudentSectionCard
      id={STUDENT_SECTIONS.MOOD}
      title="마음 날씨"
      helper="하루에 한 번, 지금 마음 상태를 기록해 주세요. 담당 교사만 볼 수 있습니다."
    >
      <div className="student-mood-picker" role="group" aria-label="오늘의 마음 날씨">
        {MOOD_OPTIONS.map((option) => (
          <button
            key={option.code}
            type="button"
            className={`student-mood-option${selectedMood === option.code ? ' is-active' : ''}`}
            disabled={isLoading || isSaving}
            aria-pressed={selectedMood === option.code}
            onClick={() => handleSelect(option.code)}
          >
            <span className="student-mood-option__emoji" aria-hidden="true">
              {option.emoji}
            </span>
            {option.label}
          </button>
        ))}
      </div>
      <CardHelper>{statusText}</CardHelper>
    </StudentSectionCard>
  );
}

function buildMoodStatusText(moodLevel: MoodLevel): string {
  return `오늘 기록: ${moodLevel.emoji} ${moodLevel.label}`;
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
