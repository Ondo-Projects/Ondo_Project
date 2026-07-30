import { Navigate, useLocation } from 'react-router-dom';
import type { UserRole } from '../api/types/auth';
import { PATHS } from '../routes/paths';
import { getPostLoginPath } from './redirects';
import { useAuth } from './AuthProvider';
import AuthLoading from './AuthLoading';

interface RequireAuthProps {
  children: React.ReactNode;
  roles?: UserRole[];
}

export default function RequireAuth({ children, roles }: RequireAuthProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <AuthLoading message="로그인 정보를 확인하고 있어요" />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={PATHS.LOGIN} replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={getPostLoginPath(user.role)} replace />;
  }

  return children;
}
