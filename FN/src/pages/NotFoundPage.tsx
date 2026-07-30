import { Link } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { PATHS } from '../routes/paths';
import './placeholder.css';

export default function NotFoundPage() {
  return (
    <AppLayout>
      <section className="placeholder-page">
        <p className="placeholder-page__eyebrow">404</p>
        <h1 className="placeholder-page__title">페이지를 찾을 수 없어요</h1>
        <p className="placeholder-page__description">
          주소를 다시 확인해 주세요.
        </p>
        <div className="placeholder-page__links">
          <Link className="placeholder-page__link" to={PATHS.ROOT}>
            처음으로
          </Link>
        </div>
      </section>
    </AppLayout>
  );
}
