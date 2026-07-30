import { useCallback, useState } from 'react';

import { Link } from 'react-router-dom';

import { useAuth } from '../auth/AuthProvider';

import AuthLoading from '../auth/AuthLoading';

import AppLayout from '../components/layout/AppLayout';

import { PATHS } from '../routes/paths';

import ComingSoonSection from './components/ComingSoonSection';

import QuickActionBar from './components/QuickActionBar';

import SectionInviteCode from './components/SectionInviteCode';

import SectionNotificationSettings from './components/SectionNotificationSettings';

import SectionTodaySummary from './components/SectionTodaySummary';

import { TEACHER_SECTIONS } from './constants';

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

      <div className="teacher-page">

        <header className="teacher-header">

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



        <div className="teacher-counsel-layout">

          <ComingSoonSection

            id={TEACHER_SECTIONS.POST_LIST}

            helper="담당 학생의 상담 신청 목록과 상태 필터입니다."

          />

          <ComingSoonSection

            id={TEACHER_SECTIONS.DETAIL_CARD}

            helper="상담 상세·상태 변경·교사 답변을 처리합니다."

          />

        </div>



        <ComingSoonSection

          id={TEACHER_SECTIONS.MOOD_SUMMARY}

          helper="담당 학생들의 오늘·주간 마음 날씨를 확인합니다."

        />



        <ComingSoonSection

          id={TEACHER_SECTIONS.PRE_COUNSEL_SUMMARY}

          helper="담당 학생이 작성한 사전 상담 카드를 열람합니다."

        />



        <ComingSoonSection

          id={TEACHER_SECTIONS.NOTICE_LIST}

          helper="담당 학생에게 공지할 알림을 작성합니다."

        />



        <ComingSoonSection

          id={TEACHER_SECTIONS.SUGGESTION}

          helper="서비스 버그·기능 개선·운영 문의를 운영팀에 남깁니다."

        />

      </div>

    </AppLayout>

  );

}


