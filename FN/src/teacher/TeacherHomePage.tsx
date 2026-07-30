import { useCallback, useState } from 'react';

import { Link } from 'react-router-dom';

import { useAuth } from '../auth/AuthProvider';

import AuthLoading from '../auth/AuthLoading';

import AppLayout from '../components/layout/AppLayout';
import BrandMark from '../components/BrandMark';

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

  const { summary } = useTeacherDashboard(Boolean(user), summaryRefreshKey);

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

        <header className="teacher-header">

          <BrandMark />

          <div className="teacher-header__main">

            <p className="teacher-greeting">

              {greetingName} · {schoolLabel}

            </p>

            <h1 className="teacher-title">교사 홈</h1>

            <p className="teacher-subtitle">담당 학생 상담과 마음 날씨를 한곳에서 확인하세요.</p>

          </div>

          <div className="teacher-header__actions">

            <Link className="teacher-btn teacher-btn--ghost" to={PATHS.HOME}>

              공통 홈

            </Link>

            <button type="button" className="teacher-btn teacher-btn--secondary" onClick={() => logout()}>

              로그아웃

            </button>

          </div>

        </header>



        {sectionError ? (

          <p className="teacher-message teacher-message--error" role="alert">

            {sectionError}

          </p>

        ) : null}



        {pageSuccess ? (

          <p className="teacher-message teacher-message--success" role="status">

            {pageSuccess}

          </p>

        ) : null}



        <QuickActionBar onNavigate={navigateToSection} />



        <SectionNotificationSettings onSuccess={handleSuccess} onError={handleError} />



        <SectionTodaySummary summary={summary} onNavigate={navigateToSection} />



        <SectionInviteCode onSuccess={handleSuccess} onError={handleError} />

        <SectionCounselWorkspace
          refreshToken={summaryRefreshKey}
          onSuccess={handleSuccess}
          onError={handleError}
          onDataChange={refreshSummary}
        />

        <SectionMoodSummary onError={handleError} />

        <SectionPreCounselRead refreshToken={summaryRefreshKey} onError={handleError} />

        <SectionNoticeBoard onSuccess={handleSuccess} onError={handleError} />

        <SectionSuggestion
          refreshToken={summaryRefreshKey}
          onSuccess={handleSuccess}
          onError={handleError}
        />

      </div>

    </AppLayout>

  );

}


