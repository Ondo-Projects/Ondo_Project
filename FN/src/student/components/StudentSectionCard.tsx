import type { ReactNode } from 'react';
import { Card } from '../../components/ui';

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
    <Card
      id={id}
      title={title}
      titleId={`${id}-title`}
      helper={helper}
      titleMark
      compact={compact}
      aria-labelledby={`${id}-title`}
    >
      {children}
    </Card>
  );
}
