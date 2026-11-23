import type { ReactNode } from 'react';
import { cn } from './cn';

export interface PanelProps {
  title?: ReactNode;
  description?: ReactNode;
  /** 오른쪽 위 버튼·링크 */
  actions?: ReactNode;
  /** 본문 여백 없이 (표·리스트를 꽉 채울 때) */
  flush?: boolean;
  className?: string;
  children: ReactNode;
}

/** 1px 테두리 구역 — 카드처럼 띄우지 않고 화면을 나누는 용도 */
export function Panel({ title, description, actions, flush = false, className, children }: PanelProps) {
  return (
    <section className={cn('rounded-lg border border-gray-200 bg-white', className)}>
      {title || actions ? (
        <header className="flex min-h-11 items-center justify-between gap-3 border-b border-gray-200 px-4 py-2.5">
          <div className="min-w-0">
            {title ? <h2 className="truncate text-sm font-semibold text-gray-900">{title}</h2> : null}
            {description ? <p className="truncate text-xs text-gray-500">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-1.5">{actions}</div> : null}
        </header>
      ) : null}
      <div className={flush ? undefined : 'p-4'}>{children}</div>
    </section>
  );
}

/** 페이지 상단 제목 줄 */
export function PageTitle({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-gray-200 pb-4">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-gray-900">{title}</h1>
        {description ? <p className="mt-1 text-sm text-gray-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
