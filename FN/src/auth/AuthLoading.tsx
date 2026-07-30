import AppLayout from '../components/layout/AppLayout';
import './auth.css';

interface AuthLoadingProps {
  message?: string;
}

export default function AuthLoading({ message = '불러오는 중…' }: AuthLoadingProps) {
  return (
    <AppLayout>
      <p className="auth-loading" role="status" aria-live="polite">
        {message}
      </p>
    </AppLayout>
  );
}
