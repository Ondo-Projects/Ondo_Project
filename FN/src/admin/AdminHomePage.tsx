import { useCallback, useState } from 'react';

import { useAuth } from '../auth/AuthProvider';
import AuthLoading from '../auth/AuthLoading';
import AppLayout from '../components/layout/AppLayout';
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
        <header className="admin-header">
          <div className="admin-header__main">
            <h1 className="admin-title">관리자 콘솔</h1>
            <p className="admin-subtitle">회원·학교 현황과 민감정보 접근 기록을 조회합니다.</p>
          </div>
          <div className="admin-header__actions">
            <button type="button" className="admin-btn admin-btn--secondary" onClick={() => logout()}>
              로그아웃
            </button>
          </div>
        </header>

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
