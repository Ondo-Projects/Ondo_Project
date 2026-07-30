import type { ReactNode } from 'react';

interface StudentSectionCardProps {
  id: string;
  title: string;
  helper?: string;
  children: ReactNode;
  compact?: boolean;
}

export default function StudentSectionCard({
  id,
  title,
  helper,
  children,
  compact = false,
}: StudentSectionCardProps) {
  return (
    <section
      id={id}
      className={`student-card${compact ? ' student-card--compact' : ''}`}
      aria-labelledby={`${id}-title`}
    >
      <h2 id={`${id}-title`} className="student-card__title">
        <span className="student-card__title-mark" aria-hidden="true" />
        {title}
      </h2>
      {helper ? <p className="student-card__helper">{helper}</p> : null}
      {children}
    </section>
  );
}
