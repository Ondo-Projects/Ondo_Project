import { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Building2, LayoutDashboard, LogOut, Megaphone, ScrollText, SquarePen, Users } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import AuthLoading from '../../auth/AuthLoading';
import { ADMIN_SECTIONS } from '../../admin/constants';
import { Button, Notice } from '../../ds';
import { usePageTitle } from '../../hooks/usePageTitle';
import { ConsoleShell, type ConsoleNavItem } from '../shell/ConsoleShell';
import { useFeedback } from '../shell/useFeedback';
import AnnouncementsView from './AnnouncementsView';
import AuditView from './AuditView';
import OverviewView from './OverviewView';
import SchoolsView from './SchoolsView';
import SuggestionsView from './SuggestionsView';
import UsersView from './UsersView';

type AdminView = 'overview' | 'users' | 'schools' | 'suggestions' | 'announcements' | 'audit';

const VIEW_TITLES: Record<AdminView, string> = {
  overview: '운영 현황',
  users: '회원',
  schools: '학교',
  suggestions: '운영 건의',
  announcements: '온도 공지',
  audit: '감사 기록',
};

/** 예전 주소(#section-suggestion 등)도 맞는 화면으로 */
const LEGACY_HASH: Record<string, AdminView> = {
  [ADMIN_SECTIONS.SUGGESTION]: 'suggestions',
  [ADMIN_SECTIONS.ANNOUNCEMENT]: 'announcements',
};

function viewFromHash(hash: string): AdminView {
  const key = hash.replace('#', '');
  if (key in VIEW_TITLES) return key as AdminView;
  return LEGACY_HASH[key] ?? 'overview';
}

export default function AdminConsole() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const view = viewFromHash(location.hash);
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);
  const { feedback, onSuccess, onError, clear } = useFeedback(refresh);

  usePageTitle(`${VIEW_TITLES[view]} | 온도 관리자`);

  const goTo = useCallback(
    (next: AdminView) => {
      clear();
      navigate({ hash: next === 'overview' ? '' : next });
      window.scrollTo({ top: 0 });
    },
    [clear, navigate],
  );

  if (!user) {
    return <AuthLoading message="관리자 화면을 준비하고 있어요" />;
  }

  const nav: ConsoleNavItem<AdminView>[] = [
    { value: 'overview', label: '운영 현황', icon: LayoutDashboard },
    { value: 'users', label: '회원', icon: Users },
    { value: 'schools', label: '학교', icon: Building2 },
    { value: 'suggestions', label: '운영 건의', icon: SquarePen },
    { value: 'announcements', label: '온도 공지', icon: Megaphone },
    { value: 'audit', label: '감사 기록', icon: ScrollText },
  ];

  const handlers = { onSuccess, onError };

  return (
    <ConsoleShell
      roleLabel="관리자"
      userName={user.name?.trim() || user.username}
      userMeta="관리자"
      nav={nav}
      active={view}
      onNavigate={goTo}
      headerActions={
        <Button
          size="sm"
          variant="ghost"
          icon={<LogOut size={16} aria-hidden />}
          onClick={() => logout()}
          aria-label="로그아웃"
        >
          <span className="hidden sm:inline">로그아웃</span>
        </Button>
      }
      sidebarFooter={
        <p className="px-1 text-xs leading-relaxed text-gray-500">
          회원 정지, 학교 변경, 건의 처리는 모두 감사 기록의 '관리자 작업'에 남습니다.
        </p>
      }
    >
      {feedback ? (
        <Notice tone={feedback.tone} onClose={clear} className="mb-4">
          {feedback.message}
        </Notice>
      ) : null}

      {view === 'overview' ? (
        <OverviewView refreshKey={refreshKey} onError={onError} onOpenAudit={() => goTo('audit')} />
      ) : view === 'users' ? (
        <UsersView {...handlers} />
      ) : view === 'schools' ? (
        <SchoolsView {...handlers} />
      ) : view === 'suggestions' ? (
        <SuggestionsView {...handlers} onDataChange={refresh} />
      ) : view === 'announcements' ? (
        <AnnouncementsView {...handlers} />
      ) : (
        <AuditView key="audit" refreshKey={refreshKey} onError={onError} />
      )}
    </ConsoleShell>
  );
}
