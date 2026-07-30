import { TEACHER_SECTION_LABELS } from '../constants';

interface ComingSoonSectionProps {
  id: string;
  title?: string;
  helper?: string;
}

export default function ComingSoonSection({ id, title, helper }: ComingSoonSectionProps) {
  const resolvedTitle = title ?? TEACHER_SECTION_LABELS[id] ?? '준비 중';
  const resolvedHelper = helper ?? '다음 단계에서 Thymeleaf 화면을 React로 이전합니다.';

  return (
    <section id={id} className="teacher-card teacher-card--compact" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="teacher-card__title">
        {resolvedTitle}
      </h2>
      <p className="teacher-card__helper">{resolvedHelper}</p>
      <p className="teacher-status">다음 단계에서 구현 예정</p>
    </section>
  );
}
