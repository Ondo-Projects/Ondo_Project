import { useCallback, useEffect, useState } from 'react';
import type { ProfileSchoolResponse } from '../api/types/home';
import type {
  MealDayResponse,
  SchoolScheduleUpcomingResponse,
  TimetableDayResponse,
  WeatherTodayResponse,
} from '../api/types/home';
import type { StudentAssignment, StudentNotice } from '../api/types/student';
import { ApiError } from '../api/types/api-error';
import {
  getStudentAssignmentOptional,
  getStudentNotices,
  getStudentProfileSchool,
  getStudentTodayMeals,
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
        const [schoolProfile, assignment] = await Promise.all([
          getStudentProfileSchool(),
          getStudentAssignmentOptional(),
        ]);

        const hasAssignment = assignment !== null;

        const [mealsResult, weatherResult, scheduleResult, timetableResult, noticesResult] =
          await Promise.all([
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
            hasAssignment ? loadNoticesSafe() : Promise.resolve(null),
          ]);

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
    applyAssignment,
  };
}
