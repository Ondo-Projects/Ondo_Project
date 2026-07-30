import { useState } from 'react';
import type { SchoolScheduleUpcomingResponse } from '../../api/types/home';
import { SCHEDULE_SUMMARY_LIMIT, STUDENT_SECTIONS } from '../constants';
import StudentSectionCard from './StudentSectionCard';
import {
  formatScheduleEventDate,
  mergeConsecutiveScheduleEvents,
  resolveScheduleStatus,
  scheduleDisplayMessage,
  scheduleStatusClass,
  truncateText,
} from '../studentUtils';

interface SectionSchoolCalendarProps {
  data: SchoolScheduleUpcomingResponse | null;
  error: string | null;
}

export default function SectionSchoolCalendar({ data, error }: SectionSchoolCalendarProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <StudentSectionCard
      id={STUDENT_SECTIONS.SCHOOL_CALENDAR}
      title="학사일정"
      helper="앞으로 2주간 학교 주요 행사입니다."
    >
      <ScheduleContent data={data} error={error} expanded={expanded} onToggle={() => setExpanded((value) => !value)} />
    </StudentSectionCard>
  );
}

function ScheduleContent({
  data,
  error,
  expanded,
  onToggle,
}: {
  data: SchoolScheduleUpcomingResponse | null;
  error: string | null;
  expanded: boolean;
  onToggle: () => void;
}) {
  if (error) {
    return <div className="student-status">{error}</div>;
  }
  if (!data) {
    return <div className="student-status">학사일정을 불러오는 중…</div>;
  }

  const status = resolveScheduleStatus(data);
  if (status !== 'OK' || !data.events?.length) {
    return (
      <div className={scheduleStatusClass(status)}>{scheduleDisplayMessage(data, status)}</div>
    );
  }

  const mergedEvents = mergeConsecutiveScheduleEvents(data.events);
  const needsExpand = mergedEvents.length > SCHEDULE_SUMMARY_LIMIT;
  const visibleEvents = needsExpand && !expanded
    ? mergedEvents.slice(0, SCHEDULE_SUMMARY_LIMIT)
    : mergedEvents;

  return (
    <div>
      {visibleEvents.map((event) =>
        expanded || !needsExpand ? (
          <article key={`${event.fromDate}-${event.eventName}`} className="student-schedule-item">
            <div className="student-schedule-item__date">{formatScheduleEventDate(event)}</div>
            <h3 className="student-schedule-item__title">{event.eventName}</h3>
            {event.eventContent ? (
              <p className="student-schedule-item__content">{event.eventContent}</p>
            ) : null}
          </article>
        ) : (
          <p key={`${event.fromDate}-${event.eventName}`} className="student-summary-line">
            <strong>{formatScheduleEventDate(event)}</strong>{' '}
            {truncateText(event.eventName, 40)}
          </p>
        ),
      )}
      {needsExpand ? (
        <button type="button" className="student-expand-btn" onClick={onToggle}>
          {expanded ? '접기' : `전체 ${mergedEvents.length}건 보기`}
        </button>
      ) : null}
      {data.message ? <p className="student-card__helper">{data.message}</p> : null}
    </div>
  );
}
