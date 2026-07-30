import { useCallback, useEffect, useState } from 'react';

import { getAdminActivityLogs } from '../../api/admin.api';
import type { AdminActivityLog, AdminPageResponse } from '../../api/types/admin';
import { ApiError } from '../../api/types/api-error';
import { ACTION_LABELS, PAGE_SIZE } from '../constants';
import { formatDateTime, resolveErrorMessage } from '../adminUtils';
import AdminPager from './AdminPager';
import AdminSectionCard from './AdminSectionCard';

interface SectionActivityLogsProps {
  refreshToken: number;
  onError: (message: string) => void;
}

export default function SectionActivityLogs({ refreshToken, onError }: SectionActivityLogsProps) {
  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState<AdminPageResponse<AdminActivityLog> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadLogs = useCallback(
    async (nextPage = page) => {
      setIsLoading(true);
      try {
        const response = await getAdminActivityLogs(nextPage, PAGE_SIZE);
        setPageData(response);
        setPage(nextPage);
      } catch (error) {
        onError(
          error instanceof ApiError
            ? error.message
            : resolveErrorMessage(error, '관리자 활동 로그를 불러오지 못했습니다.'),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [page, onError],
  );

  useEffect(() => {
    void loadLogs(0);
  }, [refreshToken, loadLogs]);

  return (
    <AdminSectionCard title="5. 관리자 활동 로그">
      {isLoading && !pageData ? <p className="admin-status">불러오는 중…</p> : null}
      {!isLoading && pageData && pageData.items.length === 0 ? (
        <p className="admin-status">활동 로그가 없습니다.</p>
      ) : null}
      {pageData && pageData.items.length > 0 ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>시각</th>
                <th>관리자</th>
                <th>작업</th>
                <th>대상</th>
                <th>상세</th>
              </tr>
            </thead>
            <tbody>
              {pageData.items.map((log) => (
                <tr key={log.id}>
                  <td data-label="시각">{formatDateTime(log.createdAt)}</td>
                  <td data-label="관리자">{log.adminUsername}</td>
                  <td data-label="작업">{ACTION_LABELS[log.action] ?? log.action}</td>
                  <td data-label="대상">{log.targetUsername || '-'}</td>
                  <td data-label="상세">{log.detail || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <AdminPager pageData={pageData} onPageChange={(nextPage) => void loadLogs(nextPage)} />
    </AdminSectionCard>
  );
}
