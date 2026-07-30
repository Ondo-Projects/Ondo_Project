import { Link } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import PageHeader from '../components/PageHeader';
import { PATHS } from '../routes/paths';
import './placeholder.css';

export default function NotFoundPage() {
  return (
    <AppLayout>
      <PageHeader
        variant="landing"
        eyebrow="404"
        title="페이지를 찾을 수 없어요"
        subtitle="주소를 다시 확인해 주세요."
      />
      <section className="placeholder-page">
        <div className="placeholder-page__links">
          <Link className="placeholder-page__link" to={PATHS.ROOT}>
            처음으로
          </Link>
        </div>
      </section>
    </AppLayout>
  );
}
