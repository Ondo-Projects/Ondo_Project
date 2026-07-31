import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import type { StudentAssignment } from '../api/types/student';
import { useAuth } from '../auth/AuthProvider';
import AuthLoading from '../auth/AuthLoading';
import AppLayout from '../components/layout/AppLayout';
import PageHeader from '../components/PageHeader';
import RoleHomeZone from '../components/RoleHomeZone';
import { Alert } from '../components/ui';
import { usePageTitle } from '../hooks/usePageTitle';
import { PATHS } from '../routes/paths';
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
    reloadWorkspace,
    applyAssignment,
    ...schoolLife
  } = useStudentSchoolLife(Boolean(user));
  const [workspaceTab, setWorkspaceTab] = useState<StudentWorkspaceTab>('pre-counsel');
  const [assignmentOpenRequest, setAssignmentOpenRequest] = useState(0);
  const [preCounselNavRequest, setPreCounselNavRequest] = useState(0);
  const [pageSuccess, setPageSuccess] = useState<string | null>(null);
  const [sectionError, setSectionError] = useState<string | null>(null);

  const refreshWorkspace = useCallback(() => {
    void reloadWorkspace();
  }, [reloadWorkspace]);

  const { items: todayTodoItems } = useStudentTodayTodo(schoolLife);

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
      refreshWorkspace();
    },
    [refreshWorkspace],
  );

  const handleError = useCallback((message: string) => {
    setPageSuccess(null);
    setSectionError(message);
  }, []);

  const handleProfileChanged = useCallback(async () => {
    await reloadTimetable();
    refreshWorkspace();
  }, [reloadTimetable, refreshWorkspace]);

  const handleAssignmentChanged = useCallback(
    async (assignment: StudentAssignment) => {
      await applyAssignment(assignment);
      refreshWorkspace();
    },
    [applyAssignment, refreshWorkspace],
  );

  const handleCounselingCreated = useCallback(() => {
    refreshWorkspace();
    setWorkspaceTab('counsel-list');
    window.setTimeout(() => {
      scrollToStudentSection(STUDENT_SECTIONS.COUNSEL_LIST);
    }, 0);
  }, [refreshWorkspace]);

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
        <PageHeader
          tone="student"
          eyebrow={schoolLife.isLoading ? '불러오는 중…' : `${greetingName} · ${schoolLabel}`}
          title="학생 홈"
          subtitle="오늘 할 일을 확인하고 상담까지 이어서 진행하세요."
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

        {schoolLife.pageError ? <Alert variant="error">{schoolLife.pageError}</Alert> : null}

        {sectionError ? <Alert variant="error">{sectionError}</Alert> : null}

        {pageSuccess ? <Alert variant="success">{pageSuccess}</Alert> : null}

        <SectionTodayTodo items={todayTodoItems} onNavigate={navigateToSection} />

        <RoleHomeZone
          badge="SCHOOL LIFE"
          title="학교 생활"
          description="급식·날씨, 마음 날씨, 공지, 학사 일정, 시간표를 살펴보세요."
          tone="student"
        >
          <SectionToday
            mealHint={mealHint}
            meals={schoolLife.meals}
            mealsError={schoolLife.mealsError}
            weather={schoolLife.weather}
            weatherError={schoolLife.weatherError}
          />
          <div className="student-daily-grid">
            <SectionMood
              prefetchedMood={schoolLife.todayMood}
              moodLoaded={schoolLife.workspaceLoaded}
              onSuccess={handleSuccess}
              onError={handleError}
            />
            <SectionNotice
              hasAssignment={schoolLife.hasAssignment}
              notices={schoolLife.notices}
              error={schoolLife.noticesError}
            />
            <SectionSchoolCalendar data={schoolLife.schedule} error={schoolLife.scheduleError} />
            <SectionTimetable data={schoolLife.timetable} error={schoolLife.timetableError} />
          </div>
        </RoleHomeZone>

        <RoleHomeZone
          badge="SETUP"
          title="내 정보 설정"
          description="학급 프로필과 담임 선생님 등록을 관리하세요."
          tone="student"
        >
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
        </RoleHomeZone>

        <RoleHomeZone
          badge="COUNSEL"
          title="상담"
          description="사전 상담, 상담 신청, 내역을 이어서 진행하세요."
          tone="student"
        >
          <div className="student-workspace">
            <StudentWorkspaceTabs activeTab={workspaceTab} onChange={handleWorkspaceTabChange} />

            <div className={workspaceTab === 'pre-counsel' ? undefined : 'student-tab-hidden'}>
              <SectionPreCounsel
                prefetchedProfile={schoolLife.preCounselProfile}
                profileLoaded={schoolLife.workspaceLoaded}
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
                prefetchedPosts={schoolLife.counselingPosts}
                postsLoaded={schoolLife.workspaceLoaded}
                onSuccess={handleSuccess}
                onError={handleError}
              />
            </div>
          </div>
        </RoleHomeZone>

        <RoleHomeZone badge="FEEDBACK" title="의견 보내기" tone="student">
          <SectionSuggestion
            prefetchedSuggestions={schoolLife.suggestions}
            suggestionsLoaded={schoolLife.workspaceLoaded}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        </RoleHomeZone>
      </div>
    </AppLayout>
  );
}
