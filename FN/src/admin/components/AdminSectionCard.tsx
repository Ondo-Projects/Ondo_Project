import type { ReactNode } from 'react';
import { Card } from '../../components/ui';

interface AdminSectionCardProps {
  id?: string;
  title: string;
  helper?: string;
  children: ReactNode;
}

export default function AdminSectionCard({ id, title, helper, children }: AdminSectionCardProps) {
  return (
    <Card
      id={id}
      title={title}
      titleId={id ? `${id}-title` : undefined}
      helper={helper}
      titleMark
      aria-labelledby={id ? `${id}-title` : undefined}
    >
      {children}
    </Card>
  );
}
