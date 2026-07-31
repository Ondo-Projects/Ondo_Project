import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import PlatformAnnouncementBell from '../../home/components/PlatformAnnouncementBell';
import { PATHS } from '../../routes/paths';
import './AppLayout.css';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const showGlobalBell = isAuthenticated && location.pathname !== PATHS.HOME;

  return (
    <div className="app-layout">
      {showGlobalBell ? <PlatformAnnouncementBell placement="fixed" /> : null}
      <main className="app-layout__main">{children}</main>
    </div>
  );
}