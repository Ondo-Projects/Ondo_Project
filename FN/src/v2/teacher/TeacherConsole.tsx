import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CalendarHeart, ClipboardList, LogOut, Megaphone, MessagesSquare, Settings, SquarePen } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import AuthLoading from '../../auth/AuthLoading';
import { Button, Notice } from '../../ds';
import { usePageTitle } from '../../hooks/usePageTitle';
import { TEACHER_SECTIONS } from '../../teacher/constants';
import { useTeacherDashboard } from '../../teacher/useTeacherDashboard';
import { ConsoleShell, type ConsoleNavItem } from '../shell/ConsoleShell';
import AnnouncementButton from '../shell/AnnouncementButton';
import CounselView from './CounselView';
import MoodView from './MoodView';
import NoticeView from './NoticeView';
import PreCounselView from './PreCounselView';
import SettingsView from './SettingsView';
import SuggestionView from './SuggestionView';

type TeacherView = 'counsel' | 'mood' | 'precounsel' | 'notice' | 'suggestion' | 'settings';

const VIEW_TITLES: Record<TeacherView, string> = {
  counsel: '상담',
  mood: '마음 날씨',
  precounsel: '사전상담 카드',
  notice: '학급 공지',
  suggestion: '운영 건의',
  settings: '설정',
};

/** 예전 주소(#postList 등)로 들어와도 맞는 화면이 열리도록 */
const LEGACY_HASH: Record<string, TeacherView> = {
  [TEACHER_SECTIONS.POST_LIST]: 'counsel',
  [TEACHER_SECTIONS.DETAIL_CARD]: 'counsel',
  [TEACHER_SECTIONS.TODAY_SUMMARY]: 'counsel',
  [TEACHER_SECTIONS.MOOD_SUMMARY]: 'mood',
  [TEACHER_SECTIONS.PRE_COUNSEL_SUMMARY]: 'precounsel',
  [TEACHER_SECTIONS.PRE_COUNSEL_DETAIL]: 'precounsel',
  [TEACHER_SECTIONS.NOTICE_LIST]: 'notice',
  [TEACHER_SECTIONS.SUGGESTION]: 'suggestion',
  [TEACHER_SECTIONS.NOTIFICATION_SETTINGS]: 'settings',
  [TEACHER_SECTIONS.INVITE_CODE]: 'settings',
};

function viewFromHash(hash: string): TeacherView {
  const key = hash.replace('#', '');
  if (key in VIEW_TITLES) return key as TeacherView;
  return LEGACY_HASH[key] ?? 'counsel';
}

type Feedback = { tone: 'success' | 'danger'; message: string } | null;

export default function TeacherConsole() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const view = viewFromHash(location.hash);
  const [refreshKey, setRefreshKey] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const { summary, counselingPosts, preCounselSummaries, suggestions, listsLoaded } = useTeacherDashboard(
    Boolean(user),
    refreshKey,
  );

  usePageTitle(`${VIEW_TITLES[view]} | 온도 교사`);

  const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);

  const onSuccess = useCallback(
    (message: string) => {
      window.clearTimeout(timerRef.current);
      setFeedback({ tone: 'success', message });
      timerRef.current = window.setTimeout(() => setFeedback(null), 4000);
      refresh();
    },
    [refresh],
  );

  const onError = useCallback((message: string) => {
    window.clearTimeout(timerRef.current);
    setFeedback({ tone: 'danger', message });
  }, []);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const goTo = useCallback(
    (next: TeacherView) => {
      setFeedback(null);
      navigate({ hash: next === 'counsel' ? '' : next }, { replace: false });
      window.scrollTo({ top: 0 });
    },
    [navigate],
  );

  if (!user) {
    return <AuthLoading message="교사 화면을 준비하고 있어요" />;
  }

  const nav: ConsoleNavItem<TeacherView>[] = [
    { value: 'counsel', label: '상담', icon: MessagesSquare, count: summary.unreadCount },
    { value: 'mood', label: '마음 날씨', icon: CalendarHeart },
    { value: 'precounsel', label: '사전상담 카드', icon: ClipboardList },
    { value: 'notice', label: '학급 공지', icon: Megaphone },
    { value: 'suggestion', label: '운영 건의', icon: SquarePen },
    { value: 'settings', label: '설정', icon: Settings },
  ];

  const handlers = { onSuccess, onError };

  return (
    <ConsoleShell
      roleLabel="교사"
      userName={`${user.name?.trim() || user.username} 선생님`}
      userMeta={user.schoolName?.trim() || '학교 미등록'}
      nav={nav}
      active={view}
      onNavigate={goTo}
      headerActions={
        <>
          <AnnouncementButton />
          <Button
            size="sm"
            variant="ghost"
            icon={<LogOut size={16} aria-hidden />}
            onClick={() => logout()}
            aria-label="로그아웃"
          >
            <span className="hidden sm:inline">로그아웃</span>
          </Button>
        </>
      }
      sidebarFooter={
        <p className="px-1 text-xs leading-relaxed text-gray-500">
          학생 연결이 필요하면 <button type="button" className="font-medium text-blue-700 hover:underline" onClick={() => goTo('settings')}>설정</button>에서 초대 코드를 확인하세요.
        </p>
      }
    >
      {feedback ? (
        <Notice tone={feedback.tone} onClose={() => setFeedback(null)} className="mb-4">
          {feedback.message}
        </Notice>
      ) : null}
      {summary.error && !feedback ? (
        <Notice tone="danger" className="mb-4">
          {summary.error}
        </Notice>
      ) : null}

      {view === 'counsel' ? (
        <CounselView
          summary={summary}
          prefetchedPosts={counselingPosts}
          postsLoaded={listsLoaded}
          onDataChange={refresh}
          onOpenSuggestions={() => goTo('suggestion')}
          {...handlers}
        />
      ) : view === 'mood' ? (
        <MoodView onError={onError} />
      ) : view === 'precounsel' ? (
        <PreCounselView prefetched={preCounselSummaries} loaded={listsLoaded} onError={onError} />
      ) : view === 'notice' ? (
        <NoticeView {...handlers} />
      ) : view === 'suggestion' ? (
        <SuggestionView prefetched={suggestions} loaded={listsLoaded} onDataChange={refresh} {...handlers} />
      ) : (
        <SettingsView {...handlers} onLogout={() => logout()} />
      )}
    </ConsoleShell>
  );
}
