import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { PATHS } from '../routes/paths';
import PlaceholderPage from './PlaceholderPage';
import '../auth/auth.css';

export default function StudentPage() {
  const { user, logout } = useAuth();

  return (
    <PlaceholderPage
      eyebrow={`STUDENT · ${user?.username ?? ''}`}
      title="학생 홈"
      description="대시보드·상담·기분 기록 등 학생 화면을 단계적으로 이전할 예정이에요."
    >
      <div className="auth-actions">
        <Link className="auth-actions__button auth-actions__button--ghost" to={PATHS.HOME}>
          공통 홈
        </Link>
        <button
          type="button"
          className="auth-actions__button auth-actions__button--ghost"
          onClick={() => logout()}
        >
          로그아웃
        </button>
      </div>
    </PlaceholderPage>
  );
}
