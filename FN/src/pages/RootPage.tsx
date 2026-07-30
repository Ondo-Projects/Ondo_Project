import { Link } from 'react-router-dom';
import ProductTile from '../components/ProductTile.jsx';
import AppLayout from '../components/layout/AppLayout';
import PageHeader from '../components/PageHeader';
import { PATHS } from '../routes/paths';
import './placeholder.css';

export default function RootPage() {
  return (
    <AppLayout>
      <PageHeader
        variant="landing"
        eyebrow="온도(Ondo)"
        title="학교 상담 플랫폼"
        subtitle="로그인하면 역할에 맞는 홈으로 이동해요. UI는 2026 디자인 가이드를 따릅니다."
      />
      <section className="placeholder-page">
        <div className="placeholder-page__tiles">
          <ProductTile
            title="학생"
            description="담당 교사와 상담을 준비하고 이어갈 수 있어요."
            icon="🎒"
            badge={{ label: 'STUDENT', variant: 'student' }}
            size="wide"
            actions={[{ label: '로그인', variant: 'primary', href: PATHS.LOGIN }]}
          />
          <ProductTile
            title="교사"
            description="학생 상담 요청을 확인하고 답변할 수 있어요."
            icon="📋"
            badge={{ label: 'TEACHER', variant: 'teacher' }}
            actions={[{ label: '로그인', variant: 'primary', href: PATHS.LOGIN }]}
          />
        </div>

        <div className="placeholder-page__links">
          <Link className="placeholder-page__link" to={PATHS.LOGIN}>
            로그인
          </Link>
          <Link className="placeholder-page__link placeholder-page__link--ghost" to={PATHS.JOIN}>
            회원가입
          </Link>
        </div>
      </section>
    </AppLayout>
  );
}
