import { useEffect, useMemo, useState } from 'react';
import { getTeacherTodayMoodSummaries, getTeacherWeeklyMoodSummaries } from '../../api/teacher.api';
import type { MoodLevelCode } from '../../api/types/student';
import type { StudentMoodSummary, TeacherWeeklyMoodResponse } from '../../api/types/teacher';
import {
  Badge,
  EmptyState,
  PageTitle,
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
import AttentionPanel from './AttentionPanel';
import { MOOD_ORDER, MOOD_TONE, displayName, needsAttention, resolveErrorMessage } from './shared';

type MoodTab = 'today' | 'weekly';

const MOOD_LABEL: Record<MoodLevelCode, string> = {
  SUNNY: '맑음',
  FAIR: '보통',
  CLOUDY: '흐림',
  RAINY: '우울',
  STORMY: '힘듦',
};

export default function MoodView({ onError }: { onError: (message: string) => void }) {
  const [tab, setTab] = useState<MoodTab>('today');
  const [today, setToday] = useState<StudentMoodSummary[] | null>(null);
  const [weekly, setWeekly] = useState<TeacherWeeklyMoodResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    getTeacherTodayMoodSummaries()
      .then((data) => !cancelled && setToday(data))
      .catch((error) => {
        if (cancelled) return;
        setToday([]);
        onError(resolveErrorMessage(error, '오늘 마음 날씨를 불러오지 못했습니다.'));
      });
    return () => {
      cancelled = true;
    };
  }, [onError]);

  useEffect(() => {
    if (tab !== 'weekly' || weekly) return;
    let cancelled = false;
    getTeacherWeeklyMoodSummaries()
      .then((data) => !cancelled && setWeekly(data))
      .catch((error) => {
        if (!cancelled) onError(resolveErrorMessage(error, '최근 7일 마음 날씨를 불러오지 못했습니다.'));
      });
    return () => {
      cancelled = true;
    };
  }, [onError, tab, weekly]);

  return (
    <div className="flex flex-col gap-5">
      <PageTitle
        title="마음 날씨"
        description="학생이 하루 한 번 남기는 기분 기록입니다. 우울·힘듦을 남긴 학생은 따로 표시합니다."
      />
      <AttentionPanel />
      <Tabs
        items={[
          { value: 'today', label: '오늘' },
          { value: 'weekly', label: '최근 7일' },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === 'today' ? <TodayMood rows={today} /> : <WeeklyMood data={weekly} />}
    </div>
  );
}

function TodayMood({ rows }: { rows: StudentMoodSummary[] | null }) {
  const sorted = useMemo(() => {
    if (!rows) return [];
    const rank = (row: StudentMoodSummary) =>
      row.moodLevel ? (needsAttention(row.moodLevel.code) ? 0 : 1) : 2;
    return [...rows].sort((a, b) => rank(a) - rank(b));
  }, [rows]);

  if (!rows) return <LoadingBlock />;
  if (rows.length === 0) {
    return (
      <Panel>
        <EmptyState className="py-6" title="연결된 학생이 없습니다" description="설정에서 초대 코드를 학생에게 알려 주세요." />
      </Panel>
    );
  }

  const counts = countByMood(rows.map((row) => row.moodLevel?.code ?? null));
  const recorded = rows.length - counts.none;
  const attention = counts.RAINY + counts.STORMY;

  return (
    <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
      <Panel title="오늘 분포" description={`${rows.length}명 중 ${recorded}명 기록`}>
        <MoodBars counts={counts} total={rows.length} includeNone />
        <p className="mt-4 border-t border-gray-100 pt-3 text-[13px] text-gray-600">
          살펴볼 학생 <span className="font-semibold text-gray-900 tabular-nums">{attention}명</span>
          <span className="text-gray-400"> · 우울·힘듦</span>
        </p>
      </Panel>

      <Table footer={<span>살펴볼 학생을 맨 위에 보여 줍니다</span>}>
        <THead>
          <tr>
            <Th>학생</Th>
            <Th>오늘 마음 날씨</Th>
          </tr>
        </THead>
        <TBody>
          {sorted.map((row) => (
            <Tr key={row.studentUsername}>
              <Td className="w-1/2">{displayName(row.studentName, row.studentUsername)}</Td>
              <Td>
                {row.moodLevel ? (
                  <Badge tone={MOOD_TONE[row.moodLevel.code]} dot={needsAttention(row.moodLevel.code)}>
                    {row.moodLevel.label}
                  </Badge>
                ) : (
                  <span className="text-gray-400">기록 안 함</span>
                )}
              </Td>
            </Tr>
          ))}
        </TBody>
      </Table>
    </div>
  );
}

