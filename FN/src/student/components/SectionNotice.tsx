import type { StudentNotice } from '../../api/types/student';
import { STUDENT_SECTIONS } from '../constants';
import { formatDateTime } from '../studentUtils';
import StudentSectionCard from './StudentSectionCard';

interface SectionNoticeProps {
  hasAssignment: boolean;
  notices: StudentNotice[] | null;
  error: string | null;
}

export default function SectionNotice({ hasAssignment, notices, error }: SectionNoticeProps) {
  const helper = hasAssignment
    ? '담당 교사가 보낸 알림입니다.'
    : '담당 교사 등록 후 알림을 확인할 수 있습니다.';

  return (
    <StudentSectionCard id={STUDENT_SECTIONS.NOTICE} title="선생님 알림" helper={helper}>
      <NoticeContent hasAssignment={hasAssignment} notices={notices} error={error} />
    </StudentSectionCard>
  );
}

function NoticeContent({
  hasAssignment,
  notices,
  error,
}: {
  hasAssignment: boolean;
  notices: StudentNotice[] | null;
  error: string | null;
}) {
  if (!hasAssignment) {
    return (
      <div className="student-status student-status--info">
        담당 교사 등록 후 알림을 확인할 수 있습니다.
      </div>
    );
  }

  if (error) {
    return <div className="student-status">{error}</div>;
  }

  if (!notices) {
    return <div className="student-status">알림을 불러오는 중…</div>;
  }

  if (!notices.length) {
    return <div className="student-status">등록된 알림이 없습니다.</div>;
  }

  return (
    <div className="student-notice-list">
      {notices.map((notice) => (
        <article key={notice.id} className="student-notice-item">
          <h3>{notice.title}</h3>
          <p className="student-notice-item__meta">
            {formatDateTime(notice.createdAt)} · {notice.teacherName || notice.teacherUsername}
          </p>
          <p className="student-notice-item__content">{notice.content}</p>
        </article>
      ))}
    </div>
  );
}
