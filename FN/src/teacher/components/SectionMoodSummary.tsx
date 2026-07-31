import { useEffect, useState } from 'react';
import {
  getTeacherTodayMoodSummaries,
  getTeacherWeeklyMoodSummaries,
} from '../../api/teacher.api';
import { ApiError } from '../../api/types/api-error';
import type { StudentMoodSummary, TeacherWeeklyMoodResponse } from '../../api/types/teacher';
import { CardHelper } from '../../components/ui';
import { TEACHER_SECTIONS } from '../constants';
import {
  formatShortDate,
  formatTeacherDisplay,
  formatWeekday,
} from '../teacherUtils';
import TeacherSectionCard from './TeacherSectionCard';

type MoodView = 'today' | 'weekly';

interface SectionMoodSummaryProps {
  onError: (message: string) => void;
}

export default function SectionMoodSummary({ onError }: SectionMoodSummaryProps) {
  const [moodView, setMoodView] = useState<MoodView>('today');
  const [todaySummaries, setTodaySummaries] = useState<StudentMoodSummary[]>([]);
  const [weeklyData, setWeeklyData] = useState<TeacherWeeklyMoodResponse | null>(null);
  const [isTodayLoading, setIsTodayLoading] = useState(true);
  const [isWeeklyLoading, setIsWeeklyLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setIsTodayLoading(true);
    getTeacherTodayMoodSummaries()
      .then((data) => {
        if (!cancelled) {
          setTodaySummaries(data);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          onError(resolveErrorMessage(error, '오늘 마음 날씨를 불러오지 못했습니다.'));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsTodayLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [onError]);

  useEffect(() => {
    if (moodView !== 'weekly') {
      return;
    }

    let cancelled = false;
    setIsWeeklyLoading(true);

    getTeacherWeeklyMoodSummaries()
      .then((data) => {
        if (!cancelled) {
          setWeeklyData(data);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          onError(resolveErrorMessage(error, '주간 마음 날씨를 불러오지 못했습니다.'));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsWeeklyLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [moodView, onError]);

  const weeklyMaxCount = Math.max(...(weeklyData?.moodCounts ?? []).map((item) => item.count), 0);

  return (
    <TeacherSectionCard
      id={TEACHER_SECTIONS.MOOD_SUMMARY}
      title="3. 마음 날씨"
      helper="담당 학생들의 오늘·주간 마음 날씨를 확인합니다."
    >
      <div className="teacher-filter-row teacher-mood-tab-row" role="group" aria-label="마음 날씨 보기">
        <button
          type="button"
          className={`teacher-filter-chip${moodView === 'today' ? ' is-active' : ''}`}
          aria-pressed={moodView === 'today'}
          onClick={() => setMoodView('today')}
        >
          오늘
        </button>
        <button
          type="button"
          className={`teacher-filter-chip${moodView === 'weekly' ? ' is-active' : ''}`}
          aria-pressed={moodView === 'weekly'}
          onClick={() => setMoodView('weekly')}
        >
          주간 (7일)
        </button>
      </div>

      {moodView === 'today' ? (
        <div>
          <CardHelper>담당 학생들의 오늘 기록입니다.</CardHelper>
          {isTodayLoading ? (
            <p className="teacher-status">불러오는 중…</p>
          ) : todaySummaries.length === 0 ? (
            <p className="teacher-status">등록된 학생이 없습니다.</p>
          ) : (
            <div className="teacher-mood-summary-list">
              {todaySummaries.map((item) => (
                <div key={item.studentUsername} className="teacher-mood-summary-item">
                  <span className="teacher-mood-summary-item__name">
                    {formatTeacherDisplay(item.studentName, item.studentUsername)}
                  </span>
                  {item.moodLevel ? (
                    <span className="teacher-mood-summary-item__value">
                      {item.moodLevel.emoji} {item.moodLevel.label}
                    </span>
                  ) : (
                    <span className="teacher-mood-summary-item__value is-empty">미기록</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <CardHelper>최근 7일간 담당 학생들의 기록 요약입니다.</CardHelper>
          {isWeeklyLoading || !weeklyData ? (
            <p className="teacher-status">불러오는 중…</p>
          ) : (
            <>
              <p className="teacher-weekly-period">
                {weeklyData.startDate} ~ {weeklyData.endDate} · 총 {weeklyData.totalRecords}건 기록
              </p>

              {weeklyData.moodCounts.length > 0 ? (
                <div className="teacher-mood-distribution">
                  {weeklyData.moodCounts.map((item) => {
                    const width =
                      weeklyMaxCount > 0 ? Math.round((item.count / weeklyMaxCount) * 100) : 0;
                    return (
                      <div key={item.code} className="teacher-mood-distribution-item">
                        <span>
                          {item.emoji} {item.label}
                        </span>
                        <div className="teacher-mood-distribution-bar">
                          <div
                            className="teacher-mood-distribution-fill"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                        <span>{item.count}</span>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {weeklyData.students.length === 0 ? (
                <p className="teacher-status">등록된 학생이 없습니다.</p>
              ) : (
                <div className="teacher-weekly-student-list">
                  {weeklyData.students.map((student) => (
                    <div key={student.studentUsername} className="teacher-weekly-student-card">
                      <div className="teacher-weekly-student-card__header">
                        <strong>
                          {formatTeacherDisplay(student.studentName, student.studentUsername)}
                        </strong>
                        <span className="teacher-weekly-student-card__meta">
                          {student.recordCount}일 기록
                        </span>
                      </div>
                      <div className="teacher-weekly-day-scroll">
                        <div className="teacher-weekly-day-row">
                          {student.dailyRecords.map((day) => (
                            <div key={day.date} className="teacher-weekly-day-cell">
                              <span className="teacher-weekly-day-cell__label">
                                {formatShortDate(day.date)} ({formatWeekday(day.date)})
                              </span>
                              {day.moodLevel ? (
                                <span
                                  className="teacher-weekly-day-cell__emoji"
                                  title={day.moodLevel.label}
                                >
                                  {day.moodLevel.emoji}
                                </span>
                              ) : (
                                <span className="teacher-weekly-day-cell__empty">-</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
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
