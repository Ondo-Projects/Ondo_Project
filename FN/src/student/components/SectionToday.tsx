import type { MealDayResponse, WeatherTodayResponse } from '../../api/types/home';
import StudentSectionCard from './StudentSectionCard';
import { STUDENT_SECTIONS } from '../constants';
import {
  mealDisplayMessage,
  mealStatusClass,
  resolveMealStatus,
} from '../studentUtils';

interface SectionTodayProps {
  mealHint: string;
  meals: MealDayResponse | null;
  mealsError: string | null;
  weather: WeatherTodayResponse | null;
  weatherError: string | null;
}

export default function SectionToday({
  mealHint,
  meals,
  mealsError,
  weather,
  weatherError,
}: SectionTodayProps) {
  return (
    <StudentSectionCard
      id={STUDENT_SECTIONS.TODAY}
      title="오늘 한눈에"
      helper={mealHint}
    >
      <div className="student-widgets">
        <div className="student-widget">
          <h3 className="student-widget__title">오늘의 급식</h3>
          <MealContent data={meals} error={mealsError} />
        </div>
        <div className="student-widget">
          <h3 className="student-widget__title">오늘의 날씨</h3>
          <WeatherContent data={weather} error={weatherError} />
        </div>
      </div>
    </StudentSectionCard>
  );
}

function MealContent({ data, error }: { data: MealDayResponse | null; error: string | null }) {
  if (error) {
    return <div className="student-status">{error}</div>;
  }
  if (!data) {
    return <div className="student-status">급식 정보를 불러오는 중…</div>;
  }

  const status = resolveMealStatus(data);
  if (status !== 'OK' || !data.meals?.length) {
    return (
      <div className={mealStatusClass(status)}>{mealDisplayMessage(data, status)}</div>
    );
  }

  return (
    <div className="student-meal-list">
      {data.meals.map((meal) => (
        <article key={`${meal.mealType}-${meal.mealOrder}`} className="student-meal-item">
          <div className="student-meal-item__header">
            <h4>{meal.mealType}</h4>
            {meal.calories ? <span className="student-meal-item__calories">{meal.calories}</span> : null}
          </div>
          <p className="student-meal-item__menu">{meal.menu}</p>
        </article>
      ))}
      {data.message ? <p className="student-card__helper">{data.message}</p> : null}
    </div>
  );
}

function WeatherContent({
  data,
  error,
}: {
  data: WeatherTodayResponse | null;
  error: string | null;
}) {
  if (error) {
    return <div className="student-status">{error}</div>;
  }
  if (!data) {
    return <div className="student-status">날씨 정보를 불러오는 중…</div>;
  }

  const minMax =
    data.minTemperature && data.maxTemperature
      ? `최저 ${data.minTemperature} / 최고 ${data.maxTemperature}`
      : null;

  return (
    <>
      {data.region ? <p className="student-card__helper">{data.region} 날씨입니다.</p> : null}
      <div className="student-weather">
        <div className="student-weather__icon" aria-hidden="true">
          {data.icon || '🌡️'}
        </div>
        <div className="student-weather__main">
          <div className="student-weather__temp">{data.temperature || '-'}</div>
          <div className="student-weather__condition">{data.condition || '정보 없음'}</div>
          {minMax ? <div className="student-weather__range">{minMax}</div> : null}
          {data.message ? <p className="student-card__helper">{data.message}</p> : null}
        </div>
      </div>
    </>
  );
}
