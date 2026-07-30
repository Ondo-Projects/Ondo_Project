import { useEffect, useState } from 'react';
import type { ProfileSchoolResponse } from '../api/types/home';
import type {
  MealDayResponse,
  SchoolScheduleUpcomingResponse,
  TimetableDayResponse,
  WeatherTodayResponse,
} from '../api/types/home';
import type { StudentNotice } from '../api/types/student';
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

export function useStudentSchoolLife(enabled: boolean): StudentSchoolLifeState {
  const [state, setState] = useState<StudentSchoolLifeState>(initialState);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    async function loadData() {
      setState({ ...initialState, isLoading: true });

      try {
        const [schoolProfile, assignment] = await Promise.all([
          getStudentProfileSchool().catch((error) => {
            throw error;
          }),
          getStudentAssignmentOptional(),
        ]);

        const hasAssignment = assignment !== null;

        const mealsPromise = getStudentTodayMeals().catch((error) => ({
          error: resolveErrorMessage(error, '급식 정보를 불러올 수 없습니다.'),
        }));
        const weatherPromise = getStudentTodayWeather().catch((error) => ({
          error: resolveErrorMessage(error, '날씨 정보를 불러올 수 없습니다.'),
        }));
        const schedulePromise = getStudentUpcomingSchoolSchedule(14).catch((error) => ({
          error: resolveErrorMessage(error, '학사일정을 불러올 수 없습니다.'),
        }));
        const timetablePromise = getStudentTodayTimetable().catch((error) => ({
          error: resolveErrorMessage(error, '시간표를 불러올 수 없습니다.'),
        }));
        const noticesPromise = hasAssignment
          ? getStudentNotices().catch((error) => ({
              error: resolveErrorMessage(error, '알림을 불러올 수 없습니다.'),
            }))
          : Promise.resolve(null);

        const [mealsResult, weatherResult, scheduleResult, timetableResult, noticesResult] =
          await Promise.all([
            mealsPromise,
            weatherPromise,
            schedulePromise,
            timetablePromise,
            noticesPromise,
          ]);

        if (cancelled) {
          return;
        }

        const nextState: StudentSchoolLifeState = {
          isLoading: false,
          pageError: null,
          schoolProfile,
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
          nextState.timetable = timetableResult;
        }

        if (noticesResult) {
          if ('error' in noticesResult) {
            nextState.noticesError = noticesResult.error;
          } else {
            nextState.notices = noticesResult;
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
  }, [enabled]);

  return state;
}
