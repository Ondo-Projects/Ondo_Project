import { useCallback, useEffect, useState } from 'react';

import { getAdminCounselingAccessLogs, getAdminPreCounselAccessLogs } from '../../api/admin.api';
import type {
  AdminCounselingAccessLog,
  AdminPageResponse,
  AdminPreCounselAccessLog,
} from '../../api/types/admin';
import { ApiError } from '../../api/types/api-error';
import { PAGE_SIZE } from '../constants';
import { formatDateTime, resolveErrorMessage } from '../adminUtils';
import AdminFilterChips from './AdminFilterChips';
import AdminPager from './AdminPager';
import AdminSectionCard from './AdminSectionCard';

type AccessLogTab = 'counseling' | 'pre-counsel';

const LOG_TAB_OPTIONS: Array<{ value: AccessLogTab; label: string }> = [
  { value: 'counseling', label: '상담 열람' },
  { value: 'pre-counsel', label: '사전상담 열람' },
];

interface SectionAccessLogsProps {
  onError: (message: string) => void;
}

export default function SectionAccessLogs({ onError }: SectionAccessLogsProps) {
  const [tab, setTab] = useState<AccessLogTab>('counseling');
  const [counselingData, setCounselingData] =
    useState<AdminPageResponse<AdminCounselingAccessLog> | null>(null);
  const [preCounselData, setPreCounselData] =
    useState<AdminPageResponse<AdminPreCounselAccessLog> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadCounselingLogs = useCallback(async (nextPage: number) => {
    setIsLoading(true);
    try {
      const response = await getAdminCounselingAccessLogs(nextPage, PAGE_SIZE);
      setCounselingData(response);
    } catch (error) {
      onError(
        error instanceof ApiError
          ? error.message
          : resolveErrorMessage(error, '상담 접근 로그를 불러오지 못했습니다.'),
      );
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  const loadPreCounselLogs = useCallback(async (nextPage: number) => {
    setIsLoading(true);
    try {
      const response = await getAdminPreCounselAccessLogs(nextPage, PAGE_SIZE);
      setPreCounselData(response);
    } catch (error) {
      onError(
        error instanceof ApiError
          ? error.message
          : resolveErrorMessage(error, '사전상담 접근 로그를 불러오지 못했습니다.'),
      );
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    if (tab === 'counseling') {
      void loadCounselingLogs(0);
    } else {
      void loadPreCounselLogs(0);
    }
  }, [tab, loadCounselingLogs, loadPreCounselLogs]);

  return (
    <AdminSectionCard title="6. 민감정보 접근 로그">
      <AdminFilterChips
        ariaLabel="접근 로그 종류"
        options={LOG_TAB_OPTIONS}
        value={tab}
        onChange={setTab}
      />

      {isLoading ? <p className="admin-status">불러오는 중…</p> : null}

      {tab === 'counseling' && counselingData && counselingData.items.length === 0 ? (
        <p className="admin-status">상담 접근 로그가 없습니다.</p>
      ) : null}

      {tab === 'pre-counsel' && preCounselData && preCounselData.items.length === 0 ? (
        <p className="admin-status">사전상담 접근 로그가 없습니다.</p>
      ) : null}

      {tab === 'counseling' && counselingData && counselingData.items.length > 0 ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>시각</th>
                <th>상담</th>
                <th>학생</th>
                <th>교사</th>
              </tr>
            </thead>
            <tbody>
              {counselingData.items.map((log) => (
                <tr key={log.id}>
                  <td data-label="시각">{formatDateTime(log.accessedAt)}</td>
                  <td data-label="상담">{log.counselingTitle}</td>
                  <td data-label="학생">
                    {log.studentName || log.studentUsername} ({log.studentUsername})
                  </td>
                  <td data-label="교사">
                    {log.teacherName || log.teacherUsername} ({log.teacherUsername})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === 'pre-counsel' && preCounselData && preCounselData.items.length > 0 ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>시각</th>
                <th>학생</th>
                <th>교사</th>
              </tr>
            </thead>
            <tbody>
              {preCounselData.items.map((log) => (
                <tr key={log.id}>
                  <td data-label="시각">{formatDateTime(log.accessedAt)}</td>
                  <td data-label="학생">
                    {log.studentName || log.studentUsername} ({log.studentUsername})
                  </td>
                  <td data-label="교사">
                    {log.teacherName || log.teacherUsername} ({log.teacherUsername})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === 'counseling' ? (
        <AdminPager
          pageData={counselingData}
          onPageChange={(nextPage) => void loadCounselingLogs(nextPage)}
        />
      ) : (
        <AdminPager
          pageData={preCounselData}
          onPageChange={(nextPage) => void loadPreCounselLogs(nextPage)}
        />
      )}
    </AdminSectionCard>
  );
}
