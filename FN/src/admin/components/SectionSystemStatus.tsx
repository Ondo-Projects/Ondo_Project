import { useEffect, useState } from 'react';

import { getAdminSystemStatus } from '../../api/admin.api';
import type { AdminSystemStatusResponse } from '../../api/types/admin';
import { ApiError } from '../../api/types/api-error';
import { resolveErrorMessage } from '../adminUtils';
import AdminSectionCard from './AdminSectionCard';

interface SectionSystemStatusProps {
  onError: (message: string) => void;
}

function statusLabel(value: boolean, onLabel = 'ON', offLabel = 'OFF'): string {
  return value ? onLabel : offLabel;
}

function keyLabel(value: boolean): string {
  return value ? '설정됨' : '미설정';
}

export default function SectionSystemStatus({ onError }: SectionSystemStatusProps) {
  const [data, setData] = useState<AdminSystemStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const response = await getAdminSystemStatus();
        if (!cancelled) {
          setData(response);
        }
      } catch (error) {
        if (!cancelled) {
          onError(
            error instanceof ApiError
              ? error.message
              : resolveErrorMessage(error, '시스템 상태를 불러오지 못했습니다.'),
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

  const items = data
    ? [
        { label: 'NEIS dev-mode', value: statusLabel(data.neisDevMode) },
        { label: 'NEIS API 키', value: keyLabel(data.neisApiKeyConfigured) },
        { label: '날씨 dev-mode', value: statusLabel(data.weatherDevMode) },
        { label: '날씨 API 키', value: keyLabel(data.weatherApiKeyConfigured) },
        { label: '암호화 dev-mode', value: statusLabel(data.encryptionDevMode) },
        { label: '암호화 키', value: keyLabel(data.encryptionKeyConfigured) },
      ]
    : [];

  return (
    <AdminSectionCard title="3. 시스템 상태">
      {isLoading ? <p className="admin-status">불러오는 중…</p> : null}
      {!isLoading && items.length === 0 ? (
        <p className="admin-status">시스템 상태 정보가 없습니다.</p>
      ) : (
        <div className="admin-stat-grid">
          {items.map((item) => (
            <div key={item.label} className="admin-stat-item">
              {item.label}
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      )}
    </AdminSectionCard>
  );
}
