import type { ReactNode } from 'react';
import { cn } from './cn';

/**
 * 상태 배지 — 색은 상태를 알려야 할 때만 씁니다.
 *  neutral: 기본 / solid: 강조(포인트 색) / success·warning·danger: 상태
 */
export type BadgeTone = 'neutral' | 'solid' | 'success' | 'warning' | 'danger';

const TONE: Record<BadgeTone, string> = {
  neutral: 'bg-gray-50 text-gray-700 border-gray-200',
  solid: 'bg-slate-900 text-white border-slate-900',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
};

const DOT: Record<BadgeTone, string> = {
  neutral: 'bg-gray-400',
  solid: 'bg-white',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
};

export interface BadgeProps {
  tone?: BadgeTone;
  /** 앞에 작은 점 표시 (상태 표시용) */
  dot?: boolean;
  className?: string;
  children: ReactNode;
}

export function Badge({ tone = 'neutral', dot = false, className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center gap-1 rounded border px-1.5 text-[11px] font-medium whitespace-nowrap',
        TONE[tone],
        className,
      )}
    >
      {dot ? <span className={cn('h-1.5 w-1.5 rounded-full', DOT[tone])} aria-hidden /> : null}
      {children}
    </span>
  );
}
