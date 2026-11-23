import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { getPostLoginPath } from '../auth/redirects';
import AuthLoading from '../auth/AuthLoading';
import CommonHome from '../v2/home/CommonHome';
import LandingPage from '../v2/LandingPage';

/** /home — 학생·교사 공통 학교 홈 */
export default CommonHome;

/** / — 로그인했으면 역할별 첫 화면, 아니면 소개 페이지 */
export function RootRedirect() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <AuthLoading />;
  }

  if (isAuthenticated && user) {
    return <Navigate to={getPostLoginPath(user.role)} replace />;
  }

  return <LandingPage />;
}
