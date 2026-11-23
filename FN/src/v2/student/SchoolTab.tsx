import type {
  MealDayResponse,
  SchoolScheduleUpcomingResponse,
  TimetableDayResponse,
  WeatherTodayResponse,
} from '../../api/types/home';
import { Skeleton } from '../../ds';
import {
  mealDisplayMessage,
  mergeConsecutiveScheduleEvents,
  resolveMealStatus,
  resolveScheduleStatus,
  resolveTimetableStatus,
  scheduleDisplayMessage,
  timetableDisplayMessage,
} from '../../student/studentUtils';
import { formatKoreanDay, weatherIcon } from './shared';

/** 12월 8일~10일 / 11월 30일~12월 2일 */
function formatDayRange(from: string, to: string): string {
  const [, fm, fd] = from.split('-').map(Number);
  const [, tm, td] = to.split('-').map(Number);
  return fm === tm ? `${fm}월 ${fd}일~${td}일` : `${fm}월 ${fd}일~${tm}월 ${td}일`;
}
import { Block, StatusText } from './ui';

interface SchoolTabProps {
  schoolName: string;
  weather: WeatherTodayResponse | null;
  weatherError: string | null;
  meals: MealDayResponse | null;
  mealsError: string | null;
  timetable: TimetableDayResponse | null;
  timetableError: string | null;
  schedule: SchoolScheduleUpcomingResponse | null;
  scheduleError: string | null;
  loading: boolean;
  go: (hash: string) => void;
}

const WARN_STATUSES = ['MAPPING_FAILED', 'UNAVAILABLE'];

export default function SchoolTab(props: SchoolTabProps) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="px-1 pt-1 text-xl font-semibold tracking-tight text-gray-900">{props.schoolName}</h1>
      <WeatherBlock data={props.weather} error={props.weatherError} loading={props.loading} />
      <TimetableBlock data={props.timetable} error={props.timetableError} loading={props.loading} go={props.go} />
      <MealBlock data={props.meals} error={props.mealsError} loading={props.loading} />
      <ScheduleBlock data={props.schedule} error={props.scheduleError} loading={props.loading} />
    </div>
  );
}

function Loading() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function WeatherBlock({
  data,
  error,
  loading,
}: {
  data: WeatherTodayResponse | null;
  error: string | null;
  loading: boolean;
}) {
  const Icon = weatherIcon(data?.condition);
  return (
    <Block title="오늘 날씨" footer={data?.region ? `${data.region} 기준 · 기상청 단기예보` : undefined}>
      {error ? (
        <StatusText tone="warn">{error}</StatusText>
      ) : loading || !data ? (
        <Loading />
      ) : (
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700">
            <Icon size={24} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold tracking-tight text-gray-900 tabular-nums">
                {data.temperature || '-'}
              </span>
              <span className="text-sm text-gray-600">{data.condition || '정보 없음'}</span>
            </p>
            {data.minTemperature && data.maxTemperature ? (
              <p className="text-[13px] text-gray-500 tabular-nums">
                최저 {data.minTemperature} · 최고 {data.maxTemperature}
              </p>
            ) : null}
            {data.message ? <p className="mt-1 text-xs text-gray-500">{data.message}</p> : null}
          </div>
        </div>
      )}
    </Block>
  );
}

