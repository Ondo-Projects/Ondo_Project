import { type ReactNode, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from './cn';

/**
 * 상세 보기 시트 — 모바일은 아래에서 올라오고, 넓은 화면은 오른쪽에 붙습니다.
 * Esc·바깥 누르기로 닫히고, 열려 있는 동안 뒤 화면 스크롤을 막습니다.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [onClose, open]);

  if (!open) return null;

  return createPortal(
    <div className="ondo-ui fixed inset-0 z-50 flex items-end justify-center sm:items-stretch sm:justify-end">
      <button type="button" aria-label="닫기" className="absolute inset-0 bg-gray-900/30" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[85vh] w-full flex-col rounded-t-lg border border-gray-200 bg-white outline-none',
          'sm:max-h-none sm:max-w-md sm:rounded-none sm:border-y-0 sm:border-r-0',
          className,
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-gray-200 px-4 py-3">
          <div className="min-w-0">
            <h2 id={titleId} className="text-[15px] leading-snug font-semibold text-gray-900">
              {title}
            </h2>
            {description ? <p className="mt-0.5 text-xs text-gray-500">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
            aria-label="닫기"
          >
            <X size={18} aria-hidden />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
