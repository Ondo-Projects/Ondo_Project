import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { getPostLoginPath, getRoleHomePath } from '../auth/redirects';
import AppLayout from '../components/layout/AppLayout';
import AuthLoading from '../auth/AuthLoading';
import { PATHS } from '../routes/paths';
import '../auth/auth.css';
import './placeholder.css';

export default function HomePage() {
  const { user, logout } = useAuth();

  if (!user) {
    return <AuthLoading message="홈을 준비하고 있어요" />;
  }

  async function handleLogout() {
    await logout();
  }

  const roleHomePath = getRoleHomePath(user.role);
  const greetingName = user.name?.trim() || user.username;

  return (
    <AppLayout>
      <section className="placeholder-page">
        <p className="placeholder-page__eyebrow">공통 홈 · {user.role}</p>
        <h1 className="placeholder-page__title">안녕하세요, {greetingName}님</h1>
        <p className="placeholder-page__description">
          Thymeleaf `/home`에 대응하는 React 허브예요. 역할별 앱으로 이동할 수 있어요.
        </p>

        <div className="auth-profile">
          <p className="auth-profile__name">{greetingName}</p>
          <p className="auth-profile__meta">아이디 · {user.username}</p>
          {user.schoolName ? (
            <p className="auth-profile__meta">학교 · {user.schoolName}</p>
          ) : null}
        </div>

        <div className="auth-actions">
          {user.role !== 'ADMIN' ? (
            <Link className="auth-actions__button auth-actions__button--primary" to={roleHomePath}>
              {user.role === 'STUDENT' ? '학생 홈 열기' : '교사 홈 열기'}
            </Link>
          ) : (
            <Link className="auth-actions__button auth-actions__button--primary" to={PATHS.ADMIN}>
              관리자 콘솔 열기
            </Link>
          )}
          <button
            type="button"
            className="auth-actions__button auth-actions__button--ghost"
            onClick={handleLogout}
          >
            로그아웃
          </button>
        </div>
      </section>
    </AppLayout>
  );
}

export function RootRedirect() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <AuthLoading />;
  }

  if (isAuthenticated && user) {
    return <Navigate to={getPostLoginPath(user.role)} replace />;
  }

  return <Navigate to={PATHS.LOGIN} replace />;
}
