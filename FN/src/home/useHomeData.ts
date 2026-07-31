import { useEffect, useState } from 'react';
import { getCommonHomeAggregate } from '../api/home.api';
import type { AuthUser } from '../api/types/auth';
import type {
  MealDayResponse,
  ProfileSchoolResponse,
  SchoolScheduleUpcomingResponse,
  TimetableDayResponse,
  WeatherTodayResponse,
} from '../api/types/home';
import { ApiError } from '../api/types/api-error';

export interface TeacherSummaryState {
  unreadCount: number | null;
  waitingCount: number | null;
  preCounselPendingCount: number | null;
  error: string | null;
}

export interface HomeDataState {
  pageError: string | null;
  schoolProfile: ProfileSchoolResponse | null;
  schoolProfileError: string | null;
  weather: WeatherTodayResponse | null;
  weatherError: string | null;
  schedule: SchoolScheduleUpcomingResponse | null;
  scheduleError: string | null;
  meals: MealDayResponse | null;
  mealsError: string | null;
  timetable: TimetableDayResponse | null;
  timetableError: string | null;
  teacherSummary: TeacherSummaryState;
  isLoading: boolean;
}

const initialTeacherSummary: TeacherSummaryState = {
  unreadCount: null,
  waitingCount: null,
  preCounselPendingCount: null,
  error: null,
};

const initialState: HomeDataState = {
  pageError: null,
  schoolProfile: null,
  schoolProfileError: null,
  weather: null,
  weatherError: null,
  schedule: null,
  scheduleError: null,
  meals: null,
  mealsError: null,
  timetable: null,
  timetableError: null,
  teacherSummary: initialTeacherSummary,
  isLoading: true,
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

export function useHomeData(user: AuthUser | null): HomeDataState {
  const [state, setState] = useState<HomeDataState>(initialState);

  useEffect(() => {
    if (!user) {
      return;
    }

    if (user.role !== 'STUDENT' && user.role !== 'TEACHER') {
      return;
    }

    const currentUser = user;
    let cancelled = false;

    async function loadPage() {
      setState({ ...initialState, isLoading: true });

      try {
        const data = await getCommonHomeAggregate(14);

        if (cancelled) {
          return;
        }

        const nextState: HomeDataState = {
          pageError: data.schoolProfileError ?? null,
          schoolProfile: data.schoolProfile ?? null,
          schoolProfileError: data.schoolProfileError ?? null,
          weather: data.weather ?? null,
          weatherError: data.weatherError ?? null,
          schedule: data.schedule ?? null,
          scheduleError: data.scheduleError ?? null,
          meals: data.meals ?? null,
          mealsError: data.mealsError ?? null,
          timetable: data.timetable ?? null,
          timetableError: data.timetableError ?? null,
          teacherSummary: initialTeacherSummary,
          isLoading: false,
        };

        if (currentUser.role === 'TEACHER') {
          nextState.teacherSummary = {
            unreadCount: data.teacherUnreadCount ?? 0,
            waitingCount: data.teacherWaitingCount ?? 0,
            preCounselPendingCount: data.teacherPreCounselPendingCount ?? 0,
            error: data.teacherSummaryError ?? null,
          };
        }

        setState(nextState);
      } catch (error) {
        if (!cancelled) {
          setState({
            ...initialState,
            pageError: resolveErrorMessage(error, '페이지 정보를 불러오지 못했습니다.'),
            isLoading: false,
          });
        }
      }
    }

    loadPage();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return state;
}
