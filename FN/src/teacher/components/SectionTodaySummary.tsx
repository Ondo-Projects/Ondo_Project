import type { TeacherDashboardSummary } from '../useTeacherDashboard';
import { TEACHER_SECTIONS } from '../constants';
import TeacherSectionCard from './TeacherSectionCard';

interface SectionTodaySummaryProps {
  summary: TeacherDashboardSummary;
  onNavigate: (sectionId: string) => void;
}

export default function SectionTodaySummary({ summary, onNavigate }: SectionTodaySummaryProps) {
  const unreadDisplay = formatCount(summary.unreadCount);
  const waitingDisplay = formatCount(summary.waitingCount);
  const preCounselDisplay = formatCount(summary.preCounselPendingCount);
  const showUnreadBadge =
    summary.unreadCount !== null && summary.unreadCount > 0 ? summary.unreadCount : null;

  return (
    <TeacherSectionCard id={TEACHER_SECTIONS.TODAY_SUMMARY} title="오늘 확인할 것">
      {summary.error ? <p className="teacher-status">{summary.error}</p> : null}

      <div className="teacher-summary-grid">
        <div className="teacher-summary-item teacher-summary-item--highlight">
          <div className="teacher-summary-item__label">
            미확인 상담
            {showUnreadBadge ? (
              <span className="teacher-unread-badge">{showUnreadBadge}</span>
            ) : null}
          </div>
          <div className="teacher-summary-item__value">{unreadDisplay}</div>
          <p className="teacher-summary-item__hint">학생 답변·상태 변경 알림</p>
        </div>

        <div className="teacher-summary-item">
          <div className="teacher-summary-item__label">대기 중 상담</div>
          <div className="teacher-summary-item__value">{waitingDisplay}</div>
          <p className="teacher-summary-item__hint">확정 전 상담 신청</p>
        </div>

        <div className="teacher-summary-item">
          <div className="teacher-summary-item__label">사전상담 미작성</div>
          <div className="teacher-summary-item__value">{preCounselDisplay}</div>
          <p className="teacher-summary-item__hint">담당 학생 중 미작성</p>
        </div>

        <button
          type="button"
          className={`teacher-summary-item teacher-summary-item--action${
            summary.suggestion.highlight ? ' teacher-summary-item--highlight' : ''
          }`}
          aria-label="운영 건의 섹션으로 이동"
          onClick={() => onNavigate(TEACHER_SECTIONS.SUGGESTION)}
        >
          <div className="teacher-summary-item__label">운영 건의</div>
          <div className="teacher-summary-item__value">{summary.suggestion.count}</div>
          <p className="teacher-summary-item__hint">{summary.suggestion.hint}</p>
        </button>
      </div>
    </TeacherSectionCard>
  );
}

function formatCount(value: number | null): string {
  if (value === null) {
    return summaryLoadingLabel();
  }
  return String(value);
}

function summaryLoadingLabel(): string {
  return '-';
}
