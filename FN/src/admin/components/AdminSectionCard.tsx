import type { ReactNode } from 'react';

interface AdminSectionCardProps {
  id?: string;
  title: string;
  helper?: string;
  children: ReactNode;
}

export default function AdminSectionCard({ id, title, helper, children }: AdminSectionCardProps) {
  return (
    <section
      id={id}
      className="admin-card"
      aria-labelledby={id ? `${id}-title` : undefined}
    >
      <h2 id={id ? `${id}-title` : undefined} className="admin-card__title">
        {title}
      </h2>
      {helper ? <p className="admin-card__helper">{helper}</p> : null}
      {children}
    </section>
  );
}