function WeeklyMood({ data }: { data: TeacherWeeklyMoodResponse | null }) {
  if (!data) return <LoadingBlock />;

  const days = data.students[0]?.dailyRecords.map((record) => record.date) ?? [];
  const counts = countFromServer(data);
  const total = data.totalRecords;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
        <Panel title="7일 분포" description={`${data.startDate} ~ ${data.endDate} · 기록 ${total}건`}>
          {total === 0 ? (
            <p className="text-[13px] text-gray-500">이 기간에 남긴 기록이 없습니다.</p>
          ) : (
            <MoodBars counts={counts} total={total} />
          )}
        </Panel>

        {data.students.length === 0 ? (
          <Panel>
            <EmptyState className="py-6" title="연결된 학생이 없습니다" />
          </Panel>
        ) : (
          <Table footer={<span>빈칸은 그날 기록하지 않은 날입니다</span>}>
            <THead>
              <tr>
                <Th>학생</Th>
                {days.map((date) => (
                  <Th key={date} align="center" className="px-1.5">
                    <ShortDay date={date} />
                  </Th>
                ))}
                <Th align="right">기록</Th>
              </tr>
            </THead>
            <TBody>
              {data.students.map((student) => (
                <Tr key={student.studentUsername}>
                  <Td className="whitespace-nowrap">{displayName(student.studentName, student.studentUsername)}</Td>
                  {student.dailyRecords.map((record) => {
                    const code = record.moodLevel?.code;
                    return (
                      <Td key={record.date} align="center" className="px-1.5">
                        {code ? (
                          <span
                            title={record.moodLevel?.label}
                            className={cn(
                              'inline-flex h-6 min-w-9 items-center justify-center rounded px-1 text-xs',
                              code === 'STORMY'
                                ? 'bg-red-50 font-medium text-red-700'
                                : code === 'RAINY'
                                  ? 'bg-amber-50 font-medium text-amber-800'
                                  : 'text-gray-700',
                            )}
                          >
                            {MOOD_LABEL[code]}
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </Td>
                    );
                  })}
                  <Td muted numeric className="whitespace-nowrap">
                    {student.recordCount}/{days.length}일
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

type MoodCounts = Record<MoodLevelCode, number> & { none: number };

function countByMood(codes: Array<MoodLevelCode | null>): MoodCounts {
  const counts: MoodCounts = { SUNNY: 0, FAIR: 0, CLOUDY: 0, RAINY: 0, STORMY: 0, none: 0 };
  codes.forEach((code) => {
    if (code) counts[code] += 1;
    else counts.none += 1;
  });
  return counts;
}

function countFromServer(data: TeacherWeeklyMoodResponse): MoodCounts {
  const counts: MoodCounts = { SUNNY: 0, FAIR: 0, CLOUDY: 0, RAINY: 0, STORMY: 0, none: 0 };
  data.moodCounts.forEach((item) => {
    if (item.code in counts) counts[item.code as MoodLevelCode] = item.count;
  });
  return counts;
}

/** 가로 막대 — 포인트 색 하나, 우울·힘듦만 상태 색 */
function MoodBars({ counts, total, includeNone = false }: { counts: MoodCounts; total: number; includeNone?: boolean }) {
  const rows: Array<{ key: string; label: string; count: number; bar: string }> = MOOD_ORDER.map((code) => ({
    key: code,
    label: MOOD_LABEL[code],
    count: counts[code],
    bar: code === 'STORMY' ? 'bg-red-400' : code === 'RAINY' ? 'bg-amber-400' : 'bg-blue-600',
  }));
  if (includeNone) rows.push({ key: 'none', label: '기록 안 함', count: counts.none, bar: 'bg-gray-300' });

  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((row) => {
        const percent = total > 0 ? Math.round((row.count / total) * 100) : 0;
        return (
          <li key={row.key} className="grid grid-cols-[64px_minmax(0,1fr)_32px] items-center gap-3 text-[13px]">
            <span className="text-gray-600">{row.label}</span>
            <span className="h-1.5 overflow-hidden rounded-full bg-gray-100">
              <span className={cn('block h-full rounded-full', row.bar)} style={{ width: `${percent}%` }} />
            </span>
            <span className="text-right font-medium text-gray-900 tabular-nums">{row.count}</span>
          </li>
        );
      })}
    </ul>
  );
}

function ShortDay({ date }: { date: string }) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return <>{date}</>;
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][parsed.getDay()];
  return (
    <span className="flex flex-col leading-tight">
      <span>{parsed.getDate()}</span>
      <span className={cn('text-[11px]', parsed.getDay() === 0 || parsed.getDay() === 6 ? 'text-gray-400' : '')}>
        {weekday}
      </span>
    </span>
  );
}

function LoadingBlock() {
  return (
    <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
