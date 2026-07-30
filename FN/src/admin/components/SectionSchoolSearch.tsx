import { useCallback, useState } from 'react';

import {
  searchAdminSchools,
  syncAdminNeisSchools,
  syncAdminSchoolsCsv,
} from '../../api/admin.api';
import type { AdminPageResponse, AdminSchoolSummary } from '../../api/types/admin';
import { ApiError } from '../../api/types/api-error';
import { PAGE_SIZE, SCHOOL_MAPPED_FILTER_OPTIONS } from '../constants';
import { resolveErrorMessage } from '../adminUtils';
import AdminFilterChips from './AdminFilterChips';
import AdminPager from './AdminPager';
import AdminSectionCard from './AdminSectionCard';

interface SectionSchoolSearchProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onDataChange: () => void;
}

export default function SectionSchoolSearch({
  onSuccess,
  onError,
  onDataChange,
}: SectionSchoolSearchProps) {
  const [keyword, setKeyword] = useState('');
  const [mappedFilter, setMappedFilter] = useState<'' | 'true' | 'false'>('');
  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState<AdminPageResponse<AdminSchoolSummary> | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadSchools = useCallback(
    async (nextPage = page) => {
      setIsSearching(true);
      try {
        const response = await searchAdminSchools({
          keyword: keyword.trim() || undefined,
          mapped: mappedFilter === '' ? '' : mappedFilter === 'true',
          page: nextPage,
          size: PAGE_SIZE,
        });
        setPageData(response);
        setPage(nextPage);
      } catch (error) {
        onError(
          error instanceof ApiError
            ? error.message
            : resolveErrorMessage(error, '학교 검색에 실패했습니다.'),
        );
      } finally {
        setIsSearching(false);
      }
    },
    [keyword, mappedFilter, page, onError],
  );

  async function handleSyncCsv() {
    setIsSyncing(true);
    try {
      const result = await syncAdminSchoolsCsv();
      onSuccess(result.message || `CSV 동기화 완료 (${result.syncedCount}건)`);
      onDataChange();
      await loadSchools(page);
    } catch (error) {
      onError(
        error instanceof ApiError
          ? error.message
          : resolveErrorMessage(error, 'CSV 동기화에 실패했습니다.'),
      );
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleSyncNeis() {
    setIsSyncing(true);
    try {
      const result = await syncAdminNeisSchools(50);
      onSuccess(
        result.message ||
          `NEIS 매핑 완료 (처리 ${result.processedCount}, 성공 ${result.successCount}, 실패 ${result.failedCount})`,
      );
      onDataChange();
      await loadSchools(page);
    } catch (error) {
      onError(
        error instanceof ApiError
          ? error.message
          : resolveErrorMessage(error, 'NEIS 일괄 매핑에 실패했습니다.'),
      );
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <AdminSectionCard title="2. 학교 조회">
      <div className="admin-field">
        <label htmlFor="admin-school-keyword">학교명·지역·코드</label>
        <input
          id="admin-school-keyword"
          type="text"
          value={keyword}
          placeholder="예: 개포중, 서울"
          onChange={(event) => setKeyword(event.target.value)}
        />
      </div>

      <AdminFilterChips
        ariaLabel="NEIS 매핑 필터"
        options={SCHOOL_MAPPED_FILTER_OPTIONS}
        value={mappedFilter}
        onChange={setMappedFilter}
      />

      <div className="admin-search-actions">
        <button
          type="button"
          className="admin-btn admin-btn--primary"
          disabled={isSearching}
          onClick={() => void loadSchools(0)}
        >
          검색
        </button>
      </div>

      <div className="admin-inline-actions admin-inline-actions--spaced">
        <button
          type="button"
          className="admin-btn admin-btn--secondary"
          disabled={isSyncing}
          onClick={() => void handleSyncCsv()}
        >
          CSV 동기화 (추가·갱신)
        </button>
        <button
          type="button"
          className="admin-btn admin-btn--secondary"
          disabled={isSyncing}
          onClick={() => void handleSyncNeis()}
        >
          NEIS 코드 일괄 매핑
        </button>
      </div>
      <p className="admin-helper">
        CSV 동기화는 학교 목록 추가·갱신용입니다. NEIS 일괄 매핑은 미매핑 학교 최대 50건씩 NEIS
        코드를 조회·저장합니다.
      </p>

      {!pageData ? (
        <p className="admin-status">검색 버튼을 눌러 학교 목록을 조회하세요.</p>
      ) : pageData.items.length === 0 ? (
        <p className="admin-status">검색 결과가 없습니다.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>코드</th>
                <th>학교명</th>
                <th>지역</th>
                <th>구분</th>
                <th>NEIS</th>
              </tr>
            </thead>
            <tbody>
              {pageData.items.map((school) => (
                <tr key={school.schoolCode}>
                  <td data-label="코드">{school.schoolCode}</td>
                  <td data-label="학교명">{school.schoolName}</td>
                  <td data-label="지역">{school.region || '-'}</td>
                  <td data-label="구분">{school.schoolType || '-'}</td>
                  <td data-label="NEIS">
                    <span
                      className={`admin-badge ${school.neisMapped ? 'admin-badge--mapped' : 'admin-badge--unmapped'}`}
                    >
                      {school.neisMapped ? '매핑됨' : '미매핑'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminPager pageData={pageData} onPageChange={(nextPage) => void loadSchools(nextPage)} />
    </AdminSectionCard>
  );
}
