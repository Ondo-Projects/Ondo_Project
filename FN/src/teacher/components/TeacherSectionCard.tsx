import type { ReactNode } from 'react';
import { Card } from '../../components/ui';

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
    <Card
      id={id}
      title={title}
      titleId={id ? `${id}-title` : undefined}
      helper={helper}
      titleMark
      compact={compact}
      aria-labelledby={id ? `${id}-title` : undefined}
    >
      {children}
    </Card>
  );
}
