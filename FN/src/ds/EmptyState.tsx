import type { ReactNode } from 'react';
import { cn } from './cn';

/** 데이터가 없을 때 — 큰 일러스트 없이 한두 줄로 */
export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-start gap-1 px-4 py-8 text-sm', className)}>
      <p className="font-medium text-gray-900">{title}</p>
      {description ? <p className="text-gray-500">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-gray-100', className)} aria-hidden />;
}
