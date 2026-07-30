import { useEffect, useState } from 'react';

import { getAdminStatistics } from '../../api/admin.api';
import type { AdminStatisticsResponse } from '../../api/types/admin';
import { ApiError } from '../../api/types/api-error';
import { COUNSELING_STATUS_LABELS, MOOD_LEVEL_LABELS } from '../constants';
import { resolveErrorMessage } from '../adminUtils';
import AdminSectionCard from './AdminSectionCard';

interface SectionStatisticsProps {
  onError: (message: string) => void;
}

function StatGrid({
  entries,
  labelMap,
}: {
  entries: Record<string, number> | undefined;
  labelMap: Record<string, string>;
}) {
  const keys = Object.keys(entries ?? {});
  if (!keys.length) {
    return <p className="admin-status">데이터가 없습니다.</p>;
  }

  return (
    <div className="admin-stat-grid">
      {keys.map((key) => (
        <div key={key} className="admin-stat-item">
          {labelMap[key] ?? key}
          <strong>{entries?.[key] ?? 0}</strong>
        </div>
      ))}
    </div>
  );
}

export default function SectionStatistics({ onError }: SectionStatisticsProps) {
  const [data, setData] = useState<AdminStatisticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const response = await getAdminStatistics();
        if (!cancelled) {
          setData(response);
        }
      } catch (error) {
        if (!cancelled) {
          onError(
            error instanceof ApiError
              ? error.message
              : resolveErrorMessage(error, '서비스 통계를 불러오지 못했습니다.'),
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
  }, [onError]);

  return (
    <AdminSectionCard title="4. 서비스 통계">
      {isLoading ? <p className="admin-status">불러오는 중…</p> : null}
      {!isLoading ? (
        <>
          <h3 className="admin-subtitle">상담 상태</h3>
          <StatGrid entries={data?.counselingByStatus} labelMap={COUNSELING_STATUS_LABELS} />
          <h3 className="admin-subtitle admin-subtitle--spaced">마음 날씨 (최근 7일)</h3>
          <StatGrid entries={data?.moodByLevelLast7Days} labelMap={MOOD_LEVEL_LABELS} />
        </>
      ) : null}
    </AdminSectionCard>
  );
}
