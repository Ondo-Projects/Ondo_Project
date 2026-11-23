import type { ReactNode } from 'react';
import { cn } from '../../ds';

/** 회색 화면 위 흰 묶음 — 제목은 묶음 바깥 위쪽에 작게 (iOS 설정 앱 방식) */
export function Block({
  title,
  action,
  footer,
  flush = false,
  className,
  children,
}: {
  title?: ReactNode;
  /** 제목 줄 오른쪽 (예: "전체 보기") */
  action?: ReactNode;
  footer?: ReactNode;
  /** 안쪽 여백 없이 (리스트를 꽉 채울 때) */
  flush?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={className}>
      {title || action ? (
        <div className="flex items-end justify-between gap-2 px-1 pb-1.5">
          {title ? <h2 className="text-[13px] font-semibold text-gray-500">{title}</h2> : <span />}
          {action}
        </div>
      ) : null}
      <div className={cn('overflow-hidden rounded-lg border border-gray-200 bg-white', !flush && 'p-4')}>
        {children}
      </div>
      {footer ? <p className="px-1 pt-1.5 text-xs leading-relaxed text-gray-500">{footer}</p> : null}
    </section>
  );
}

/** 상태 안내 한 줄 (급식 없음, 연동 준비 중 등) */
export function StatusText({ tone = 'muted', children }: { tone?: 'muted' | 'warn'; children: ReactNode }) {
  return (
    <p className={cn('text-[13px] leading-relaxed', tone === 'warn' ? 'text-amber-800' : 'text-gray-500')}>
      {children}
    </p>
  );
}

/** 화면 아래 고정 저장 버튼 자리 — 하단 탭 위에 붙음 */
export function StickyFooter({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 -mx-4 mt-2 border-t border-gray-200 bg-gray-100/95 px-4 py-3 backdrop-blur-sm">
      {children}
    </div>
  );
}
