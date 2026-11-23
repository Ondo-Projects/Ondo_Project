import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../ds';
import { PATHS } from '../../routes/paths';

export interface ConsoleNavItem<T extends string> {
  value: T;
  label: string;
  icon: LucideIcon;
  /** 처리할 건수 — 0이면 표시하지 않음 */
  count?: number | null;
}

interface ConsoleShellProps<T extends string> {
  /** 상단 오른쪽 역할 표시 (예: "교사") */
  roleLabel: string;
  userName: string;
  /** 사용자 이름 아래 보조 정보 (학교 이름 등) */
  userMeta?: string;
  nav: ConsoleNavItem<T>[];
  active: T;
  onNavigate: (value: T) => void;
  /** 상단 바 오른쪽 (알림, 로그아웃 등) */
  headerActions?: ReactNode;
  /** 사이드바 맨 아래 */
  sidebarFooter?: ReactNode;
  children: ReactNode;
}

/**
 * 교사·관리자 화면 공통 틀 — 상단 바 + 왼쪽 메뉴 + 본문
 * 모바일에서는 왼쪽 메뉴가 상단 바 아래 가로 스크롤 탭으로 바뀝니다.
 */
export function ConsoleShell<T extends string>({
  roleLabel,
  userName,
  userMeta,
  nav,
  active,
  onNavigate,
  headerActions,
  sidebarFooter,
  children,
}: ConsoleShellProps<T>) {
  return (
    <div className="ondo-ui min-h-screen bg-gray-50/50">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
        <div className="flex h-14 items-center justify-between gap-3 px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link to={PATHS.HOME} className="flex items-center gap-2" aria-label="온도 공통 홈">
              <img src="/ondo-mark.svg" alt="" width={24} height={24} className="h-6 w-6" />
              <span className="text-[15px] font-semibold tracking-tight">온도</span>
            </Link>
            <span className="h-4 w-px bg-gray-200" aria-hidden />
            <span className="text-[13px] font-medium text-gray-500">{roleLabel}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="mr-1 hidden text-right sm:block">
              <p className="text-[13px] leading-tight font-medium text-gray-900">{userName}</p>
              {userMeta ? <p className="text-[11px] leading-tight text-gray-500">{userMeta}</p> : null}
            </div>
            {headerActions}
          </div>
        </div>

        {/* 모바일 메뉴 */}
        <nav className="flex gap-1 overflow-x-auto border-t border-gray-100 px-2 lg:hidden" aria-label="메뉴">
          {nav.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onNavigate(item.value)}
              aria-current={item.value === active ? 'page' : undefined}
              className={cn(
                '-mb-px flex h-10 shrink-0 items-center gap-1.5 border-b-2 px-2.5 text-[13px] font-medium',
                item.value === active ? 'border-blue-700 text-gray-900' : 'border-transparent text-gray-500',
              )}
            >
              {item.label}
              <NavCount count={item.count} active={item.value === active} />
            </button>
          ))}
        </nav>
      </header>

      <div className="flex">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 flex-col border-r border-gray-200 bg-white lg:flex">
          <nav className="flex flex-col gap-0.5 p-3" aria-label="메뉴">
            {nav.map((item) => {
              const isActive = item.value === active;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => onNavigate(item.value)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex h-9 items-center gap-2.5 rounded-md px-2.5 text-left text-[13px] font-medium transition-colors duration-150',
                    isActive ? 'bg-blue-50 text-blue-800' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  )}
                >
                  <item.icon size={16} aria-hidden className={isActive ? 'text-blue-700' : 'text-gray-400'} />
                  <span className="flex-1">{item.label}</span>
                  <NavCount count={item.count} active={isActive} />
                </button>
              );
            })}
          </nav>
          {sidebarFooter ? <div className="mt-auto border-t border-gray-200 p-3">{sidebarFooter}</div> : null}
        </aside>

        <main className="min-w-0 flex-1 px-4 py-5 lg:px-8 lg:py-6">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

function NavCount({ count, active }: { count?: number | null; active: boolean }) {
  if (!count) return null;
  return (
    <span
      className={cn(
        'min-w-5 rounded px-1 text-center text-[11px] font-semibold tabular-nums',
        active ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-700',
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
