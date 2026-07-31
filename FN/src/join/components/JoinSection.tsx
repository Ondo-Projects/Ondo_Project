import type { ReactNode } from 'react';

interface JoinSectionProps {
  title: string;
  children: ReactNode;
  hidden?: boolean;
}

export default function JoinSection({ title, children, hidden = false }: JoinSectionProps) {
  if (hidden) {
    return null;
  }

  return (
    <section className="join-section">
      <h2 className="join-section__title">{title}</h2>
      {children}
    </section>
  );
}
