import { useCallback, useEffect, useState } from 'react';
import type { StudentHomeAggregateResponse } from '../api/types/home';
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
import {
  getStudentHomeAggregate,
  getStudentNotices,
  getStudentTodayTimetable,
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

async function loadNoticesSafe(): Promise<{ notices: StudentNotice[] } | { error: string }> {
  try {
    const notices = await getStudentNotices();
    return { notices };
  } catch (error) {
    return { error: resolveErrorMessage(error, '알림을 불러올 수 없습니다.') };
  }
}

function normalizeTodayMood(value: StudentHomeAggregateResponse['todayMood']): MoodTodayResponse | null {
  if (!value) {
    return null;
  }
  if ('recorded' in value && value.recorded === false) {
    return { recorded: false };
  }
  return value;
}

function mapStudentHomeAggregate(data: StudentHomeAggregateResponse): StudentSchoolLifeState {
  const assignment = data.assignment ?? null;
  const hasAssignment = assignment !== null;

  return {
    isLoading: false,
    pageError: data.schoolProfileError ?? null,
    schoolProfile: data.schoolProfile ?? null,
    assignment,
    hasAssignment,
    meals: data.meals ?? null,
    mealsError: data.mealsError ?? null,
    weather: data.weather ?? null,
    weatherError: data.weatherError ?? null,
    schedule: data.schedule ?? null,
    scheduleError: data.scheduleError ?? null,
    timetable: data.timetable ?? null,
    timetableError: data.timetableError ?? null,
    notices: hasAssignment ? (data.notices ?? []) : null,
    noticesError: data.noticesError ?? null,
    todayMood: normalizeTodayMood(data.todayMood),
    preCounselProfile: data.preCounselProfile ?? null,
    counselingPosts: data.counselingPosts ?? null,
    suggestions: data.suggestions ?? null,
    workspaceLoaded: true,
  };
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
    try {
      const data = await getStudentHomeAggregate();
      setState((prev) => {
        const mapped = mapStudentHomeAggregate(data);
        return {
          ...prev,
          todayMood: mapped.todayMood,
          preCounselProfile: mapped.preCounselProfile,
          counselingPosts: mapped.counselingPosts,
          suggestions: mapped.suggestions,
          notices: mapped.notices,
          noticesError: mapped.noticesError,
          workspaceLoaded: true,
        };
      });
    } catch {
      // keep previous workspace data on refresh failure
    }
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
        const data = await getStudentHomeAggregate();
        if (cancelled) {
          return;
        }
        setState(mapStudentHomeAggregate(data));
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
