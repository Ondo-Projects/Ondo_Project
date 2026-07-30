import type { ReactNode } from 'react';

interface TeacherSectionCardProps {
  id?: string;
  title: string;
  helper?: string;
  children: ReactNode;
  compact?: boolean;
}

export default function TeacherSectionCard({
  id,
  title,
  helper,
  children,
  compact = false,
}: TeacherSectionCardProps) {
  return (
    <section
      id={id}
      className={`teacher-card${compact ? ' teacher-card--compact' : ''}`}
      aria-labelledby={id ? `${id}-title` : undefined}
    >
      <h2 id={id ? `${id}-title` : undefined} className="teacher-card__title">
        {title}
      </h2>
      {helper ? <p className="teacher-card__helper">{helper}</p> : null}
      {children}
    </section>
  );
}
