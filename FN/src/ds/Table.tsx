import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { cn } from './cn';

/** 테이블 바깥 틀 — 1px 테두리, 가로 스크롤. footer 는 같은 테두리 안 아래쪽에 붙음 */
export function Table({
  className,
  footer,
  children,
}: {
  className?: string;
  /** 표 아래 "총 N건 · 페이지" 줄 (TableFooter 내용) */
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={cn('overflow-hidden rounded-lg border border-gray-200 bg-white', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">{children}</table>
      </div>
      {footer ? (
        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50/60 px-3 py-2 text-xs text-gray-500">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="border-b border-gray-200 bg-gray-50/60">{children}</thead>;
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-gray-100">{children}</tbody>;
}

export interface TrProps extends HTMLAttributes<HTMLTableRowElement> {
  /** 행 클릭 가능 표시 */
  interactive?: boolean;
  selected?: boolean;
}

export function Tr({ interactive, selected, className, ...rest }: TrProps) {
  return (
    <tr
      className={cn(
        interactive && 'cursor-pointer transition-colors duration-150 hover:bg-gray-50',
        selected && 'bg-gray-50',
        className,
      )}
      {...rest}
    />
  );
}

type Align = 'left' | 'right' | 'center';
const ALIGN: Record<Align, string> = { left: 'text-left', right: 'text-right', center: 'text-center' };

export interface ThProps extends ThHTMLAttributes<HTMLTableCellElement> {
  align?: Align;
}

export function Th({ align = 'left', className, ...rest }: ThProps) {
  return (
    <th
      scope="col"
      className={cn('h-9 px-3 text-xs font-medium whitespace-nowrap text-gray-500', ALIGN[align], className)}
      {...rest}
    />
  );
}

export interface TdProps extends TdHTMLAttributes<HTMLTableCellElement> {
  align?: Align;
  /** 보조 정보(회색) */
  muted?: boolean;
  /** 숫자 — 오른쪽 정렬 + 고정폭 숫자 */
  numeric?: boolean;
}

export function Td({ align, muted, numeric, className, ...rest }: TdProps) {
  return (
    <td
      className={cn(
        'h-10 px-3 align-middle',
        ALIGN[align ?? (numeric ? 'right' : 'left')],
        numeric && 'tabular-nums',
        muted ? 'text-gray-500' : 'text-gray-900',
        className,
      )}
      {...rest}
    />
  );
}
