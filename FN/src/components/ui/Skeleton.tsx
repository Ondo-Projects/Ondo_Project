import type { HTMLAttributes } from 'react';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'full' | 'none';
}

function skeletonClassName({
  rounded = 'md',
  className = '',
}: Pick<SkeletonProps, 'rounded' | 'className'>) {
  const roundedClass =
    rounded === 'full'
      ? 'ui-skeleton--round'
      : rounded === 'sm'
        ? 'ui-skeleton--sm'
        : rounded === 'none'
          ? 'ui-skeleton--square'
          : '';

  return ['ui-skeleton', roundedClass, className].filter(Boolean).join(' ');
}

export default function Skeleton({
  width,
  height,
  rounded = 'md',
  className,
  style,
  ...rest
}: SkeletonProps) {
  return (
    <div
      className={skeletonClassName({ rounded, className })}
      style={{
        width,
        height,
        ...style,
      }}
      aria-hidden="true"
      {...rest}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={['ui-skeleton-text', className].filter(Boolean).join(' ')}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          height="0.875rem"
          width={index === lines - 1 && lines > 1 ? '72%' : '100%'}
        />
      ))}
    </div>
  );
}
