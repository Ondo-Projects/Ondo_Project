import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import AuthLoading from '../auth/AuthLoading';
import AppLayout from '../components/layout/AppLayout';
import { PATHS } from '../routes/paths';
import ComingSoonSection from './components/ComingSoonSection';
import QuickActionBar from './components/QuickActionBar';
import SectionNotice from './components/SectionNotice';
import SectionSchoolCalendar from './components/SectionSchoolCalendar';
import SectionTimetable from './components/SectionTimetable';
import SectionToday from './components/SectionToday';
import { STUDENT_SECTIONS } from './constants';
import './student.css';
import { buildMealSchoolHint } from './studentUtils';
import { useStudentHashScroll } from './useStudentHashScroll';
import { useStudentSchoolLife } from './useStudentSchoolLife';

export default function StudentHomePage() {
  const { user, logout } = useAuth();
  const schoolLife = useStudentSchoolLife(Boolean(user));
  useStudentHashScroll();

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

        <div className="student-hero">
          <QuickActionBar />
          <SectionToday
            mealHint={mealHint}
            meals={schoolLife.meals}
            mealsError={schoolLife.mealsError}
            weather={schoolLife.weather}
            weatherError={schoolLife.weatherError}
          />
        </div>

        <div className="student-daily-grid">
          <ComingSoonSection
            id={STUDENT_SECTIONS.MOOD}
            title="마음 날씨"
            helper="하루에 한 번, 지금 마음 상태를 기록해 주세요."
          />
          <SectionNotice
            hasAssignment={schoolLife.hasAssignment}
            notices={schoolLife.notices}
            error={schoolLife.noticesError}
          />
          <SectionSchoolCalendar data={schoolLife.schedule} error={schoolLife.scheduleError} />
          <SectionTimetable data={schoolLife.timetable} error={schoolLife.timetableError} />
        </div>

        <div className="student-setup-grid">
          <ComingSoonSection
            id={STUDENT_SECTIONS.CLASS_PROFILE}
            title="학년 · 반"
            helper="시간표 등 학교생활 기능에 사용됩니다."
          />
          <ComingSoonSection
            id={STUDENT_SECTIONS.ASSIGNMENT}
            title="담당 교사"
            helper="교사가 알려준 초대 코드로 등록합니다."
          />
        </div>

        <div className="student-workspace">
          <ComingSoonSection
            id={STUDENT_SECTIONS.PRE_COUNSEL}
            title="사전 상담 카드"
            helper="상담 전에 나를 소개하는 카드를 작성합니다."
          />
          <ComingSoonSection
            id={STUDENT_SECTIONS.COUNSEL_CREATE}
            title="상담 신청"
            helper="담당 교사에게 상담을 요청합니다."
          />
          <ComingSoonSection
            id={STUDENT_SECTIONS.COUNSEL_LIST}
            title="내 상담"
            helper="작성한 상담 신청을 확인합니다."
          />
          <ComingSoonSection
            id={STUDENT_SECTIONS.SUGGESTION}
            title="운영 건의"
            helper="서비스 이용 중 불편한 점을 전달합니다."
          />
        </div>
      </div>
    </AppLayout>
  );
}
