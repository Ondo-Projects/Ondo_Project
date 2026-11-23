import { Link } from 'react-router-dom';
import { ArrowRight, LogOut } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import AuthLoading from '../../auth/AuthLoading';
import { buildSchoolMeta } from '../../home/homeUtils';
import { useHomeData } from '../../home/useHomeData';
import { Button, Notice, StatStrip } from '../../ds';
import { usePageTitle } from '../../hooks/usePageTitle';
import { PATHS } from '../../routes/paths';
import AnnouncementButton from '../shell/AnnouncementButton';
import { AnnouncementDetailSheet, AnnouncementList } from '../shell/announcements';
import { MealBlock, ScheduleBlock, WeatherBlock } from '../student/SchoolTab';
import { todayLabel } from '../student/shared';
import { Block } from '../student/ui';

/** /home — 학생·교사가 함께 보는 학교 홈 (날씨, 학사일정, 온도 공지) */
export default function CommonHome() {
  const { user, logout } = useAuth();
  const home = useHomeData(user);
  usePageTitle('학교 홈 | 온도');

  if (!user) return <AuthLoading message="학교 홈을 준비하고 있어요" />;

  const isTeacher = user.role === 'TEACHER';
  const roleHome = isTeacher ? PATHS.TEACHER : PATHS.STUDENT;
  const name = user.name?.trim() || user.username;

  return (
    <div className="ondo-ui min-h-screen bg-gray-100">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-3">
            <Link to={roleHome} className="flex items-center gap-2" aria-label="내 화면으로">
              <img src="/ondo-logo.png" alt="" width={24} height={24} className="h-6 w-6" />
              <span className="text-[15px] font-semibold tracking-tight">온도</span>
            </Link>
            <span className="h-4 w-px bg-gray-200" aria-hidden />
            <span className="text-[13px] font-medium text-gray-500">학교 홈</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AnnouncementButton withSheet={false} />
            <Button
              size="sm"
              variant="ghost"
              icon={<LogOut size={16} aria-hidden />}
              onClick={() => void logout()}
              aria-label="로그아웃"
            >
              <span className="hidden sm:inline">로그아웃</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6">
        <div className="flex flex-wrap items-end justify-between gap-3 px-1">
          <div>
            <p className="text-[13px] text-gray-500">{todayLabel()}</p>
            <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-gray-900">
              {name}
              {isTeacher ? ' 선생님' : '님'}
            </h1>
            <p className="mt-0.5 text-[13px] text-gray-500">{buildSchoolMeta(user, home.schoolProfile)}</p>
          </div>
          <Link
            to={roleHome}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-blue-700 px-3.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-blue-800"
          >
            {isTeacher ? '교사 화면' : '학생 화면'}
            <ArrowRight size={16} aria-hidden />
          </Link>
        </div>

        {home.pageError ? <Notice tone="danger">{home.pageError}</Notice> : null}

        {isTeacher ? (
          home.teacherSummary.error ? (
            <Notice tone="danger">{home.teacherSummary.error}</Notice>
          ) : (
            <StatStrip
              items={[
                { label: '읽지 않은 상담', value: home.teacherSummary.unreadCount ?? '-' },
                { label: '대기 중인 상담', value: home.teacherSummary.waitingCount ?? '-' },
                { label: '사전상담 미작성', value: home.teacherSummary.preCounselPendingCount ?? '-' },
              ]}
            />
          )
        ) : null}

        <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
          <div className="flex flex-col gap-6">
            <WeatherBlock data={home.weather} error={home.weatherError} loading={home.isLoading} />
            {!isTeacher ? <MealBlock data={home.meals} error={home.mealsError} loading={home.isLoading} /> : null}
          </div>
          <ScheduleBlock data={home.schedule} error={home.scheduleError} loading={home.isLoading} limit={6} />
          <Block title="온도 공지" flush>
            <AnnouncementList emptyText="아직 온도 공지가 없습니다." />
          </Block>
        </div>
      </main>

      <AnnouncementDetailSheet />
    </div>
  );
}
