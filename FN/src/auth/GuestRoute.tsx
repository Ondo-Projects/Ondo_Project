import { Navigate } from 'react-router-dom';
import { getPostLoginPath } from './redirects';
import { useAuth } from './AuthProvider';
import AuthLoading from './AuthLoading';

interface GuestRouteProps {
  children: React.ReactNode;
}

export default function GuestRoute({ children }: GuestRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <AuthLoading message="잠시만 기다려 주세요" />;
  }

  if (isAuthenticated && user) {
    return <Navigate to={getPostLoginPath(user.role)} replace />;
  }

  return children;
}
