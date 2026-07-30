import type { ReactNode } from 'react';
import PageHeader from './PageHeader';
import '../auth/auth.css';
import './page-header.css';

interface AuthPageShellProps {
  title: string;
  subtitle?: string;
  wide?: boolean;
  join?: boolean;
  children: ReactNode;
}

export default function AuthPageShell({
  title,
  subtitle,
  wide = false,
  join = false,
  children,
}: AuthPageShellProps) {
  const shellClassName = [
    'auth-shell',
    wide ? 'auth-shell--wide' : '',
    join ? 'auth-shell--join' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={shellClassName}>
      <PageHeader variant="auth" title={title} subtitle={subtitle} />
      {children}
    </div>
  );
}
