import { useMemo } from 'react';
import {
  buildMoodSummary,
  buildStudentTodayTodos,
  type StudentTodayTodoContext,
} from './studentTodayTodo';
import type { StudentSchoolLifeState } from './useStudentSchoolLife';

export function useStudentTodayTodo(schoolLife: StudentSchoolLifeState) {
  const context = useMemo<StudentTodayTodoContext>(() => {
    const workspaceReady = !schoolLife.isLoading && schoolLife.workspaceLoaded;

    return {
      pageLoading: schoolLife.isLoading,
      hasAssignment: schoolLife.hasAssignment,
      meals: schoolLife.meals,
      schedule: schoolLife.schedule,
      timetable: schoolLife.timetable,
      notices: schoolLife.notices,
      moodRecorded: workspaceReady
        ? schoolLife.todayMood
          ? schoolLife.todayMood.recorded !== false && Boolean(schoolLife.todayMood.moodLevel)
          : false
        : null,
      moodSummary: schoolLife.todayMood?.moodLevel
        ? buildMoodSummary(schoolLife.todayMood.moodLevel.code)
        : '',
      preCounselCompleted: workspaceReady
        ? (schoolLife.preCounselProfile?.completed ?? false)
        : null,
      counselingPosts: workspaceReady ? schoolLife.counselingPosts : null,
      suggestions: workspaceReady ? schoolLife.suggestions : null,
      suggestionsLoaded: workspaceReady,
    };
  }, [schoolLife]);

  const items = useMemo(() => buildStudentTodayTodos(context), [context]);

  return { items };
}
