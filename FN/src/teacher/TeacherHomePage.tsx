import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import AuthLoading from '../auth/AuthLoading';
import AppLayout from '../components/layout/AppLayout';
import PageHeader from '../components/PageHeader';
import RoleHomeZone from '../components/RoleHomeZone';
import { Alert } from '../components/ui';
import { usePageTitle } from '../hooks/usePageTitle';
import { PATHS } from '../routes/paths';
import SectionNoticeBoard from './components/SectionNoticeBoard';
import SectionSuggestion from './components/SectionSuggestion';
import SectionMoodSummary from './components/SectionMoodSummary';
import SectionPreCounselRead from './components/SectionPreCounselRead';
import SectionCounselWorkspace from './components/SectionCounselWorkspace';
import QuickActionBar from './components/QuickActionBar';
import SectionInviteCode from './components/SectionInviteCode';
import SectionNotificationSettings from './components/SectionNotificationSettings';
import SectionTodaySummary from './components/SectionTodaySummary';
import './teacher.css';
import { scrollToTeacherSection } from './teacherUtils';
import { useTeacherDashboard } from './useTeacherDashboard';
import { useTeacherHashScroll } from './useTeacherHashScroll';

export default function TeacherHomePage() {
  const { user, logout } = useAuth();
  const [summaryRefreshKey, setSummaryRefreshKey] = useState(0);
  const [pageSuccess, setPageSuccess] = useState<string | null>(null);
  const [sectionError, setSectionError] = useState<string | null>(null);
  const { summary, counselingPosts, preCounselSummaries, suggestions, listsLoaded } =
    useTeacherDashboard(Boolean(user), summaryRefreshKey);

  usePageTitle('교사 홈 | 온도');

  const refreshSummary = useCallback(() => {
    setSummaryRefreshKey((key) => key + 1);
  }, []);

  const navigateToSection = useCallback((sectionId: string) => {
    scrollToTeacherSection(sectionId);
  }, []);

  useTeacherHashScroll(navigateToSection);

  const handleSuccess = useCallback(
    (message: string) => {
      setSectionError(null);
      setPageSuccess(message);
      refreshSummary();
    },
    [refreshSummary],
  );

  const handleError = useCallback((message: string) => {
    setPageSuccess(null);
    setSectionError(message);
  }, []);

  if (!user) {
    return <AuthLoading message="교사 홈을 준비하고 있어요" />;
  }

  const greetingName = user.name?.trim() || user.username;
  const schoolLabel = user.schoolName?.trim() || '학교 미등록';

  return (
    <AppLayout>
      <div className="teacher-page" data-page="teacher-home">
        <PageHeader
          tone="teacher"
          eyebrow={`${greetingName} · ${schoolLabel}`}
          title="교사 홈"
          subtitle="담당 학생 상담과 마음 날씨를 한곳에서 확인하세요."
          actions={
            <>
              <Link className="page-header-action page-header-action--ghost" to={PATHS.HOME}>
                공통 홈
              </Link>
              <Link className="page-header-action page-header-action--danger-ghost" to={PATHS.WITHDRAW}>
                회원 탈퇴
              </Link>
              <button
                type="button"
                className="page-header-action page-header-action--secondary"
                onClick={() => logout()}
              >
                로그아웃
              </button>
            </>
          }
        />

        {sectionError ? <Alert variant="error">{sectionError}</Alert> : null}

        {pageSuccess ? <Alert variant="success">{pageSuccess}</Alert> : null}

        <RoleHomeZone
          badge="TODAY"
          title="오늘 업무"
          description="빠른 이동, 알림 설정, 오늘의 요약을 확인하세요."
          tone="teacher"
        >
          <QuickActionBar onNavigate={navigateToSection} />
          <SectionNotificationSettings onSuccess={handleSuccess} onError={handleError} />
          <SectionTodaySummary summary={summary} onNavigate={navigateToSection} />
        </RoleHomeZone>

        <RoleHomeZone
          badge="MANAGE"
          title="학생 · 상담 관리"
          description="초대 코드 발급과 상담 워크스페이스를 운영하세요."
          tone="teacher"
        >
          <SectionInviteCode onSuccess={handleSuccess} onError={handleError} />
          <SectionCounselWorkspace
            prefetchedPosts={counselingPosts}
            postsLoaded={listsLoaded}
            onSuccess={handleSuccess}
            onError={handleError}
            onDataChange={refreshSummary}
          />
        </RoleHomeZone>

        <RoleHomeZone
          badge="INSIGHT"
          title="학급 인사이트"
          description="마음 날씨, 사전 상담, 공지, 의견을 살펴보세요."
          tone="teacher"
        >
          <SectionMoodSummary onError={handleError} />
          <SectionPreCounselRead
            prefetchedSummaries={preCounselSummaries}
            summariesLoaded={listsLoaded}
            onError={handleError}
          />
          <SectionNoticeBoard onSuccess={handleSuccess} onError={handleError} />
          <SectionSuggestion
            prefetchedSuggestions={suggestions}
            suggestionsLoaded={listsLoaded}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        </RoleHomeZone>
      </div>
    </AppLayout>
  );
}
