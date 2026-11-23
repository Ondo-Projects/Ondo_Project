import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { getAdminActivityLogs, getAdminDashboard, getAdminStatistics, getAdminSystemStatus } from '../../api/admin.api';
import type {
  AdminActivityLog,
  AdminDashboardResponse,
  AdminStatisticsResponse,
  AdminSystemStatusResponse,
} from '../../api/types/admin';
import { ACTION_LABELS } from '../../admin/constants';
import { Badge, Button, EmptyState, PageTitle, Panel, Skeleton, StatStrip, cn } from '../../ds';
import { formatCompactDateTime, resolveErrorMessage } from '../common';

const COUNSEL_ROWS: Array<{ key: string; label: string; bar: string }> = [
  { key: 'WAITING', label: '대기', bar: 'bg-amber-400' },
  { key: 'CONFIRMED', label: '확정', bar: 'bg-blue-600' },
  { key: 'COMPLETED', label: '완료', bar: 'bg-emerald-500' },
  { key: 'CANCELLED', label: '취소', bar: 'bg-gray-300' },
];

/** 백엔드 MoodLevelDto 라벨과 같게 */
const MOOD_ROWS: Array<{ key: string; label: string; bar: string }> = [
  { key: 'SUNNY', label: '맑음', bar: 'bg-blue-600' },
  { key: 'FAIR', label: '보통', bar: 'bg-blue-600' },
  { key: 'CLOUDY', label: '흐림', bar: 'bg-blue-600' },
  { key: 'RAINY', label: '우울', bar: 'bg-amber-400' },
  { key: 'STORMY', label: '힘듦', bar: 'bg-red-400' },
];

interface OverviewViewProps {
  refreshKey: number;
  onError: (message: string) => void;
  onOpenAudit: () => void;
}

