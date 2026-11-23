import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { DatabaseZap, FileSpreadsheet, Search } from 'lucide-react';
import { searchAdminSchools, syncAdminNeisSchools, syncAdminSchoolsCsv } from '../../api/admin.api';
import type { AdminPageResponse, AdminSchoolSummary } from '../../api/types/admin';
import { PAGE_SIZE } from '../../admin/constants';
import {
  Badge,
  Button,
  EmptyState,
  Input,
  PageTitle,
  Pagination,
  Panel,
  Skeleton,
  TBody,
  THead,
  Table,
  Tabs,
  Td,
  Th,
  Tr,
  cn,
} from '../../ds';
import { type FeedbackHandlers, resolveErrorMessage } from '../common';

type MappedFilter = 'ALL' | 'MAPPED' | 'UNMAPPED';

export default function SchoolsView({ onSuccess, onError }: FeedbackHandlers) {
  const [keyword, setKeyword] = useState('');
  const [mapped, setMapped] = useState<MappedFilter>('ALL');
  const [data, setData] = useState<AdminPageResponse<AdminSchoolSummary> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [syncing, setSyncing] = useState<'csv' | 'neis' | null>(null);

  const load = useCallback(
    async (page: number, nextMapped: MappedFilter = mapped) => {
      setIsLoading(true);
      try {
        setData(
          await searchAdminSchools({
            keyword: keyword.trim() || undefined,
            mapped: nextMapped === 'ALL' ? '' : nextMapped === 'MAPPED',
            page,
            size: PAGE_SIZE,
          }),
        );
      } catch (error) {
        onError(resolveErrorMessage(error, '학교를 불러오지 못했습니다.'));
      } finally {
        setIsLoading(false);
      }
    },
    [keyword, mapped, onError],
  );

  // 처음 들어오면 첫 페이지를 바로 불러옵니다. (검색 조건이 바뀔 때마다 다시 부르지 않도록 의존성 비움)
  useEffect(() => void load(0), []);

  function submit(event: FormEvent) {
    event.preventDefault();
    void load(0);
  }

  async function syncCsv() {
    if (!window.confirm('학교 목록 CSV로 학교를 추가·갱신할까요? 기존 학교 정보가 CSV 내용으로 바뀔 수 있습니다.'))
      return;
    setSyncing('csv');
    try {
      const result = await syncAdminSchoolsCsv();
      onSuccess(result.message || `CSV 동기화를 마쳤습니다. (${result.syncedCount}건)`);
      await load(data?.page ?? 0);
    } catch (error) {
      onError(resolveErrorMessage(error, 'CSV 동기화를 하지 못했습니다.'));
    } finally {
      setSyncing(null);
    }
  }

  async function syncNeis() {
    if (!window.confirm('NEIS에 연결되지 않은 학교를 최대 50곳까지 조회해 코드를 저장할까요?')) return;
    setSyncing('neis');
    try {
      const result = await syncAdminNeisSchools(50);
      onSuccess(
        result.message ||
          `NEIS 연결을 마쳤습니다. 처리 ${result.processedCount} · 성공 ${result.successCount} · 실패 ${result.failedCount}`,
      );
      await load(data?.page ?? 0);
    } catch (error) {
      onError(resolveErrorMessage(error, 'NEIS 연결을 하지 못했습니다.'));
    } finally {
      setSyncing(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageTitle
        title="학교"
        description="가입에 쓰이는 학교 목록입니다. 급식·시간표·학사일정은 NEIS 학교 코드로 불러옵니다."
        actions={
          <>
            <Button
              size="sm"
              icon={<FileSpreadsheet size={16} aria-hidden />}
              loading={syncing === 'csv'}
              disabled={syncing !== null}
              onClick={() => void syncCsv()}
            >
              CSV 동기화
            </Button>
            <Button
              size="sm"
              icon={<DatabaseZap size={16} aria-hidden />}
              loading={syncing === 'neis'}
              disabled={syncing !== null}
              onClick={() => void syncNeis()}
            >
              NEIS 일괄 연결
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3">
        <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-48 flex-1 sm:max-w-sm">
            <Search size={16} className="absolute top-1/2 left-2.5 -translate-y-1/2 text-gray-400" aria-hidden />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="학교 이름, 지역, 코드"
              aria-label="학교 검색"
              controlSize="sm"
              className="pl-8"
            />
          </div>
          <Button type="submit" size="sm" loading={isLoading}>
            검색
          </Button>
        </form>

        <Tabs
          items={[
            { value: 'ALL', label: '전체' },
            { value: 'MAPPED', label: 'NEIS 연결됨' },
            { value: 'UNMAPPED', label: '연결 안 됨' },
          ]}
          value={mapped}
          onChange={(next) => {
            setMapped(next);
            void load(0, next);
          }}
        />

        {!data ? (
          <Skeleton className="h-64 w-full" />
        ) : data.items.length === 0 ? (
          <Panel>
            <EmptyState className="py-6" title="조건에 맞는 학교가 없습니다" />
          </Panel>
        ) : (
          <Table
            className={cn(isLoading && 'opacity-60')}
            footer={
              <Pagination
                page={data.page}
                size={data.size}
                total={data.totalElements}
                onChange={(page) => void load(page)}
                disabled={isLoading}
              />
            }
          >
            <THead>
              <tr>
                <Th>학교</Th>
                <Th className="hidden sm:table-cell">지역</Th>
                <Th className="hidden md:table-cell">구분</Th>
                <Th>코드</Th>
                <Th>NEIS</Th>
              </tr>
            </THead>
            <TBody>
              {data.items.map((school) => (
                <Tr key={school.schoolCode}>
                  <Td className="whitespace-nowrap">{school.schoolName}</Td>
                  <Td muted className="hidden whitespace-nowrap sm:table-cell">
                    {school.region || '-'}
                  </Td>
                  <Td muted className="hidden whitespace-nowrap md:table-cell">
                    {school.schoolType || '-'}
                  </Td>
                  <Td muted className="font-mono text-xs select-all">
                    {school.schoolCode}
                  </Td>
                  <Td>
                    {school.neisMapped ? (
                      <Badge
                        tone="success"
                        className="font-mono"
                      >{`${school.neisOfficeCode}·${school.neisSchoolCode}`}</Badge>
                    ) : (
                      <Badge tone="warning">연결 안 됨</Badge>
                    )}
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </div>
    </div>
  );
}
