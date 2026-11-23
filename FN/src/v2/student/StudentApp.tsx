import { useCallback, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronLeft, House, MessagesSquare, School, UserRound, type LucideIcon } from 'lucide-react';
import type { StudentAssignment } from '../../api/types/student';
import { useAuth } from '../../auth/AuthProvider';
import AuthLoading from '../../auth/AuthLoading';
import { usePlatformAnnouncementPanel } from '../../home/PlatformAnnouncementProvider';
import { Notice, cn } from '../../ds';
import { usePageTitle } from '../../hooks/usePageTitle';
import { PATHS } from '../../routes/paths';
import { useStudentSchoolLife } from '../../student/useStudentSchoolLife';
import { AnnouncementDetailSheet } from '../shell/announcements';
import { useFeedback } from '../shell/useFeedback';
import CounselTab from './CounselTab';
import HomeTab from './HomeTab';
import MeTab from './MeTab';
import NewsTab from './NewsTab';
import SchoolTab from './SchoolTab';
import { type StudentRoute, type StudentTab, parseStudentHash } from './shared';

const NAV: Array<{ tab: StudentTab; label: string; icon: LucideIcon }> = [
  { tab: 'home', label: '홈', icon: House },
  { tab: 'school', label: '학교', icon: School },
  { tab: 'counsel', label: '상담', icon: MessagesSquare },
  { tab: 'news', label: '소식', icon: Bell },
  { tab: 'me', label: '내 정보', icon: UserRound },
];

const TAB_TITLES: Record<StudentTab, string> = {
  home: '홈',
  school: '학교',
  counsel: '상담',
  news: '소식',
  me: '내 정보',
};

/** 하위 화면 제목과 뒤로 가기 주소 */
function subScreen(route: StudentRoute): { title: string; back: string } | null {
  const [a, b, c] = route.sub;
  if (!a) return null;
  if (route.tab === 'counsel') {
    if (a === 'new') return { title: '상담 신청', back: '#counsel' };
    if (a === 'card') return { title: '사전상담 카드', back: '#counsel' };
    if (b === 'edit') return { title: '상담 고치기', back: `#counsel/${a}` };
    return { title: '상담 내용', back: '#counsel' };
  }
  if (route.tab === 'me') {
    if (a === 'class') return { title: '학년·반', back: '#me' };
    if (a === 'teacher') return { title: '담임 선생님', back: '#me' };
    if (a === 'suggestions') {
      if (!b) return { title: '운영 건의', back: '#me' };
      if (b === 'new') return { title: '새 건의', back: '#me/suggestions' };
      if (c === 'edit') return { title: '건의 고치기', back: `#me/suggestions/${b}` };
      return { title: '건의 내용', back: '#me/suggestions' };
    }
  }
  return null;
}

