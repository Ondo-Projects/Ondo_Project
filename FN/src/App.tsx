import { AuthProvider } from './auth/AuthProvider';
import { ToastProvider } from './components/ui';
import AppRoutes from './routes';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ToastProvider>
  );
}