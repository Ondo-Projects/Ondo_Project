import { useEffect, useState } from 'react';

import { getAdminDashboard } from '../../api/admin.api';
import type { AdminDashboardResponse } from '../../api/types/admin';
import { ApiError } from '../../api/types/api-error';
import { formatCount, resolveErrorMessage } from '../adminUtils';

interface SectionDashboardProps {
  refreshToken: number;
  onError: (message: string) => void;
}

export default function SectionDashboard({ refreshToken, onError }: SectionDashboardProps) {
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const response = await getAdminDashboard();
        if (!cancelled) {
          setData(response);
        }
      } catch (error) {
        if (!cancelled) {
          onError(
            error instanceof ApiError
              ? error.message
              : resolveErrorMessage(error, '운영 현황을 불러오지 못했습니다.'),
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [refreshToken, onError]);

  const items = [
    { label: '전체 회원', value: data?.totalUsers, highlight: true },
    { label: '학생', value: data?.studentCount },
    { label: '교사', value: data?.teacherCount },
    { label: '학교', value: data?.totalSchools },
    { label: 'NEIS 매핑', value: data?.neisMappedSchools },
    { label: '상담 게시글', value: data?.totalCounselingPosts },
    { label: '오늘 상담 접근', value: data?.counselingAccessLogsToday, highlight: true },
    { label: '오늘 사전상담 접근', value: data?.preCounselAccessLogsToday, highlight: true },
  ];

  return (
    <div className="admin-card">
      <h2 className="admin-card__title">운영 현황</h2>
      {isLoading ? <p className="admin-status">불러오는 중…</p> : null}
      <div className="admin-summary-grid">
        {items.map((item) => (
          <div
            key={item.label}
            className={`admin-summary-item${item.highlight ? ' admin-summary-item--highlight' : ''}`}
          >
            <div className="admin-summary-item__label">{item.label}</div>
            <div className="admin-summary-item__value">{formatCount(item.value ?? null)}</div>
          </div>
        ))}
      </div>
      <p className="admin-helper">
        상담·사전상담 본문은 표시하지 않으며, 접근 기록(감사)만 조회합니다.
      </p>
    </div>
  );
}
