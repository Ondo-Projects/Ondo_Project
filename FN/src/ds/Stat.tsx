import type { ReactNode } from 'react';
import { cn } from './cn';

export interface StatItem {
  label: string;
  value: ReactNode;
  /** 값 옆 보조 설명 (예: "어제보다 2건 증가") */
  hint?: ReactNode;
}

/** 핵심 지표 한 줄 — 카드 여러 개 대신 세로선으로 나눈 하나의 띠 */
export function StatStrip({ items, className }: { items: StatItem[]; className?: string }) {
  return (
    <dl
      className={cn(
        'grid grid-cols-2 divide-gray-200 rounded-lg border border-gray-200 bg-white md:grid-cols-[repeat(auto-fit,minmax(160px,1fr))]',
        '[&>*]:border-gray-200 [&>*:nth-child(odd)]:border-r [&>*:nth-child(n+3)]:border-t md:[&>*]:border-r md:[&>*:nth-child(n+3)]:border-t-0 md:[&>*:last-child]:border-r-0',
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="px-4 py-3">
          <dt className="text-xs text-gray-500">{item.label}</dt>
          <dd className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-semibold tracking-tight text-gray-900 tabular-nums">{item.value}</span>
            {item.hint ? <span className="text-xs text-gray-500">{item.hint}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}
