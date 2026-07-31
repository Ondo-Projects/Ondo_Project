import { useCallback, useState } from 'react';

import { useAuth } from '../auth/AuthProvider';
import AuthLoading from '../auth/AuthLoading';
import AppLayout from '../components/layout/AppLayout';
import PageHeader from '../components/PageHeader';
import { usePageTitle } from '../hooks/usePageTitle';
import SectionAccessLogs from './components/SectionAccessLogs';
import SectionActivityLogs from './components/SectionActivityLogs';
import SectionAnnouncementAdmin from './components/SectionAnnouncementAdmin';
import SectionDashboard from './components/SectionDashboard';
import SectionSchoolSearch from './components/SectionSchoolSearch';
import SectionStatistics from './components/SectionStatistics';
import SectionSuggestionAdmin from './components/SectionSuggestionAdmin';
import SectionSystemStatus from './components/SectionSystemStatus';
import SectionUserSearch from './components/SectionUserSearch';
import { Alert, useToast } from '../components/ui';
import './admin.css';

export default function AdminHomePage() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [refreshToken, setRefreshToken] = useState(0);
  const [sectionError, setSectionError] = useState<string | null>(null);

  usePageTitle('관리자 | 온도');

  const refreshData = useCallback(() => {
    setRefreshToken((token) => token + 1);
  }, []);

  const handleSuccess = useCallback(
    (message: string) => {
      setSectionError(null);
      showToast(message, 'success');
      refreshData();
    },
    [refreshData, showToast],
  );

  const handleError = useCallback((message: string) => {
    setSectionError(message);
  }, []);

  if (!user) {
    return <AuthLoading message="관리자 콘솔을 준비하고 있어요" />;
  }

  return (
    <AppLayout>
      <div className="admin-page" data-page="admin-home">
        <PageHeader
          tone="admin"
          eyebrow={`${user.name?.trim() || user.username} · 관리자`}
          title="관리자 콘솔"
          subtitle="회원·학교 현황, 플랫폼 공지, 민감정보 접근 기록을 관리합니다."
          actions={
            <button
              type="button"
              className="page-header-action page-header-action--secondary"
              onClick={() => logout()}
            >
              로그아웃
            </button>
          }
        />

        {sectionError ? <Alert variant="error">{sectionError}</Alert> : null}

        <SectionDashboard refreshToken={refreshToken} onError={handleError} />
        <SectionUserSearch
          onSuccess={handleSuccess}
          onError={handleError}
          onDataChange={refreshData}
        />
        <SectionSchoolSearch
          onSuccess={handleSuccess}
          onError={handleError}
          onDataChange={refreshData}
        />
        <SectionSystemStatus onError={handleError} />
        <SectionStatistics onError={handleError} />
        <SectionActivityLogs refreshToken={refreshToken} onError={handleError} />
        <SectionAccessLogs onError={handleError} />
        <SectionSuggestionAdmin
          onSuccess={handleSuccess}
          onError={handleError}
          onDataChange={refreshData}
        />
        <SectionAnnouncementAdmin
          refreshToken={refreshToken}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </div>
    </AppLayout>
  );
}