export default function StudentApp() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const route = parseStudentHash(location.hash);
  const { reloadTimetable, reloadWorkspace, applyAssignment, ...life } = useStudentSchoolLife(Boolean(user));
  const refresh = useCallback(() => void reloadWorkspace(), [reloadWorkspace]);
  const { feedback, onSuccess, onError, clear } = useFeedback(refresh);
  const { unreadCount } = usePlatformAnnouncementPanel();

  const sub = subScreen(route);
  usePageTitle(`${sub?.title ?? TAB_TITLES[route.tab]} | 온도`);

  const go = useCallback(
    (hash: string) => {
      clear();
      navigate({ hash });
    },
    [clear, navigate],
  );

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.hash]);

  const onAssignmentChanged = useCallback(
    async (assignment: StudentAssignment) => {
      await applyAssignment(assignment);
      await reloadWorkspace();
    },
    [applyAssignment, reloadWorkspace],
  );

  const onClassChanged = useCallback(async () => {
    await reloadTimetable();
  }, [reloadTimetable]);

  if (!user) return <AuthLoading message="학생 화면을 준비하고 있어요" />;

  const name = user.name?.trim() || user.username;
  const schoolName = life.schoolProfile?.schoolName?.trim() || user.schoolName?.trim() || '학교 미등록';
  const handlers = { onSuccess, onError };
  const unansweredNews = unreadCount;

  return (
    <div className="ondo-ui min-h-screen bg-gray-100">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-12 max-w-xl items-center gap-2 px-3">
          {sub ? (
            <>
              <button
                type="button"
                onClick={() => go(sub.back)}
                className="-ml-1 inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-700 hover:bg-gray-100"
                aria-label="뒤로"
              >
                <ChevronLeft size={20} aria-hidden />
              </button>
              <span className="truncate text-[15px] font-semibold text-gray-900">{sub.title}</span>
            </>
          ) : (
            <Link to={PATHS.STUDENT} className="flex items-center gap-2 px-1" aria-label="온도 학생 홈">
              <img src="/ondo-logo.png" alt="" width={22} height={22} className="h-[22px] w-[22px]" />
              <span className="text-[15px] font-semibold tracking-tight">온도</span>
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 pt-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
        {life.pageError ? (
          <Notice tone="danger" className="mb-4">
            {life.pageError}
          </Notice>
        ) : null}

        {route.tab === 'home' ? (
          <HomeTab name={name} schoolName={schoolName} life={life} go={go} {...handlers} />
        ) : route.tab === 'school' ? (
          <SchoolTab
            schoolName={schoolName}
            weather={life.weather}
            weatherError={life.weatherError}
            meals={life.meals}
            mealsError={life.mealsError}
            timetable={life.timetable}
            timetableError={life.timetableError}
            schedule={life.schedule}
            scheduleError={life.scheduleError}
            loading={life.isLoading}
            go={go}
          />
        ) : route.tab === 'counsel' ? (
          <CounselTab
            sub={route.sub}
            hasAssignment={life.hasAssignment}
            posts={life.counselingPosts}
            preCounsel={life.preCounselProfile}
            loaded={life.workspaceLoaded}
            go={go}
            reload={reloadWorkspace}
            {...handlers}
          />
        ) : route.tab === 'news' ? (
          <NewsTab
            hasAssignment={life.hasAssignment}
            notices={life.notices}
            noticesError={life.noticesError}
            loaded={life.workspaceLoaded}
            go={go}
          />
        ) : (
          <MeTab
            sub={route.sub}
            name={name}
            username={user.username}
            schoolName={schoolName}
            assignment={life.assignment}
            suggestions={life.suggestions}
            loaded={life.workspaceLoaded}
            go={go}
            reload={reloadWorkspace}
            onLogout={() => void logout()}
            onAssignmentChanged={onAssignmentChanged}
            onClassChanged={onClassChanged}
            {...handlers}
          />
        )}
      </main>

      {feedback ? (
        <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 px-4">
          <Notice tone={feedback.tone} onClose={clear} className="mx-auto max-w-xl bg-white">
            {feedback.message}
          </Notice>
        </div>
      ) : null}

      <nav
        aria-label="학생 메뉴"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto grid h-16 max-w-xl grid-cols-5">
          {NAV.map(({ tab, label, icon: Icon }) => {
            const active = route.tab === tab;
            const badge = tab === 'news' && unansweredNews > 0;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => go(tab === 'home' ? '' : `#${tab}`)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-1 text-[11px] font-medium',
                  active ? 'text-blue-700' : 'text-gray-500',
                )}
              >
                <span className="relative">
                  <Icon size={20} aria-hidden strokeWidth={active ? 2.2 : 1.8} />
                  {badge ? (
                    <span
                      className="absolute -top-0.5 -right-1 h-2 w-2 rounded-full bg-blue-600"
                      aria-label="새 온도 공지"
                    />
                  ) : null}
                </span>
                {label}
              </button>
            );
          })}
        </div>
      </nav>

      <AnnouncementDetailSheet />
    </div>
  );
}
