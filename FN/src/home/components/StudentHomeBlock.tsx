import type { MealDayResponse, TimetableDayResponse } from '../../api/types/home';
import { Btn, Card } from '../../components/ui';
import { PATHS } from '../../routes/paths';
import {
  mealDisplayMessage,
  mealStatusClass,
  resolveMealStatus,
  resolveTimetableStatus,
  timetableDisplayMessage,
  timetableStatusClass,
  truncateText,
} from '../homeUtils';

interface StudentHomeBlockProps {
  meals: MealDayResponse | null;
  mealsError: string | null;
  timetable: TimetableDayResponse | null;
  timetableError: string | null;
}

export default function StudentHomeBlock({
  meals,
  mealsError,
  timetable,
  timetableError,
}: StudentHomeBlockProps) {
  return (
    <Card
      title="오늘 학교생활"
      titleId="student-home-title"
      className="home-role-block"
      aria-labelledby="student-home-title"
    >
      <MealSummary data={meals} error={mealsError} />
      <TimetableSummary data={timetable} error={timetableError} />

      <nav className="home-quick-links" aria-label="학생 빠른 이동">
        <Btn variant="secondary" to={`${PATHS.STUDENT}#section-today`}>
          오늘
        </Btn>
        <Btn variant="secondary" to={`${PATHS.STUDENT}#section-mood`}>
          마음
        </Btn>
        <Btn variant="secondary" to={`${PATHS.STUDENT}#section-notice`}>
          알림
        </Btn>
        <Btn variant="secondary" to={`${PATHS.STUDENT}#section-counsel-create`}>
          상담
        </Btn>
        <Btn variant="secondary" to={`${PATHS.STUDENT}#section-pre-counsel`}>
          사전카드
        </Btn>
        <Btn variant="secondary" to={`${PATHS.STUDENT}#section-school-calendar`}>
          일정
        </Btn>
        <Btn variant="secondary" to={`${PATHS.STUDENT}#section-timetable`}>
          시간표
        </Btn>
        <Btn variant="secondary" to={`${PATHS.STUDENT}#section-suggestion`}>
          건의
        </Btn>
      </nav>

      <div className="home-role-actions">
        <Btn variant="primary" fullWidth to={PATHS.STUDENT}>
          학생 홈 전체 보기
        </Btn>
      </div>
    </Card>
  );
}

function MealSummary({ data, error }: { data: MealDayResponse | null; error: string | null }) {
  if (error) {
    return <div className="home-status">{error}</div>;
  }

  if (!data) {
    return <div className="home-status">급식 정보를 불러오는 중…</div>;
  }

  const status = resolveMealStatus(data);

  if (status !== 'OK' || !data.meals?.length) {
    return (
      <div className={mealStatusClass(status)}>{mealDisplayMessage(data, status)}</div>
    );
  }

  const visibleMeals = data.meals.slice(0, 2);
  const extraCount = data.meals.length - 2;

  return (
    <div className="home-meal-summary">
      {visibleMeals.map((meal) => (
        <p key={`${meal.mealType}-${meal.mealOrder}`} className="home-summary-line">
          <strong>{meal.mealType}</strong> {truncateText(meal.menu, 52)}
        </p>
      ))}
      {extraCount > 0 ? (
        <p className="home-helper">외 {extraCount}끼 더 있어요 · 학생 홈에서 전체 보기</p>
      ) : null}
    </div>
  );
}

function TimetableSummary({
  data,
  error,
}: {
  data: TimetableDayResponse | null;
  error: string | null;
}) {
  if (error) {
    return <div className="home-status">{error}</div>;
  }

  if (!data) {
    return <div className="home-status">시간표를 불러오는 중…</div>;
  }

  const status = resolveTimetableStatus(data);

  if (status !== 'OK' || !data.periods?.length) {
    return (
      <div className={timetableStatusClass(status)}>
        {timetableDisplayMessage(data, status)}
      </div>
    );
  }

  const visiblePeriods = data.periods.slice(0, 3);
  const extraCount = data.periods.length - 3;

  return (
    <div className="home-timetable-summary">
      {visiblePeriods.map((period) => (
        <p key={period.period} className="home-summary-line">
          <strong>{period.period}교시</strong> {truncateText(period.subject, 24)}
        </p>
      ))}
      {extraCount > 0 ? (
        <p className="home-helper">외 {extraCount}교시 더 있어요 · 학생 홈에서 전체 보기</p>
      ) : null}
    </div>
  );
}