function TimetableBlock({
  data,
  error,
  loading,
  go,
}: {
  data: TimetableDayResponse | null;
  error: string | null;
  loading: boolean;
  go: (hash: string) => void;
}) {
  const status = data ? resolveTimetableStatus(data) : null;
  const title =
    data?.grade && data.classNumber ? `오늘 시간표 · ${data.grade}학년 ${data.classNumber}반` : '오늘 시간표';

  return (
    <Block title={title} flush>
      {error ? (
        <div className="p-4">
          <StatusText tone="warn">{error}</StatusText>
        </div>
      ) : loading || !data ? (
        <div className="p-4">
          <Loading />
        </div>
      ) : status !== 'OK' || !data.periods?.length ? (
        <div className="flex flex-col items-start gap-3 p-4">
          <StatusText tone={WARN_STATUSES.includes(status ?? '') ? 'warn' : 'muted'}>
            {timetableDisplayMessage(data, status ?? '')}
          </StatusText>
          {status === 'PROFILE_INCOMPLETE' ? (
            <button type="button" onClick={() => go('#me/class')} className="text-[13px] font-medium text-blue-700">
              학년·반 입력하기
            </button>
          ) : null}
        </div>
      ) : (
        <ol className="divide-y divide-gray-100">
          {data.periods.map((period) => (
            <li key={period.period} className="flex items-center gap-3 px-4 py-2.5">
              <span className="w-10 shrink-0 text-xs font-medium text-gray-500 tabular-nums">{period.period}교시</span>
              <span className="flex-1 text-sm text-gray-900">{period.subject}</span>
              {period.classroom ? <span className="text-xs text-gray-500">{period.classroom}</span> : null}
            </li>
          ))}
        </ol>
      )}
    </Block>
  );
}

export function MealBlock({
  data,
  error,
  loading,
}: {
  data: MealDayResponse | null;
  error: string | null;
  loading: boolean;
}) {
  const status = data ? resolveMealStatus(data) : null;
  return (
    <Block title="오늘 급식" flush>
      {error ? (
        <div className="p-4">
          <StatusText tone="warn">{error}</StatusText>
        </div>
      ) : loading || !data ? (
        <div className="p-4">
          <Loading />
        </div>
      ) : status !== 'OK' || !data.meals?.length ? (
        <div className="p-4">
          <StatusText tone={WARN_STATUSES.includes(status ?? '') ? 'warn' : 'muted'}>
            {mealDisplayMessage(data, status ?? '')}
          </StatusText>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {data.meals.map((meal) => (
            <div key={`${meal.mealType}-${meal.mealOrder}`} className="px-4 py-3">
              <p className="flex items-baseline justify-between gap-2">
                <span className="text-[13px] font-semibold text-gray-900">{meal.mealType}</span>
                {meal.calories ? <span className="text-xs text-gray-500 tabular-nums">{meal.calories}</span> : null}
              </p>
              <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-gray-700">{meal.menu}</p>
            </div>
          ))}
        </div>
      )}
    </Block>
  );
}

export function ScheduleBlock({
  data,
  error,
  loading,
  limit,
}: {
  data: SchoolScheduleUpcomingResponse | null;
  error: string | null;
  loading: boolean;
  limit?: number;
}) {
  const status = data ? resolveScheduleStatus(data) : null;
  const events = data?.events?.length ? mergeConsecutiveScheduleEvents(data.events) : [];
  const visible = limit ? events.slice(0, limit) : events;

  return (
    <Block
      title="다가오는 학사일정"
      footer={limit && events.length > limit ? `외 ${events.length - limit}건` : '앞으로 2주 동안의 일정이에요.'}
      flush
    >
      {error ? (
        <div className="p-4">
          <StatusText tone="warn">{error}</StatusText>
        </div>
      ) : loading || !data ? (
        <div className="p-4">
          <Loading />
        </div>
      ) : status !== 'OK' || events.length === 0 ? (
        <div className="p-4">
          <StatusText tone={WARN_STATUSES.includes(status ?? '') ? 'warn' : 'muted'}>
            {scheduleDisplayMessage(data, status ?? '')}
          </StatusText>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {visible.map((event) => (
            <li key={`${event.fromDate}-${event.eventName}`} className="flex gap-3 px-4 py-2.5">
              <span className="w-28 shrink-0 text-xs font-medium text-gray-500 tabular-nums">
                {event.fromDate === event.toDate
                  ? formatKoreanDay(event.fromDate)
                  : formatDayRange(event.fromDate, event.toDate)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm text-gray-900">{event.eventName}</span>
                {event.eventContent ? <span className="block text-xs text-gray-500">{event.eventContent}</span> : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Block>
  );
}
