import { useAuth } from '../auth/AuthProvider';
import PlaceholderPage from './PlaceholderPage';
import '../auth/auth.css';

export default function AdminPage() {
  const { user, logout } = useAuth();

  return (
    <PlaceholderPage
      eyebrow={`ADMIN · ${user?.username ?? ''}`}
      title="관리자"
      description="관리자 콘솔은 React 이전 범위 확정 후 진행할 예정이에요."
    >
      <div className="auth-actions">
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
