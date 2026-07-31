import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { getPostLoginPath } from '../auth/redirects';
import AuthLoading from '../auth/AuthLoading';
import AppLayout from '../components/layout/AppLayout';
import PageHeader from '../components/PageHeader';
import { usePageTitle } from '../hooks/usePageTitle';
import SchoolTodayStrip from '../home/components/SchoolTodayStrip';
import PlatformAnnouncementSection from '../home/components/PlatformAnnouncementSection';
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
        <PageHeader
          tone="home"
          eyebrow={homeData.isLoading ? '불러오는 중…' : greeting}
          title="학교 홈"
          subtitle="오늘의 학교 생활을 한곳에서 시작하세요."
          actions={
            <>
              {user.role === 'TEACHER' ? (
                <Link className="page-header-action page-header-action--ghost" to={PATHS.TEACHER}>
                  교사 홈
                </Link>
              ) : null}
              {user.role === 'STUDENT' ? (
                <Link className="page-header-action page-header-action--ghost" to={PATHS.STUDENT}>
                  학생 홈
                </Link>
              ) : null}
              <button
                type="button"
                className="page-header-action page-header-action--secondary"
                onClick={handleLogout}
              >
                로그아웃
              </button>
            </>
          }
        />

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

        <PlatformAnnouncementSection />

        <SchoolTodayStrip
          todayLabel={formatTodayDate()}
          schoolMeta={schoolMeta}
          isLoading={homeData.isLoading}
          weather={homeData.weather}
          weatherError={homeData.weatherError}
          schedule={homeData.schedule}
          scheduleError={homeData.scheduleError}
        />

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
