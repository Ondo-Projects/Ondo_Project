import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from './cn';

/** "총 N건 · 1/3" + 이전·다음 — Table 의 footer 안에 넣어 씁니다. page 는 0부터 */
export function Pagination({
  page,
  size,
  total,
  onChange,
  disabled,
  className,
}: {
  page: number;
  size: number;
  total: number;
  onChange: (page: number) => void;
  disabled?: boolean;
  className?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / size));
  const button =
    'inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent';
  return (
    <div className={cn('flex w-full items-center justify-between gap-3', className)}>
      <span className="tabular-nums">총 {total.toLocaleString('ko-KR')}건</span>
      <div className="flex items-center gap-1">
        <span className="mr-1 tabular-nums">
          {page + 1} / {totalPages}
        </span>
        <button
          type="button"
          className={button}
          disabled={disabled || page <= 0}
          onClick={() => onChange(page - 1)}
          aria-label="이전 페이지"
        >
          <ChevronLeft size={16} aria-hidden />
        </button>
        <button
          type="button"
          className={button}
          disabled={disabled || page + 1 >= totalPages}
          onClick={() => onChange(page + 1)}
          aria-label="다음 페이지"
        >
          <ChevronRight size={16} aria-hidden />
        </button>
      </div>
    </div>
  );
}
