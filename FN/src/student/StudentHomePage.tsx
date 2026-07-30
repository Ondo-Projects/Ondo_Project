import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import type { StudentAssignment } from '../api/types/student';
import { useAuth } from '../auth/AuthProvider';
import AuthLoading from '../auth/AuthLoading';
import AppLayout from '../components/layout/AppLayout';
import BrandMark from '../components/BrandMark';
import { usePageTitle } from '../hooks/usePageTitle';
import { PATHS } from '../routes/paths';
import QuickActionBar from './components/QuickActionBar';
import SectionAssignment from './components/SectionAssignment';
import SectionClassProfile from './components/SectionClassProfile';
import SectionCounselCreate from './components/SectionCounselCreate';
import SectionCounselList from './components/SectionCounselList';
import SectionMood from './components/SectionMood';
import SectionNotice from './components/SectionNotice';
import SectionPreCounsel from './components/SectionPreCounsel';
import SectionSchoolCalendar from './components/SectionSchoolCalendar';
import SectionSuggestion from './components/SectionSuggestion';
import SectionTimetable from './components/SectionTimetable';
import SectionToday from './components/SectionToday';
import SectionTodayTodo from './components/SectionTodayTodo';
import StudentWorkspaceTabs from './components/StudentWorkspaceTabs';
import {
  resolveWorkspaceTabForSection,
  type StudentWorkspaceTab,
} from './counselingLabels';
import { STUDENT_SECTIONS } from './constants';
import './student.css';
import { buildMealSchoolHint, scrollToStudentSection } from './studentUtils';
import { useStudentHashScroll } from './useStudentHashScroll';
import { useStudentSchoolLife } from './useStudentSchoolLife';
import { useStudentTodayTodo } from './useStudentTodayTodo';

