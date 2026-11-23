import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../ds';
import { PATHS } from '../../routes/paths';

/**
 * 로그인·회원가입·계정 찾기 공통 틀 — 가운데 한 줄 폼, 위에 로고, 아래에 보조 링크
 */
export function AuthShell({
  title,
  description,
  wide = false,
  footer,
  children,
}: {
  title: string;
  description?: ReactNode;
  /** 회원가입처럼 폼이 길 때 */
  wide?: boolean;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="ondo-ui flex min-h-screen flex-col bg-gray-50/50">
      <header className="border-b border-gray-200 bg-white">
        <div className={cn('mx-auto flex h-14 items-center px-4', wide ? 'max-w-2xl' : 'max-w-md')}>
          <Link to={PATHS.ROOT} className="flex items-center gap-2" aria-label="온도 처음 화면">
            <img src="/ondo-logo.png" alt="" width={24} height={24} className="h-6 w-6" />
            <span className="text-[15px] font-semibold tracking-tight">온도</span>
          </Link>
        </div>
      </header>
      <main className={cn('mx-auto w-full flex-1 px-4 py-10', wide ? 'max-w-2xl' : 'max-w-md')}>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{title}</h1>
        {description ? <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{description}</p> : null}
        <div className="mt-6">{children}</div>
        {footer ? (
          <nav className="mt-6 flex flex-wrap items-center justify-center gap-x-1 gap-y-2 text-[13px] text-gray-500">
            {footer}
          </nav>
        ) : null}
      </main>
    </div>
  );
}

/** 하단 보조 링크 (가운데 점으로 구분) */
export function AuthLinks({ links }: { links: Array<{ to: string; label: string }> }) {
  return (
    <>
      {links.map((link, index) => (
        <span key={link.to} className="inline-flex items-center gap-1">
          {index > 0 ? (
            <span aria-hidden className="px-1 text-gray-300">
              ·
            </span>
          ) : null}
          <Link to={link.to} className="font-medium text-gray-600 hover:text-gray-900">
            {link.label}
          </Link>
        </span>
      ))}
    </>
  );
}

/** 흰 폼 판 */
export function AuthCard({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('rounded-lg border border-gray-200 bg-white p-5 sm:p-6', className)}>{children}</div>;
}
