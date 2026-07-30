import { Link } from 'react-router-dom';
import { PATHS } from '../../routes/paths';
import type { TeacherSummaryState } from '../useHomeData';

interface TeacherHomeBlockProps {
  summary: TeacherSummaryState;
}

export default function TeacherHomeBlock({ summary }: TeacherHomeBlockProps) {
  return (
    <section className="home-card home-role-block" aria-labelledby="teacher-home-title">
      <h2 id="teacher-home-title" className="home-role-block__title">
        오늘 확인할 것
      </h2>

      {summary.error ? (
        <div className="home-status">{summary.error}</div>
      ) : (
        <div className="home-summary-grid">
          <div className="home-summary-item home-summary-item--highlight">
            <div className="home-summary-item__label">미확인 상담</div>
            <div className="home-summary-item__value">{formatCount(summary.unreadCount)}</div>
            <p className="home-summary-item__hint">학생 답변·상태 변경 알림</p>
          </div>
          <div className="home-summary-item">
            <div className="home-summary-item__label">대기 중 상담</div>
            <div className="home-summary-item__value">{formatCount(summary.waitingCount)}</div>
            <p className="home-summary-item__hint">확정 전 상담 신청</p>
          </div>
          <div className="home-summary-item">
            <div className="home-summary-item__label">사전상담 미작성</div>
            <div className="home-summary-item__value">
              {formatCount(summary.preCounselPendingCount)}
            </div>
            <p className="home-summary-item__hint">담당 학생 중 미작성</p>
          </div>
        </div>
      )}

      <nav className="home-quick-links" aria-label="교사 빠른 이동">
        <Link className="home-btn home-btn--quick" to={`${PATHS.TEACHER}#postList`}>
          상담
        </Link>
        <Link className="home-btn home-btn--quick" to={`${PATHS.TEACHER}#moodSummaryList`}>
          마음
        </Link>
        <Link className="home-btn home-btn--quick" to={`${PATHS.TEACHER}#preCounselSummaryList`}>
          사전카드
        </Link>
      </nav>

      <div className="home-role-actions">
        <Link className="home-btn home-btn--primary" to={PATHS.TEACHER}>
          교사 홈 전체 보기
        </Link>
      </div>
    </section>
  );
}

function formatCount(value: number | null): string {
  return value === null ? '-' : String(value);
}
