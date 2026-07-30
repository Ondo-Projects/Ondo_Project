import { useCallback, useState } from 'react';

import { useAuth } from '../auth/AuthProvider';
import AuthLoading from '../auth/AuthLoading';
import AppLayout from '../components/layout/AppLayout';
import PageHeader from '../components/PageHeader';
import { usePageTitle } from '../hooks/usePageTitle';
import SectionAccessLogs from './components/SectionAccessLogs';
import SectionActivityLogs from './components/SectionActivityLogs';
import SectionDashboard from './components/SectionDashboard';
import SectionSchoolSearch from './components/SectionSchoolSearch';
import SectionStatistics from './components/SectionStatistics';
import SectionSuggestionAdmin from './components/SectionSuggestionAdmin';
import SectionSystemStatus from './components/SectionSystemStatus';
import SectionUserSearch from './components/SectionUserSearch';
import './admin.css';

export default function AdminHomePage() {
  const { user, logout } = useAuth();
  const [refreshToken, setRefreshToken] = useState(0);
  const [pageSuccess, setPageSuccess] = useState<string | null>(null);
  const [sectionError, setSectionError] = useState<string | null>(null);

  usePageTitle('관리자 | 온도');

  const refreshData = useCallback(() => {
    setRefreshToken((token) => token + 1);
  }, []);

  const handleSuccess = useCallback(
    (message: string) => {
      setSectionError(null);
      setPageSuccess(message);
      refreshData();
    },
    [refreshData],
  );

  const handleError = useCallback((message: string) => {
    setPageSuccess(null);
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
          subtitle="회원·학교 현황과 민감정보 접근 기록을 조회합니다."
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

        {sectionError ? (
          <p className="admin-message admin-message--error" role="alert">
            {sectionError}
          </p>
        ) : null}

        {pageSuccess ? (
          <p className="admin-message admin-message--success" role="status">
            {pageSuccess}
          </p>
        ) : null}

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
      </div>
    </AppLayout>
  );
}
