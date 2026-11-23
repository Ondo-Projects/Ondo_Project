import type { ReactNode } from 'react';
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { cn } from './cn';

export type NoticeTone = 'info' | 'success' | 'danger';

const TONE: Record<NoticeTone, string> = {
  info: 'border-gray-200 bg-white text-gray-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  danger: 'border-red-200 bg-red-50 text-red-800',
};

const ICON = { info: Info, success: CircleCheck, danger: CircleAlert } as const;

/** 한 줄 안내·결과 메시지 (저장됨, 오류 등) */
export function Notice({
  tone = 'info',
  onClose,
  className,
  children,
}: {
  tone?: NoticeTone;
  onClose?: () => void;
  className?: string;
  children: ReactNode;
}) {
  const Icon = ICON[tone];
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('flex items-start gap-2 rounded-md border px-3 py-2 text-[13px]', TONE[tone], className)}
    >
      <Icon size={16} className="mt-px shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">{children}</div>
      {onClose ? (
        <button type="button" onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100" aria-label="닫기">
          <X size={16} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
