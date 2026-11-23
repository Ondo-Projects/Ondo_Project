import { cn } from './cn';

export interface TabItem<T extends string> {
  value: T;
  label: string;
  /** 탭 옆 건수 */
  count?: number;
}

export interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** 밑줄형 탭 — 표 위 필터·구역 전환 */
export function Tabs<T extends string>({ items, value, onChange, className }: TabsProps<T>) {
  return (
    <div role="tablist" className={cn('flex gap-4 border-b border-gray-200', className)}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              '-mb-px flex h-9 items-center gap-1.5 border-b-2 text-[13px] font-medium transition-colors duration-150',
              active ? 'border-blue-700 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-900',
            )}
          >
            {item.label}
            {item.count !== undefined ? (
              <span className={cn('tabular-nums text-xs', active ? 'text-gray-900' : 'text-gray-400')}>
                {item.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