export default function OverviewView({ refreshKey, onError, onOpenAudit }: OverviewViewProps) {
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [system, setSystem] = useState<AdminSystemStatusResponse | null>(null);
  const [stats, setStats] = useState<AdminStatisticsResponse | null>(null);
  const [activity, setActivity] = useState<AdminActivityLog[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fail = (fallback: string) => (error: unknown) => {
      if (!cancelled) onError(resolveErrorMessage(error, fallback));
    };
    getAdminDashboard()
      .then((data) => !cancelled && setDashboard(data))
      .catch(fail('운영 현황을 불러오지 못했습니다.'));
    getAdminSystemStatus()
      .then((data) => !cancelled && setSystem(data))
      .catch(fail('시스템 상태를 불러오지 못했습니다.'));
    getAdminStatistics()
      .then((data) => !cancelled && setStats(data))
      .catch(fail('서비스 통계를 불러오지 못했습니다.'));
    getAdminActivityLogs(0, 5)
      .then((data) => !cancelled && setActivity(data.items))
      .catch(fail('관리자 활동 기록을 불러오지 못했습니다.'));
    return () => {
      cancelled = true;
    };
  }, [onError, refreshKey]);

  const d = dashboard;
  const mappedRate = d && d.totalSchools > 0 ? Math.round((d.neisMappedSchools / d.totalSchools) * 100) : null;

  return (
    <div className="flex flex-col gap-5">
      <PageTitle title="운영 현황" description="회원, 학교, 상담 이용 현황과 서버 설정을 한눈에 봅니다." />

      {!d ? (
        <Skeleton className="h-[74px] w-full" />
      ) : (
        <StatStrip
          items={[
            {
              label: '전체 회원',
              value: d.totalUsers.toLocaleString('ko-KR'),
              hint: `학생 ${d.studentCount} · 교사 ${d.teacherCount}`,
            },
            { label: '학교', value: d.totalSchools.toLocaleString('ko-KR'), hint: `NEIS 연결 ${mappedRate ?? '-'}%` },
            {
              label: '상담 글',
              value: d.totalCounselingPosts.toLocaleString('ko-KR'),
              hint: `오늘 ${d.counselingPostsToday}건`,
            },
            {
              label: '오늘 열람 기록',
              value: (d.counselingAccessLogsToday + d.preCounselAccessLogsToday).toLocaleString('ko-KR'),
              hint: `상담 ${d.counselingAccessLogsToday} · 사전상담 ${d.preCounselAccessLogsToday}`,
            },
          ]}
        />
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="상담 상태" description="전체 상담 글 기준">
          {stats ? (
            <Bars rows={COUNSEL_ROWS} values={stats.counselingByStatus} />
          ) : (
            <Skeleton className="h-28 w-full" />
          )}
        </Panel>
        <Panel title="마음 날씨" description="최근 7일 기록">
          {stats ? <Bars rows={MOOD_ROWS} values={stats.moodByLevelLast7Days} /> : <Skeleton className="h-28 w-full" />}
        </Panel>
        <Panel title="서버 설정" description="운영 서버에서는 모두 '운영'·'설정됨'이어야 합니다" flush>
          {system ? <SystemTable system={system} /> : <Skeleton className="m-4 h-28" />}
        </Panel>
      </div>

      <Panel
        title="최근 관리자 작업"
        actions={
          <Button size="sm" variant="ghost" onClick={onOpenAudit}>
            전체 기록
            <ArrowRight size={16} aria-hidden />
          </Button>
        }
        flush
      >
        {!activity ? (
          <Skeleton className="m-4 h-24" />
        ) : activity.length === 0 ? (
          <EmptyState title="기록된 관리자 작업이 없습니다" />
        ) : (
          <table className="w-full text-left text-[13px]">
            <tbody className="divide-y divide-gray-100">
              {activity.map((log) => (
                <tr key={log.id}>
                  <td className="h-10 w-28 px-4 whitespace-nowrap text-gray-500 tabular-nums">
                    {formatCompactDateTime(log.createdAt)}
                  </td>
                  <td className="px-2 whitespace-nowrap text-gray-900">{ACTION_LABELS[log.action] ?? log.action}</td>
                  <td className="hidden px-2 text-gray-500 md:table-cell">{log.targetUsername ?? '-'}</td>
                  <td className="px-4 text-right whitespace-nowrap text-gray-500">{log.adminUsername}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}

function Bars({
  rows,
  values,
}: {
  rows: Array<{ key: string; label: string; bar: string }>;
  values: Record<string, number>;
}) {
  const total = rows.reduce((sum, row) => sum + (values[row.key] ?? 0), 0);
  if (total === 0) return <p className="text-[13px] text-gray-500">아직 데이터가 없습니다.</p>;
  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((row) => {
        const count = values[row.key] ?? 0;
        const percent = Math.round((count / total) * 100);
        return (
          <li key={row.key} className="grid grid-cols-[40px_minmax(0,1fr)_64px] items-center gap-3 text-[13px]">
            <span className="text-gray-600">{row.label}</span>
            <span className="h-1.5 overflow-hidden rounded-full bg-gray-100">
              <span className={cn('block h-full rounded-full', row.bar)} style={{ width: `${percent}%` }} />
            </span>
            <span className="text-right tabular-nums">
              <span className="font-medium text-gray-900">{count.toLocaleString('ko-KR')}</span>
              <span className="ml-1 text-xs text-gray-400">{percent}%</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function SystemTable({ system }: { system: AdminSystemStatusResponse }) {
  const rows = [
    { label: 'NEIS (급식·시간표)', dev: system.neisDevMode, key: system.neisApiKeyConfigured },
    { label: '날씨', dev: system.weatherDevMode, key: system.weatherApiKeyConfigured },
    { label: '개인정보 암호화', dev: system.encryptionDevMode, key: system.encryptionKeyConfigured },
  ];
  return (
    <table className="w-full text-left text-[13px]">
      <thead className="border-b border-gray-200 bg-gray-50/60">
        <tr className="text-xs text-gray-500">
          <th className="h-9 px-4 font-medium">항목</th>
          <th className="h-9 px-2 font-medium">모드</th>
          <th className="h-9 px-4 font-medium">키</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {rows.map((row) => (
          <tr key={row.label}>
            <td className="h-10 px-4 whitespace-nowrap text-gray-900">{row.label}</td>
            <td className="px-2">
              {row.dev ? <Badge tone="warning">개발</Badge> : <Badge tone="success">운영</Badge>}
            </td>
            <td className="px-4">
              {row.key ? <Badge tone="success">설정됨</Badge> : <Badge tone="danger">미설정</Badge>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