export default function StudentHomePage() {
  const { user, logout } = useAuth();
  usePageTitle('학생 홈 | 온도');
  const {
    reloadTimetable,
    applyAssignment,
    ...schoolLife
  } = useStudentSchoolLife(Boolean(user));
  const [workspaceTab, setWorkspaceTab] = useState<StudentWorkspaceTab>('pre-counsel');
  const [counselRefreshKey, setCounselRefreshKey] = useState(0);
  const [todoRefreshKey, setTodoRefreshKey] = useState(0);
  const [assignmentOpenRequest, setAssignmentOpenRequest] = useState(0);
  const [preCounselNavRequest, setPreCounselNavRequest] = useState(0);
  const [pageSuccess, setPageSuccess] = useState<string | null>(null);
  const [sectionError, setSectionError] = useState<string | null>(null);

  const refreshTodo = useCallback(() => {
    setTodoRefreshKey((key) => key + 1);
  }, []);

  const { items: todayTodoItems } = useStudentTodayTodo(
    schoolLife,
    Boolean(user),
    todoRefreshKey,
  );

  const navigateToSection = useCallback((sectionId: string) => {
    const tab = resolveWorkspaceTabForSection(sectionId);
    if (tab) {
      setWorkspaceTab(tab);
    }
    if (sectionId === STUDENT_SECTIONS.ASSIGNMENT) {
      setAssignmentOpenRequest((value) => value + 1);
    }
    if (sectionId === STUDENT_SECTIONS.PRE_COUNSEL) {
      setPreCounselNavRequest((value) => value + 1);
    }
    scrollToStudentSection(sectionId);
  }, []);

  useStudentHashScroll(navigateToSection);

  const handleSuccess = useCallback(
    (message: string) => {
      setSectionError(null);
      setPageSuccess(message);
      refreshTodo();
    },
    [refreshTodo],
  );

  const handleError = useCallback((message: string) => {
    setPageSuccess(null);
    setSectionError(message);
  }, []);

  const handleProfileChanged = useCallback(async () => {
    await reloadTimetable();
    refreshTodo();
  }, [reloadTimetable, refreshTodo]);

  const handleAssignmentChanged = useCallback(
    async (assignment: StudentAssignment) => {
      await applyAssignment(assignment);
      refreshTodo();
    },
    [applyAssignment, refreshTodo],
  );

  const handleCounselingCreated = useCallback(() => {
    setCounselRefreshKey((key) => key + 1);
    refreshTodo();
    setWorkspaceTab('counsel-list');
    window.setTimeout(() => {
      scrollToStudentSection(STUDENT_SECTIONS.COUNSEL_LIST);
    }, 0);
  }, [refreshTodo]);

  const handleWorkspaceTabChange = useCallback((tab: StudentWorkspaceTab) => {
    setWorkspaceTab(tab);
    const sectionId =
      tab === 'pre-counsel'
        ? STUDENT_SECTIONS.PRE_COUNSEL
        : tab === 'counsel-create'
          ? STUDENT_SECTIONS.COUNSEL_CREATE
          : STUDENT_SECTIONS.COUNSEL_LIST;
    window.setTimeout(() => {
      scrollToStudentSection(sectionId);
    }, 0);
  }, []);

  if (!user) {
    return <AuthLoading message="학생 홈을 준비하고 있어요" />;
  }

  const greetingName = user.name?.trim() || user.username;
  const schoolLabel = user.schoolName?.trim() || '학교 미등록';
  const mealHint = buildMealSchoolHint(
    schoolLife.schoolProfile?.schoolName ?? user.schoolName,
    schoolLife.schoolProfile?.region ?? user.schoolRegion,
  );

  return (
    <AppLayout>
      <div className="student-page">
        <header className="student-header">
          <BrandMark />
          <div className="student-header__main">
            <p className="student-greeting">
              {schoolLife.isLoading ? '불러오는 중…' : `${greetingName} · ${schoolLabel}`}
            </p>
            <h1 className="student-title">학생 홈</h1>
            <p className="student-subtitle">오늘 할 일부터 확인하고 상담까지 이어서 진행하세요.</p>
          </div>
          <div className="student-header__actions">
            <Link className="student-btn student-btn--ghost" to={PATHS.HOME}>
              공통 홈
            </Link>
            <Link className="student-btn student-btn--ghost" to={PATHS.WITHDRAW}>
              회원 탈퇴
            </Link>
            <button type="button" className="student-btn student-btn--secondary" onClick={() => logout()}>
              로그아웃
            </button>
          </div>
        </header>

        {schoolLife.pageError ? (
          <p className="student-message student-message--error" role="alert">
            {schoolLife.pageError}
          </p>
        ) : null}

        {sectionError ? (
          <p className="student-message student-message--error" role="alert">
            {sectionError}
          </p>
        ) : null}

        {pageSuccess ? (
          <p className="student-message student-message--success" role="status">
            {pageSuccess}
          </p>
        ) : null}

        <div className="student-hero">
          <QuickActionBar onNavigate={navigateToSection} />
          <SectionTodayTodo items={todayTodoItems} onNavigate={navigateToSection} />
          <SectionToday
            mealHint={mealHint}
            meals={schoolLife.meals}
            mealsError={schoolLife.mealsError}
            weather={schoolLife.weather}
            weatherError={schoolLife.weatherError}
          />
        </div>

        <div className="student-daily-grid">
          <SectionMood onSuccess={handleSuccess} onError={handleError} />
          <SectionNotice
            hasAssignment={schoolLife.hasAssignment}
            notices={schoolLife.notices}
            error={schoolLife.noticesError}
          />
          <SectionSchoolCalendar data={schoolLife.schedule} error={schoolLife.scheduleError} />
          <SectionTimetable data={schoolLife.timetable} error={schoolLife.timetableError} />
        </div>

        <div className="student-setup-grid">
          <SectionClassProfile
            onSuccess={handleSuccess}
            onError={handleError}
            onProfileChanged={handleProfileChanged}
          />
          <SectionAssignment
            assignment={schoolLife.assignment}
            openRequest={assignmentOpenRequest}
            onSuccess={handleSuccess}
            onError={handleError}
            onAssignmentChanged={handleAssignmentChanged}
          />
        </div>

        <div className="student-workspace">
          <StudentWorkspaceTabs activeTab={workspaceTab} onChange={handleWorkspaceTabChange} />

          <div className={workspaceTab === 'pre-counsel' ? undefined : 'student-tab-hidden'}>
            <SectionPreCounsel
              navFocusToken={preCounselNavRequest}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          </div>

          <div className={workspaceTab === 'counsel-create' ? undefined : 'student-tab-hidden'}>
            <SectionCounselCreate
              hasAssignment={schoolLife.hasAssignment}
              onSuccess={handleSuccess}
              onError={handleError}
              onCreated={handleCounselingCreated}
            />
          </div>

          <div className={workspaceTab === 'counsel-list' ? undefined : 'student-tab-hidden'}>
            <SectionCounselList
              isActive={workspaceTab === 'counsel-list'}
              refreshToken={counselRefreshKey}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          </div>
        </div>

        <SectionSuggestion onSuccess={handleSuccess} onError={handleError} />
      </div>
    </AppLayout>
  );
}
