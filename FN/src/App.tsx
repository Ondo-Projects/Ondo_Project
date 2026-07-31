import { AuthProvider } from './auth/AuthProvider';
import { PlatformAnnouncementProvider } from './home/PlatformAnnouncementProvider';
import { ToastProvider } from './components/ui';
import AppRoutes from './routes';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <PlatformAnnouncementProvider>
          <AppRoutes />
        </PlatformAnnouncementProvider>
      </AuthProvider>
    </ToastProvider>
  );
}