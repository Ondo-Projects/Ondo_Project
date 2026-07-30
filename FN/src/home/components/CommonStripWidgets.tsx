import type { WeatherTodayResponse } from '../../api/types/home';
import {
  formatScheduleDate,
  resolveScheduleStatus,
  scheduleDisplayMessage,
  scheduleStatusClass,
  truncateText,
} from '../homeUtils';

interface WeatherWidgetProps {
  data: WeatherTodayResponse | null;
  error: string | null;
}

export function WeatherWidget({ data, error }: WeatherWidgetProps) {
  if (error) {
    return <div className="home-status">{error}</div>;
  }

  if (!data) {
    return <div className="home-status">날씨 정보를 불러오는 중…</div>;
  }

  const minMax =
    data.minTemperature && data.maxTemperature
      ? `최저 ${data.minTemperature} / 최고 ${data.maxTemperature}`
      : null;

  return (
    <>
      {data.region ? <p className="home-helper">{data.region} 날씨입니다.</p> : null}
      <div className="home-weather">
        <div className="home-weather__icon" aria-hidden="true">
          {data.icon || '🌡️'}
        </div>
        <div className="home-weather__main">
          <div className="home-weather__temp">{data.temperature || '-'}</div>
          <div className="home-weather__condition">{data.condition || '정보 없음'}</div>
          {minMax ? <div className="home-weather__range">{minMax}</div> : null}
          {data.message ? <p className="home-helper">{data.message}</p> : null}
        </div>
      </div>
    </>
  );
}

interface ScheduleSummaryProps {
  data: import('../../api/types/home').SchoolScheduleUpcomingResponse | null;
  error: string | null;
}

export function ScheduleSummary({ data, error }: ScheduleSummaryProps) {
  if (error) {
    return <div className="home-status">{error}</div>;
  }

  if (!data) {
    return <div className="home-status">학사일정을 불러오는 중…</div>;
  }

  const status = resolveScheduleStatus(data);

  if (status !== 'OK' || !data.events?.length) {
    return (
      <div className={scheduleStatusClass(status)}>
        {scheduleDisplayMessage(data, status)}
      </div>
    );
  }

  const visibleEvents = data.events.slice(0, 2);
  const extraCount = data.events.length - 2;

  return (
    <div>
      {visibleEvents.map((event) => (
        <p key={`${event.date}-${event.eventName}`} className="home-summary-line">
          <strong>{formatScheduleDate(event.date)}</strong>{' '}
          {truncateText(event.eventName, 40)}
        </p>
      ))}
      {extraCount > 0 ? (
        <p className="home-helper">외 {extraCount}건 더 있어요 · 학생 홈에서 전체 보기</p>
      ) : null}
    </div>
  );
}
