import type { ReactNode } from 'react';
import './AppLayout.css';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="app-layout">
      <main className="app-layout__main">{children}</main>
    </div>
  );
}
