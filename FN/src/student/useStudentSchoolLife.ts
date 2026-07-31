import { useCallback, useEffect, useState } from 'react';
import { getMyCounselingPosts } from '../api/counseling.api';
import type { CounselingPost } from '../api/types/counseling';
import type { ProfileSchoolResponse } from '../api/types/home';
import type {
  MealDayResponse,
  SchoolScheduleUpcomingResponse,
  TimetableDayResponse,
  WeatherTodayResponse,
} from '../api/types/home';
import type {
  MoodTodayResponse,
  PreCounselingProfile,
  StudentAssignment,
  StudentNotice,
} from '../api/types/student';
import type { SuggestionPost } from '../api/types/suggestion';
import { ApiError } from '../api/types/api-error';
import { getMySuggestions } from '../api/suggestion.api';
import {
  getStudentAssignmentOptional,
  getStudentNotices,
  getStudentPreCounselingProfile,
  getStudentProfileSchool,
  getStudentTodayMeals,
  getStudentTodayMood,
  getStudentTodayTimetable,
  getStudentTodayWeather,
  getStudentUpcomingSchoolSchedule,
} from '../api/student.api';

export interface StudentSchoolLifeState {
  isLoading: boolean;
  pageError: string | null;
  schoolProfile: ProfileSchoolResponse | null;
  assignment: StudentAssignment | null;
  hasAssignment: boolean;
  meals: MealDayResponse | null;
  mealsError: string | null;
  weather: WeatherTodayResponse | null;
  weatherError: string | null;
  schedule: SchoolScheduleUpcomingResponse | null;
  scheduleError: string | null;
  timetable: TimetableDayResponse | null;
  timetableError: string | null;
  notices: StudentNotice[] | null;
  noticesError: string | null;
  todayMood: MoodTodayResponse | null;
  preCounselProfile: PreCounselingProfile | null;
  counselingPosts: CounselingPost[] | null;
  suggestions: SuggestionPost[] | null;
  workspaceLoaded: boolean;
}

const initialState: StudentSchoolLifeState = {
  isLoading: true,
  pageError: null,
  schoolProfile: null,
  assignment: null,
  hasAssignment: false,
  meals: null,
  mealsError: null,
  weather: null,
  weatherError: null,
  schedule: null,
  scheduleError: null,
  timetable: null,
  timetableError: null,
  notices: null,
  noticesError: null,
  todayMood: null,
  preCounselProfile: null,
  counselingPosts: null,
  suggestions: null,
  workspaceLoaded: false,
};

function resolveErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
}

async function loadNoticesSafe(): Promise<{ notices: StudentNotice[] } | { error: string }> {
  try {
    const notices = await getStudentNotices();
    return { notices };
  } catch (error) {
    return { error: resolveErrorMessage(error, '알림을 불러올 수 없습니다.') };
  }
}

async function loadTimetableSafe(): Promise<
  { timetable: TimetableDayResponse } | { error: string }
> {
  try {
    const timetable = await getStudentTodayTimetable();
    return { timetable };
  } catch (error) {
    return { error: resolveErrorMessage(error, '시간표를 불러올 수 없습니다.') };
  }
}

async function loadWorkspaceData() {
  const [todayMood, preCounselProfile, counselingPosts, suggestions] = await Promise.all([
    getStudentTodayMood().catch(() => null),
    getStudentPreCounselingProfile().catch(() => null),
    getMyCounselingPosts().catch(() => null),
    getMySuggestions().catch(() => null),
  ]);

  return { todayMood, preCounselProfile, counselingPosts, suggestions };
}

