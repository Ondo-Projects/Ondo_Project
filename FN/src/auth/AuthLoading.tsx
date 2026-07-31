import AppLayout from '../components/layout/AppLayout';
import { Skeleton, SkeletonText } from '../components/ui';
import './auth.css';

interface AuthLoadingProps {
  message?: string;
}

export default function AuthLoading({ message = '불러오는 중…' }: AuthLoadingProps) {
  return (
    <AppLayout>
      <div className="auth-loading-shell" role="status" aria-live="polite" aria-busy="true">
        <span className="auth-loading-shell__sr-only">{message}</span>
        <Skeleton height="1.75rem" width="55%" rounded="sm" />
        <SkeletonText lines={2} />
      </div>
    </AppLayout>
  );
}
