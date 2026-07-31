import { useEffect, useState } from 'react';
import {
  getProfileSchool,
  getTeacherCounselingPosts,
  getTeacherPreCounselingProfiles,
  getTeacherUnreadCount,
  getTodayMeals,
  getTodayTimetable,
  getTodayWeather,
  getUpcomingSchoolSchedule,
} from '../api/home.api';
import type { AuthUser } from '../api/types/auth';
import type {
  MealDayResponse,
  PreCounselingProfileSummary,
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

    const currentUser = user;
    let cancelled = false;

    async function loadPage() {
      setState({ ...initialState, isLoading: true });

      try {
        const schoolProfilePromise = getProfileSchool(currentUser.role).catch((error) => ({
          error: resolveErrorMessage(error, '학교 정보를 불러오지 못했습니다.'),
        }));

        const weatherPromise = getTodayWeather().catch((error) => ({
          error: resolveErrorMessage(error, '날씨 정보를 불러올 수 없습니다.'),
        }));

        const schedulePromise = getUpcomingSchoolSchedule(14).catch((error) => ({
          error: resolveErrorMessage(error, '학사일정을 불러올 수 없습니다.'),
        }));

        const studentMealsPromise =
          currentUser.role === 'STUDENT'
            ? getTodayMeals().catch((error) => ({
                error: resolveErrorMessage(error, '급식 정보를 불러올 수 없습니다.'),
              }))
            : Promise.resolve(null);

        const studentTimetablePromise =
          currentUser.role === 'STUDENT'
            ? getTodayTimetable().catch((error) => ({
                error: resolveErrorMessage(error, '시간표를 불러올 수 없습니다.'),
              }))
            : Promise.resolve(null);

        const teacherSummaryPromise =
          currentUser.role === 'TEACHER'
            ? Promise.all([
                getTeacherUnreadCount(),
                getTeacherCounselingPosts(),
                getTeacherPreCounselingProfiles(),
              ]).catch((error) => ({
                error: resolveErrorMessage(error, '교사 요약 정보를 불러올 수 없습니다.'),
              }))
            : Promise.resolve(null);

        const [schoolProfileResult, weatherResult, scheduleResult, mealsResult, timetableResult, teacherResult] =
          await Promise.all([
            schoolProfilePromise,
            weatherPromise,
            schedulePromise,
            studentMealsPromise,
            studentTimetablePromise,
            teacherSummaryPromise,
          ]);

        if (cancelled) {
          return;
        }

        let schoolProfile: ProfileSchoolResponse | null = null;
        let schoolProfileError: string | null = null;
        const profileResult = schoolProfileResult as ProfileSchoolResponse | { error: string };
        if ('error' in profileResult) {
          schoolProfileError = profileResult.error;
        } else {
          schoolProfile = profileResult;
        }

        const nextState: HomeDataState = {
          pageError: null,
          schoolProfile,
          schoolProfileError,
          weather: null,
          weatherError: null,
          schedule: null,
          scheduleError: null,
          meals: null,
          mealsError: null,
          timetable: null,
          timetableError: null,
          teacherSummary: initialTeacherSummary,
          isLoading: false,
        };

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

        if (mealsResult) {
          if ('error' in mealsResult) {
            nextState.mealsError = mealsResult.error;
          } else {
            nextState.meals = mealsResult;
          }
        }

        if (timetableResult) {
          if ('error' in timetableResult) {
            nextState.timetableError = timetableResult.error;
          } else {
            nextState.timetable = timetableResult;
          }
        }

        if (teacherResult) {
          if ('error' in teacherResult) {
            nextState.teacherSummary = {
              ...initialTeacherSummary,
              error: teacherResult.error,
            };
          } else {
            const [unreadData, posts, preCounselSummaries] = teacherResult as [
              { count: number },
              { status: string }[],
              PreCounselingProfileSummary[],
            ];
            nextState.teacherSummary = {
              unreadCount: unreadData.count,
              waitingCount: posts.filter((post) => post.status === 'WAITING').length,
              preCounselPendingCount: preCounselSummaries.filter((item) => !item.completed).length,
              error: null,
            };
          }
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
