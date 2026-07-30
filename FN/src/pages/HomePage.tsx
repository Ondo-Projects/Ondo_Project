import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { getPostLoginPath } from '../auth/redirects';
import AuthLoading from '../auth/AuthLoading';
import AppLayout from '../components/layout/AppLayout';
import { usePageTitle } from '../hooks/usePageTitle';
import { ScheduleSummary, WeatherWidget } from '../home/components/CommonStripWidgets';
import StudentHomeBlock from '../home/components/StudentHomeBlock';
import TeacherHomeBlock from '../home/components/TeacherHomeBlock';
import '../home/home.css';
import { buildSchoolMeta, buildUserGreeting, formatTodayDate } from '../home/homeUtils';
import { useHomeData } from '../home/useHomeData';
import { PATHS } from '../routes/paths';

export default function HomePage() {
  const { user, logout } = useAuth();
  const homeData = useHomeData(user);

  usePageTitle('학교 홈 | 온도');

  if (!user) {
    return <AuthLoading message="홈을 준비하고 있어요" />;
  }

  async function handleLogout() {
    await logout();
  }

  const greeting = buildUserGreeting(user, homeData.schoolProfile);
  const schoolMeta = buildSchoolMeta(user, homeData.schoolProfile);

  return (
    <AppLayout>
      <div className="home-page" data-page="school-home">
        <header className="home-header">
          <div className="home-header__main">
            <p className="home-greeting">{homeData.isLoading ? '불러오는 중…' : greeting}</p>
            <h1 className="home-title">학교 홈</h1>
            <p className="home-subtitle">오늘의 학교 생활을 한곳에서 시작하세요.</p>
          </div>
          <div className="home-header__actions">
            {user.role === 'TEACHER' ? (
              <Link className="home-btn home-btn--ghost" to={PATHS.TEACHER}>
                교사 홈
              </Link>
            ) : null}
            {user.role === 'STUDENT' ? (
              <Link className="home-btn home-btn--ghost" to={PATHS.STUDENT}>
                학생 홈
              </Link>
            ) : null}
            <button type="button" className="home-btn home-btn--secondary" onClick={handleLogout}>
              로그아웃
            </button>
          </div>
        </header>

        {homeData.pageError ? (
          <p className="home-message" role="alert">
            {homeData.pageError}
          </p>
        ) : null}

        {homeData.schoolProfileError ? (
          <p className="home-message" role="alert">
            {homeData.schoolProfileError}
          </p>
        ) : null}

        <section className="home-card home-common-strip" aria-label="오늘의 학교 정보">
          <p className="home-today-date">{formatTodayDate()}</p>
          <p className="home-school-meta">{homeData.isLoading ? '불러오는 중…' : schoolMeta}</p>
          <WeatherWidget data={homeData.weather} error={homeData.weatherError} />
          <div className="home-schedule-summary">
            <p className="home-schedule-summary__title">다가오는 학사일정</p>
            <ScheduleSummary data={homeData.schedule} error={homeData.scheduleError} />
          </div>
        </section>

        {user.role === 'STUDENT' ? (
          <StudentHomeBlock
            meals={homeData.meals}
            mealsError={homeData.mealsError}
            timetable={homeData.timetable}
            timetableError={homeData.timetableError}
          />
        ) : null}

        {user.role === 'TEACHER' ? <TeacherHomeBlock summary={homeData.teacherSummary} /> : null}
      </div>
    </AppLayout>
  );
}

export function RootRedirect() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <AuthLoading />;
  }

  if (isAuthenticated && user) {
    return <Navigate to={getPostLoginPath(user.role)} replace />;
  }

  return <Navigate to={PATHS.LOGIN} replace />;
}
