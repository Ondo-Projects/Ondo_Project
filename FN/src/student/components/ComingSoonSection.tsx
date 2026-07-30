import StudentSectionCard from './StudentSectionCard';

interface ComingSoonSectionProps {
  id: string;
  title: string;
  helper: string;
}

export default function ComingSoonSection({ id, title, helper }: ComingSoonSectionProps) {
  return (
    <StudentSectionCard id={id} title={title} helper={helper} compact>
      <p className="student-status student-status--info">다음 단계에서 이 기능을 이전할 예정이에요.</p>
    </StudentSectionCard>
  );
}
