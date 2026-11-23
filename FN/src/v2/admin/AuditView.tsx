import { useCallback, useEffect, useState } from 'react';
import { getAdminActivityLogs, getAdminCounselingAccessLogs, getAdminPreCounselAccessLogs } from '../../api/admin.api';
import type {
  AdminActivityLog,
  AdminCounselingAccessLog,
  AdminPageResponse,
  AdminPreCounselAccessLog,
} from '../../api/types/admin';
import { ACTION_LABELS, PAGE_SIZE } from '../../admin/constants';
import {
  EmptyState,
  Notice,
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
import { formatCompactDateTime, resolveErrorMessage } from '../common';

export type AuditTab = 'counseling' | 'precounsel' | 'admin';

type PageOf<T> = AdminPageResponse<T> | null;

interface AuditViewProps {
  refreshKey: number;
  initialTab?: AuditTab;
  onError: (message: string) => void;
}

export default function AuditView({ refreshKey, initialTab = 'counseling', onError }: AuditViewProps) {
  const [tab, setTab] = useState<AuditTab>(initialTab);
  const [counseling, setCounseling] = useState<PageOf<AdminCounselingAccessLog>>(null);
  const [precounsel, setPrecounsel] = useState<PageOf<AdminPreCounselAccessLog>>(null);
  const [activity, setActivity] = useState<PageOf<AdminActivityLog>>(null);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(
    async (which: AuditTab, page: number) => {
      setIsLoading(true);
      try {
        if (which === 'counseling') setCounseling(await getAdminCounselingAccessLogs(page, PAGE_SIZE));
        else if (which === 'precounsel') setPrecounsel(await getAdminPreCounselAccessLogs(page, PAGE_SIZE));
        else setActivity(await getAdminActivityLogs(page, PAGE_SIZE));
      } catch (error) {
        onError(resolveErrorMessage(error, '기록을 불러오지 못했습니다.'));
      } finally {
        setIsLoading(false);
      }
    },
    [onError],
  );

  useEffect(() => {
    void load(tab, 0);
  }, [load, refreshKey, tab]);

  const current = tab === 'counseling' ? counseling : tab === 'precounsel' ? precounsel : activity;

  return (
    <div className="flex flex-col gap-5">
      <PageTitle
        title="감사 기록"
        description="누가 학생의 민감한 정보를 열어 봤는지, 관리자가 무엇을 바꿨는지 남긴 기록입니다."
      />

      <Notice>
        관리자 화면은 상담 글과 사전상담 카드의 본문을 보여 주지 않습니다. 여기서는 열람 기록만 확인합니다.
      </Notice>

      <Tabs
        items={[
          { value: 'counseling', label: '상담 열람' },
          { value: 'precounsel', label: '사전상담 열람' },
          { value: 'admin', label: '관리자 작업' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {!current ? (
        <Skeleton className="h-64 w-full" />
      ) : current.items.length === 0 ? (
        <Panel>
          <EmptyState className="py-6" title="아직 기록이 없습니다" />
        </Panel>
      ) : (
        <Table
          className={cn(isLoading && 'opacity-60')}
          footer={
            <Pagination
              page={current.page}
              size={current.size}
              total={current.totalElements}
              disabled={isLoading}
              onChange={(page) => void load(tab, page)}
            />
          }
        >
          {tab === 'counseling' && counseling ? (
            <>
              <THead>
                <tr>
                  <Th>열람 시각</Th>
                  <Th>열람한 교사</Th>
                  <Th>학생</Th>
                  <Th className="hidden md:table-cell">상담 제목</Th>
                </tr>
              </THead>
              <TBody>
                {counseling.items.map((log) => (
                  <Tr key={log.id}>
                    <Td muted className="whitespace-nowrap tabular-nums">
                      {formatCompactDateTime(log.accessedAt)}
                    </Td>
                    <Td className="whitespace-nowrap">
                      <Person name={log.teacherName} username={log.teacherUsername} />
                    </Td>
                    <Td className="whitespace-nowrap">
                      <Person name={log.studentName} username={log.studentUsername} />
                    </Td>
                    <Td muted className="hidden max-w-72 truncate md:table-cell">
                      <span className="mr-1 font-mono text-xs text-gray-400">#{log.counselingPostId}</span>
                      {log.counselingTitle}
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </>
          ) : null}

          {tab === 'precounsel' && precounsel ? (
            <>
              <THead>
                <tr>
                  <Th>열람 시각</Th>
                  <Th>열람한 교사</Th>
                  <Th>학생</Th>
                </tr>
              </THead>
              <TBody>
                {precounsel.items.map((log) => (
                  <Tr key={log.id}>
                    <Td muted className="w-36 whitespace-nowrap tabular-nums">
                      {formatCompactDateTime(log.accessedAt)}
                    </Td>
                    <Td className="whitespace-nowrap">
                      <Person name={log.teacherName} username={log.teacherUsername} />
                    </Td>
                    <Td className="whitespace-nowrap">
                      <Person name={log.studentName} username={log.studentUsername} />
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </>
          ) : null}

          {tab === 'admin' && activity ? (
            <>
              <THead>
                <tr>
                  <Th>시각</Th>
                  <Th>작업</Th>
                  <Th>대상</Th>
                  <Th className="hidden md:table-cell">내용</Th>
                  <Th align="right">관리자</Th>
                </tr>
              </THead>
              <TBody>
                {activity.items.map((log) => (
                  <Tr key={log.id}>
                    <Td muted className="whitespace-nowrap tabular-nums">
                      {formatCompactDateTime(log.createdAt)}
                    </Td>
                    <Td className="whitespace-nowrap">{ACTION_LABELS[log.action] ?? log.action}</Td>
                    <Td muted className="font-mono text-xs whitespace-nowrap">
                      {log.targetUsername ?? '-'}
                    </Td>
                    <Td muted className="hidden max-w-72 truncate md:table-cell" title={log.detail ?? undefined}>
                      {log.detail ?? '-'}
                    </Td>
                    <Td muted className="text-right font-mono text-xs whitespace-nowrap">
                      {log.adminUsername}
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </>
          ) : null}
        </Table>
      )}
    </div>
  );
}

function Person({ name, username }: { name: string | null | undefined; username: string }) {
  return (
    <>
      {name?.trim() || username}
      {name?.trim() ? <span className="ml-1.5 font-mono text-xs text-gray-400">{username}</span> : null}
    </>
  );
}
