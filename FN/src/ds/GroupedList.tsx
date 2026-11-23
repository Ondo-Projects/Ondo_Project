import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from './cn';

/**
 * 모바일 설정 화면용 그룹 리스트 (iOS/Android 설정 앱 스타일)
 * bg-gray-100 화면 위에 흰 박스 하나, 행은 divide-y 로 나눔
 */
export function ListGroup({
  title,
  footer,
  className,
  children,
}: {
  title?: string;
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={className}>
      {title ? <h2 className="px-4 pb-1.5 text-xs font-medium text-gray-500">{title}</h2> : null}
      <div className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200 bg-white">
        {children}
      </div>
      {footer ? <p className="px-4 pt-1.5 text-xs text-gray-500">{footer}</p> : null}
    </section>
  );
}

export interface ListRowProps {
  label: ReactNode;
  /** 라벨 아래 작은 설명 */
  description?: ReactNode;
  /** 왼쪽 아이콘 (lucide 18px) */
  icon?: ReactNode;
  /** 오른쪽 값 텍스트 (예: "3학년 2반") */
  value?: ReactNode;
  /** 오른쪽 요소 (Toggle, Badge 등) — 있으면 셰브론 대신 표시 */
  trailing?: ReactNode;
  /** 누르면 이동·열기 → 오른쪽 셰브론 표시 */
  onClick?: () => void;
  /** 앱 안 이동 경로 (react-router) */
  to?: string;
  /** 위험 동작(탈퇴 등) — 빨간 글자 */
  destructive?: boolean;
}

export function ListRow({ label, description, icon, value, trailing, onClick, to, destructive }: ListRowProps) {
  const navigable = Boolean(onClick || to) && !trailing;
  const content = (
    <>
      {icon ? <span className={cn('shrink-0', destructive ? 'text-red-600' : 'text-gray-500')}>{icon}</span> : null}
      <span className="min-w-0 flex-1">
        <span className={cn('block truncate text-[15px]', destructive ? 'text-red-600' : 'text-gray-900')}>
          {label}
        </span>
        {description ? <span className="block truncate text-xs text-gray-500">{description}</span> : null}
      </span>
      {value ? <span className="shrink-0 text-sm text-gray-500">{value}</span> : null}
      {trailing ? <span className="shrink-0">{trailing}</span> : null}
      {navigable ? <ChevronRight size={16} className="shrink-0 text-gray-400" aria-hidden /> : null}
    </>
  );

  const rowClass = 'flex min-h-12 w-full items-center gap-3 px-4 py-2.5 text-left';
  const pressable = 'transition-colors duration-150 active:bg-gray-50 hover:bg-gray-50';

  if (to && !trailing) {
    return (
      <Link to={to} className={cn(rowClass, pressable)}>
        {content}
      </Link>
    );
  }
  if (onClick && !trailing) {
    return (
      <button type="button" onClick={onClick} className={cn(rowClass, pressable)}>
        {content}
      </button>
    );
  }
  return <div className={rowClass}>{content}</div>;
}
