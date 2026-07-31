import type { HTMLAttributes, ReactNode } from 'react';

export type BadgeVariant =
  | 'student'
  | 'teacher'
  | 'admin'
  | 'pending'
  | 'inProgress'
  | 'completed'
  | 'neutral';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

const BADGE_VARIANT_CLASS: Record<BadgeVariant, string> = {
  student: 'ui-badge--student',
  teacher: 'ui-badge--teacher',
  admin: 'ui-badge--admin',
  pending: 'ui-badge--pending',
  inProgress: 'ui-badge--in-progress',
  completed: 'ui-badge--completed',
  neutral: 'ui-badge--neutral',
};

function badgeClassName({
  variant = 'neutral',
  className = '',
}: Pick<BadgeProps, 'variant' | 'className'>) {
  return ['ui-badge', BADGE_VARIANT_CLASS[variant], className].filter(Boolean).join(' ');
}

export default function Badge({
  variant = 'neutral',
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span className={badgeClassName({ variant, className })} {...rest}>
      {children}
    </span>
  );
}
