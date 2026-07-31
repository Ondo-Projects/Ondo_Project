import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { PATHS } from '../routes/paths';
import './placeholder.css';

interface PlaceholderPageProps {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}

export default function PlaceholderPage({
  eyebrow,
  title,
  description,
  children,
}: PlaceholderPageProps) {
  return (
    <AppLayout>
      <section className="placeholder-page">
        <p className="placeholder-page__eyebrow">{eyebrow}</p>
        <h1 className="placeholder-page__title">{title}</h1>
        <p className="placeholder-page__description">{description}</p>
        {children}
        <div className="placeholder-page__links">
          <Link className="placeholder-page__link" to={PATHS.HOME}>
            홈으로
          </Link>
          <Link className="placeholder-page__link placeholder-page__link--ghost" to={PATHS.LOGIN}>
            로그인
          </Link>
        </div>
      </section>
    </AppLayout>
  );
}
