import type { ReactNode } from 'react';
import './role-home-zone.css';

export type RoleHomeZoneTone = 'student' | 'teacher';

interface RoleHomeZoneProps {
  badge: string;
  title: string;
  description?: string;
  tone?: RoleHomeZoneTone;
  children: ReactNode;
}

export default function RoleHomeZone({
  badge,
  title,
  description,
  tone = 'student',
  children,
}: RoleHomeZoneProps) {
  return (
    <section className={`role-home-zone role-home-zone--${tone}`}>
      <div className="role-home-zone__head">
        <span className="role-home-zone__badge">{badge}</span>
        <h2 className="role-home-zone__title">{title}</h2>
        {description ? <p className="role-home-zone__desc">{description}</p> : null}
      </div>
      <div className="role-home-zone__body">{children}</div>
    </section>
  );
}
