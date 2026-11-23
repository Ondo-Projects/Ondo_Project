import { useEffect, useMemo, useState } from 'react';
import { ScrollText } from 'lucide-react';
import { getTeacherPreCounselingProfile } from '../../api/teacher.api';
import type { PreCounselingProfileSummary } from '../../api/types/home';
import type { PreCounselingProfile } from '../../api/types/student';
import {
  Badge,
  Button,
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
import { displayName, formatCompactDateTime, resolveErrorMessage, scrollToDetailOnNarrow } from './shared';

type Filter = 'ALL' | 'DONE' | 'TODO';
const DETAIL_ID = 'precounsel-detail';

interface PreCounselViewProps {
  prefetched: PreCounselingProfileSummary[] | null;
  loaded: boolean;
  onError: (message: string) => void;
}

export default function PreCounselView({ prefetched, loaded, onError }: PreCounselViewProps) {
  const [filter, setFilter] = useState<Filter>('ALL');
  const [selected, setSelected] = useState<PreCounselingProfileSummary | null>(null);
  const [profile, setProfile] = useState<PreCounselingProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const rows = useMemo(() => prefetched ?? [], [prefetched]);
  const doneCount = rows.filter((row) => row.completed).length;
  const visible = rows.filter((row) => (filter === 'ALL' ? true : filter === 'DONE' ? row.completed : !row.completed));

  // 목록이 새로 고쳐져 선택한 학생이 사라지면 닫기
  useEffect(() => {
    if (selected && !rows.some((row) => row.studentUsername === selected.studentUsername)) {
      setSelected(null);
      setProfile(null);
    }
  }, [rows, selected]);

  async function open(row: PreCounselingProfileSummary) {
    setSelected(row);
    setProfile(null);
    scrollToDetailOnNarrow(DETAIL_ID);
    if (!row.completed) return;
    setIsLoading(true);
    try {
      setProfile(await getTeacherPreCounselingProfile(row.studentUsername));
    } catch (error) {
      setSelected(null);
      onError(resolveErrorMessage(error, '사전상담 카드를 불러오지 못했습니다.'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageTitle
        title="사전상담 카드"
        description="상담 전에 학생이 직접 작성한 자기소개입니다. 카드를 열면 열람 기록이 남습니다."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
        <div className="flex min-w-0 flex-col gap-3">
          <Tabs
            items={[
              { value: 'ALL', label: '전체', count: rows.length },
              { value: 'DONE', label: '작성', count: doneCount },
              { value: 'TODO', label: '미작성', count: rows.length - doneCount },
            ]}
            value={filter}
            onChange={setFilter}
          />
          {!loaded ? (
            <Skeleton className="h-48 w-full" />
          ) : rows.length === 0 ? (
            <Panel>
              <EmptyState className="py-6" title="연결된 학생이 없습니다" description="설정에서 초대 코드를 학생에게 알려 주세요." />
            </Panel>
          ) : (
            <Table footer={<span>{rows.length}명 중 {doneCount}명 작성</span>}>
              <THead>
                <tr>
                  <Th>학생</Th>
                  <Th>상태</Th>
                  <Th align="right">최종 수정</Th>
                </tr>
              </THead>
              <TBody>
                {visible.map((row) => (
                  <Tr
                    key={row.studentUsername}
                    interactive
                    tabIndex={0}
                    selected={selected?.studentUsername === row.studentUsername}
                    onClick={() => void open(row)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        void open(row);
                      }
                    }}
                  >
                    <Td className="w-1/2">{displayName(row.studentName, row.studentUsername)}</Td>
                    <Td>
                      {row.completed ? <Badge tone="success">작성</Badge> : <Badge>미작성</Badge>}
                    </Td>
                    <Td muted numeric className="whitespace-nowrap">
                      {formatCompactDateTime(row.updatedAt)}
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </div>

        <div id={DETAIL_ID} className={cn('scroll-mt-28 lg:sticky lg:top-20', !selected && 'hidden lg:block')}>
          <Panel
            title={selected ? displayName(selected.studentName, selected.studentUsername) : '카드 내용'}
            description={profile ? `최종 수정 ${formatCompactDateTime(profile.updatedAt)}` : undefined}
            actions={
              selected ? (
                <Button size="sm" variant="ghost" onClick={() => setSelected(null)}>
                  닫기
                </Button>
              ) : undefined
            }
            flush
          >
            {!selected ? (
              <EmptyState title="학생을 선택하세요" description="목록에서 학생을 누르면 카드가 열립니다." />
            ) : !selected.completed ? (
              <EmptyState title="아직 작성하지 않았습니다" description="학생이 카드를 작성하면 여기에서 볼 수 있습니다." />
            ) : isLoading || !profile ? (
              <div className="flex flex-col gap-2 p-4">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <ProfileBody profile={profile} />
            )}
          </Panel>
          {selected?.completed ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
              <ScrollText size={14} aria-hidden />
              이 카드를 연 기록은 관리자 열람 기록에 남습니다.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ProfileBody({ profile }: { profile: PreCounselingProfile }) {
  const sections: Array<{ title: string; rows: Array<[string, string | null | undefined]> }> = [
    {
      title: '기본 정보',
      rows: [
        ['이름', profile.studentName],
        ['생년월일', profile.birthDate],
        ['연락처', profile.studentPhone],
        ['보호자 연락처', profile.parentPhone],
        ['MBTI', profile.mbti],
        ['장래 희망', profile.futureHope],
        ['좌우명·좋아하는 말', profile.favoriteWords],
      ],
    },
    {
      title: '자기 이해와 성향',
      rows: [
        ['장점', profile.personalityStrength],
        ['단점', profile.personalityWeakness],
        ['취미·특기·관심사', profile.hobbiesSpecialtiesInterests],
        ['가장 행복할 때', profile.happiestMoment],
        ['스트레스받을 때', profile.stressfulMoment],
        ['스트레스 푸는 방법', profile.stressReliefMethod],
      ],
    },
    {
      title: '친구 관계와 학교생활',
      rows: [
        ['작년에 기억나는 일', profile.memorableSchoolMoment],
        ['친해지고 싶은 친구', profile.desiredFriendType],
        ['올해 해 보고 싶은 역할', profile.desiredClassRole],
      ],
    },
  ];

  return (
    <div className="divide-y divide-gray-200">
      {sections.map((section) => (
        <section key={section.title} className="p-4">
          <h3 className="mb-2 text-xs font-semibold text-gray-500">{section.title}</h3>
          <dl className="grid grid-cols-[112px_minmax(0,1fr)] gap-x-3 gap-y-2 text-[13px]">
            {section.rows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-gray-500">{label}</dt>
                <dd className={cn('whitespace-pre-wrap', value?.trim() ? 'text-gray-900' : 'text-gray-400')}>
                  {value?.trim() || '-'}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
