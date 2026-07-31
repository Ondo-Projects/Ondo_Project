import type { ReactNode } from 'react';
import BrandMark from './BrandMark';
import './page-header.css';

export type PageHeaderTone = 'student' | 'teacher' | 'admin' | 'home' | 'neutral';
export type PageHeaderVariant = 'dashboard' | 'auth' | 'toolbar' | 'landing';

interface PageHeaderProps {
  variant?: PageHeaderVariant;
  tone?: PageHeaderTone;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  showLogo?: boolean;
}

export default function PageHeader({
  variant = 'dashboard',
  tone = 'neutral',
  eyebrow,
  title,
  subtitle,
  actions,
  onBack,
  backLabel = '뒤로가기',
  showLogo = variant === 'dashboard' || variant === 'auth' || variant === 'landing',
}: PageHeaderProps) {
  const className = [
    'page-header',
    `page-header--${variant}`,
    `page-header--tone-${tone}`,
  ].join(' ');

  const dashboardLogoSize =
    tone === 'student' || tone === 'teacher' || tone === 'home' ? 'dashboard' : 'compact';

  if (variant === 'toolbar') {
    return (
      <header className={className}>
        {onBack ? (
          <button type="button" className="page-header__back" onClick={onBack}>
            ← {backLabel}
          </button>
        ) : null}
        {title ? <h1 className="page-header__title page-header__title--toolbar">{title}</h1> : null}
      </header>
    );
  }

  if (variant === 'auth' || variant === 'landing') {
    return (
      <header className={className}>
        {showLogo ? (
          <div className="page-header__logo page-header__logo--center">
            <BrandMark size="auth" />
          </div>
        ) : null}
        {eyebrow ? <p className="page-header__eyebrow page-header__eyebrow--center">{eyebrow}</p> : null}
        {title ? <h1 className="page-header__title page-header__title--center">{title}</h1> : null}
        {subtitle ? <p className="page-header__subtitle page-header__subtitle--center">{subtitle}</p> : null}
      </header>
    );
  }

  return (
    <header className={className}>
      {showLogo ? (
        <div className="page-header__logo">
          <BrandMark size={dashboardLogoSize} />
        </div>
      ) : null}
      <div className="page-header__content">
        {eyebrow ? <p className="page-header__eyebrow">{eyebrow}</p> : null}
        {title ? <h1 className="page-header__title">{title}</h1> : null}
        {subtitle ? <p className="page-header__subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </header>
  );
}

export function PageHeaderActions({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