export function useStudentSchoolLife(enabled: boolean) {
  const [state, setState] = useState<StudentSchoolLifeState>(initialState);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setReloadToken((value) => value + 1);
  }, []);

  const reloadTimetable = useCallback(async () => {
    const result = await loadTimetableSafe();
    setState((prev) => {
      if ('error' in result) {
        return { ...prev, timetable: null, timetableError: result.error };
      }
      return { ...prev, timetable: result.timetable, timetableError: null };
    });
  }, []);

  const reloadWorkspace = useCallback(async () => {
    const workspace = await loadWorkspaceData();
    setState((prev) => ({
      ...prev,
      todayMood: workspace.todayMood,
      preCounselProfile: workspace.preCounselProfile,
      counselingPosts: workspace.counselingPosts,
      suggestions: workspace.suggestions,
      workspaceLoaded: true,
    }));
  }, []);

  const applyAssignment = useCallback(async (assignment: StudentAssignment | null) => {
    if (!assignment) {
      setState((prev) => ({
        ...prev,
        assignment: null,
        hasAssignment: false,
        notices: null,
        noticesError: null,
      }));
      return;
    }

    const noticesResult = await loadNoticesSafe();
    setState((prev) => ({
      ...prev,
      assignment,
      hasAssignment: true,
      notices: 'notices' in noticesResult ? noticesResult.notices : [],
      noticesError: 'error' in noticesResult ? noticesResult.error : null,
    }));
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    async function loadData() {
      setState({ ...initialState, isLoading: true });

      try {
        const [
          schoolProfile,
          assignment,
          mealsResult,
          weatherResult,
          scheduleResult,
          timetableResult,
          workspace,
        ] = await Promise.all([
          getStudentProfileSchool(),
          getStudentAssignmentOptional(),
          getStudentTodayMeals().catch((error) => ({
            error: resolveErrorMessage(error, '급식 정보를 불러올 수 없습니다.'),
          })),
          getStudentTodayWeather().catch((error) => ({
            error: resolveErrorMessage(error, '날씨 정보를 불러올 수 없습니다.'),
          })),
          getStudentUpcomingSchoolSchedule(14).catch((error) => ({
            error: resolveErrorMessage(error, '학사일정을 불러올 수 없습니다.'),
          })),
          loadTimetableSafe(),
          loadWorkspaceData(),
        ]);

        const hasAssignment = assignment !== null;
        const noticesResult = hasAssignment ? await loadNoticesSafe() : null;

        if (cancelled) {
          return;
        }

        const nextState: StudentSchoolLifeState = {
          isLoading: false,
          pageError: null,
          schoolProfile,
          assignment,
          hasAssignment,
          meals: null,
          mealsError: null,
          weather: null,
          weatherError: null,
          schedule: null,
          scheduleError: null,
          timetable: null,
          timetableError: null,
          notices: hasAssignment ? [] : null,
          noticesError: null,
          todayMood: workspace.todayMood,
          preCounselProfile: workspace.preCounselProfile,
          counselingPosts: workspace.counselingPosts,
          suggestions: workspace.suggestions,
          workspaceLoaded: true,
        };

        if ('error' in mealsResult) {
          nextState.mealsError = mealsResult.error;
        } else {
          nextState.meals = mealsResult;
        }

        if ('error' in weatherResult) {
          nextState.weatherError = weatherResult.error;
        } else {
          nextState.weather = weatherResult;
        }

        if ('error' in scheduleResult) {
          nextState.scheduleError = scheduleResult.error;
        } else {
          nextState.schedule = scheduleResult;
        }

        if ('error' in timetableResult) {
          nextState.timetableError = timetableResult.error;
        } else {
          nextState.timetable = timetableResult.timetable;
        }

        if (noticesResult) {
          if ('error' in noticesResult) {
            nextState.noticesError = noticesResult.error;
          } else {
            nextState.notices = noticesResult.notices;
          }
        }

        setState(nextState);
      } catch (error) {
        if (!cancelled) {
          setState({
            ...initialState,
            isLoading: false,
            pageError: resolveErrorMessage(error, '학생 홈 정보를 불러오지 못했습니다.'),
          });
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [enabled, reloadToken]);

  return {
    ...state,
    reload,
    reloadTimetable,
    reloadWorkspace,
    applyAssignment,
  };
}
