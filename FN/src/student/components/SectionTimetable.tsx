import { useState } from 'react';
import type { TimetableDayResponse } from '../../api/types/home';
import { CardHelper } from '../../components/ui';
import { TIMETABLE_SUMMARY_LIMIT, STUDENT_SECTIONS } from '../constants';
import StudentSectionCard from './StudentSectionCard';
import {
  buildTimetableProfileHint,
  resolveTimetableStatus,
  timetableDisplayMessage,
  timetableStatusClass,
  truncateText,
} from '../studentUtils';

interface SectionTimetableProps {
  data: TimetableDayResponse | null;
  error: string | null;
}

export default function SectionTimetable({ data, error }: SectionTimetableProps) {
  const [expanded, setExpanded] = useState(false);
  const profileHint = data ? buildTimetableProfileHint(data) : '학년·반이 등록되면 오늘 수업을 확인할 수 있습니다.';

  return (
    <StudentSectionCard
      id={STUDENT_SECTIONS.TIMETABLE}
      title="오늘 시간표"
      helper={profileHint}
    >
      <TimetableContent
        data={data}
        error={error}
        expanded={expanded}
        onToggle={() => setExpanded((value) => !value)}
      />
    </StudentSectionCard>
  );
}

function TimetableContent({
  data,
  error,
  expanded,
  onToggle,
}: {
  data: TimetableDayResponse | null;
  error: string | null;
  expanded: boolean;
  onToggle: () => void;
}) {
  if (error) {
    return <div className="student-status">{error}</div>;
  }
  if (!data) {
    return <div className="student-status">시간표를 불러오는 중…</div>;
  }

  const status = resolveTimetableStatus(data);
  if (status !== 'OK' || !data.periods?.length) {
    return (
      <div className={timetableStatusClass(status)}>{timetableDisplayMessage(data, status)}</div>
    );
  }

  const periods = data.periods;
  const needsExpand = periods.length > TIMETABLE_SUMMARY_LIMIT;
  const visiblePeriods = needsExpand && !expanded
    ? periods.slice(0, TIMETABLE_SUMMARY_LIMIT)
    : periods;

  return (
    <div>
      {visiblePeriods.map((period) =>
        expanded || !needsExpand ? (
          <article key={period.period} className="student-timetable-item">
            <div className="student-timetable-item__period">{period.period}</div>
            <div>
              <p className="student-timetable-item__subject">{period.subject}</p>
              {period.classroom ? (
                <p className="student-timetable-item__classroom">{period.classroom}</p>
              ) : null}
            </div>
          </article>
        ) : (
          <p key={period.period} className="student-summary-line">
            <strong>{period.period}교시</strong> {truncateText(period.subject, 24)}
          </p>
        ),
      )}
      {needsExpand ? (
        <button type="button" className="student-expand-btn" onClick={onToggle}>
          {expanded ? '접기' : `전체 ${periods.length}교시 보기`}
        </button>
      ) : null}
      {data.message ? <CardHelper>{data.message}</CardHelper> : null}
    </div>
  );
}
