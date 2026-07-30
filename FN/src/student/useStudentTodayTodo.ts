import { useEffect, useMemo, useState } from 'react';
import { getMyCounselingPosts } from '../api/counseling.api';
import type { CounselingPost } from '../api/types/counseling';
import type { SuggestionPost } from '../api/types/suggestion';
import { getMySuggestions } from '../api/suggestion.api';
import { getStudentPreCounselingProfile, getStudentTodayMood } from '../api/student.api';
import type { StudentSchoolLifeState } from './useStudentSchoolLife';
import {
  buildMoodSummary,
  buildStudentTodayTodos,
  type StudentTodayTodoContext,
} from './studentTodayTodo';

interface StudentTodayTodoExtras {
  moodRecorded: boolean | null;
  moodSummary: string;
  preCounselCompleted: boolean | null;
  counselingPosts: CounselingPost[] | null;
  suggestions: SuggestionPost[] | null;
  suggestionsLoaded: boolean;
}

const initialExtras: StudentTodayTodoExtras = {
  moodRecorded: null,
  moodSummary: '',
  preCounselCompleted: null,
  counselingPosts: null,
  suggestions: null,
  suggestionsLoaded: false,
};

export function useStudentTodayTodo(
  schoolLife: StudentSchoolLifeState,
  enabled: boolean,
  refreshToken: number,
) {
  const [extras, setExtras] = useState<StudentTodayTodoExtras>(initialExtras);

  useEffect(() => {
    if (!enabled || schoolLife.isLoading) {
      return;
    }

    let cancelled = false;

    async function loadExtras() {
      const [moodResult, preCounselResult, counselResult, suggestionResult] = await Promise.all([
        getStudentTodayMood().catch(() => null),
        getStudentPreCounselingProfile().catch(() => null),
        getMyCounselingPosts().catch(() => null),
        getMySuggestions().catch(() => null),
      ]);

      if (cancelled) {
        return;
      }

      setExtras({
        moodRecorded: moodResult ? moodResult.recorded !== false && Boolean(moodResult.moodLevel) : false,
        moodSummary: moodResult?.moodLevel
          ? buildMoodSummary(moodResult.moodLevel.code)
          : '',
        preCounselCompleted: preCounselResult?.completed ?? false,
        counselingPosts: counselResult,
        suggestions: suggestionResult,
        suggestionsLoaded: true,
      });
    }

    loadExtras();

    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    schoolLife.isLoading,
    schoolLife.hasAssignment,
    schoolLife.notices,
    refreshToken,
  ]);

  const context = useMemo<StudentTodayTodoContext>(
    () => ({
      pageLoading: schoolLife.isLoading,
      hasAssignment: schoolLife.hasAssignment,
      meals: schoolLife.meals,
      schedule: schoolLife.schedule,
      timetable: schoolLife.timetable,
      notices: schoolLife.notices,
      moodRecorded: extras.moodRecorded,
      moodSummary: extras.moodSummary,
      preCounselCompleted: extras.preCounselCompleted,
      counselingPosts: extras.counselingPosts,
      suggestions: extras.suggestions,
      suggestionsLoaded: extras.suggestionsLoaded,
    }),
    [schoolLife, extras],
  );

  const items = useMemo(() => buildStudentTodayTodos(context), [context]);

  return { items };
}
