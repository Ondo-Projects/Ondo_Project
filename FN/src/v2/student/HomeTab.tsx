import { useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { saveStudentTodayMood } from '../../api/student.api';
import type { MoodLevelCode } from '../../api/types/student';
import { Button, ListRow, Skeleton, cn } from '../../ds';
import { buildStudentTodayTodos, type TodayTodoItem } from '../../student/studentTodayTodo';
import type { StudentSchoolLifeState } from '../../student/useStudentSchoolLife';
import { type FeedbackHandlers, formatCompactDateTime, resolveErrorMessage } from '../common';
import { MOOD_CHOICES, legacyTargetToHash, todayLabel } from './shared';
import { Block } from './ui';

interface HomeTabProps extends FeedbackHandlers {
  name: string;
  schoolName: string;
  life: StudentSchoolLifeState;
  go: (hash: string) => void;
}

export default function HomeTab({ name, schoolName, life, go, onSuccess, onError }: HomeTabProps) {
  const ready = !life.isLoading && life.workspaceLoaded;
  const moodLabel = life.todayMood?.moodLevel?.label ?? '';

  const todos = useMemo(() => {
    const items = buildStudentTodayTodos({
      pageLoading: life.isLoading,
      hasAssignment: life.hasAssignment,
      meals: life.meals,
      schedule: life.schedule,
      timetable: life.timetable,
      notices: life.notices,
      moodRecorded: ready ? Boolean(life.todayMood?.moodLevel) && life.todayMood?.recorded !== false : null,
      moodSummary: moodLabel,
      preCounselCompleted: ready ? (life.preCounselProfile?.completed ?? false) : null,
      counselingPosts: ready ? life.counselingPosts : null,
      suggestions: ready ? life.suggestions : null,
      suggestionsLoaded: ready,
    });
    // 마음 날씨는 바로 위에서 고르므로 목록에서는 뺍니다.
    // 예전 화면 이름을 새 메뉴 이름과 맞춥니다.
    const rename: Record<string, string> = { '선생님 알림': '선생님 공지', '사전 상담 카드': '사전상담 카드' };
    return items
      .filter((item) => item.label !== '마음 날씨' && item.label !== '담당 교사')
      .map((item) => ({ ...item, label: rename[item.label] ?? item.label }));
  }, [life, moodLabel, ready]);

  const classLabel =
    life.timetable?.grade && life.timetable.classNumber
      ? ` · ${life.timetable.grade}학년 ${life.timetable.classNumber}반`
      : '';

  return (
    <div className="flex flex-col gap-6">
      <div className="px-1 pt-1">
        <p className="text-[13px] text-gray-500">{todayLabel()}</p>
        <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-gray-900">{name}님, 오늘도 반가워요</h1>
        <p className="mt-0.5 text-[13px] text-gray-500">
          {schoolName}
          {classLabel}
        </p>
      </div>

      {ready && !life.hasAssignment ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-900">담임 선생님과 먼저 연결하세요</p>
          <p className="mt-1 text-[13px] leading-relaxed text-blue-800">
            선생님께 받은 6자리 초대 코드를 입력하면 상담 신청, 사전상담 카드, 학급 공지를 쓸 수 있어요.
          </p>
          <Button variant="primary" size="sm" className="mt-3" onClick={() => go('#me/teacher')}>
            초대 코드 입력
            <ArrowRight size={16} aria-hidden />
          </Button>
        </div>
      ) : null}

      <MoodPicker
        key={life.todayMood?.moodLevel?.code ?? 'none'}
        initial={ready ? (life.todayMood?.moodLevel?.code ?? null) : undefined}
        onSuccess={onSuccess}
        onError={onError}
      />

      <Block title="오늘 할 일" flush>
        <div className="divide-y divide-gray-100">
          {todos.map((item) => (
            <TodoRow key={item.label} item={item} onOpen={() => go(`#${legacyTargetToHash(item.target)}`)} />
          ))}
        </div>
      </Block>

      {life.hasAssignment && life.notices && life.notices.length > 0 ? (
        <Block
          title="선생님 공지"
          action={
            <button type="button" className="text-[13px] font-medium text-blue-700" onClick={() => go('#news')}>
              전체 보기
            </button>
          }
          flush
        >
          <div className="divide-y divide-gray-100">
            {life.notices.slice(0, 2).map((notice) => (
              <button
                key={notice.id}
                type="button"
                onClick={() => go('#news')}
                className="block w-full px-4 py-3 text-left hover:bg-gray-50"
              >
                <span className="block truncate text-sm font-medium text-gray-900">{notice.title}</span>
                <span className="mt-0.5 block truncate text-[13px] text-gray-500">{notice.content}</span>
                <span className="mt-1 block text-xs text-gray-400 tabular-nums">
                  {formatCompactDateTime(notice.createdAt)}
                </span>
              </button>
            ))}
          </div>
        </Block>
      ) : null}
    </div>
  );
}

function TodoRow({ item, onOpen }: { item: TodayTodoItem; onOpen: () => void }) {
  const value = (
    <span
      className={cn(
        'text-[13px]',
        item.tone === 'pending' && 'font-medium text-blue-700',
        item.tone === 'warn' && 'font-medium text-amber-800',
        (item.tone === 'done' || item.tone === '') && 'text-gray-500',
      )}
    >
      {item.status}
    </span>
  );
  if (item.disabled) {
    return <ListRow label={item.label} trailing={<Skeleton className="h-4 w-16" />} />;
  }
  return <ListRow label={item.label} value={value} onClick={onOpen} />;
}

/** 오늘 마음 날씨 고르기 — 고르는 즉시 저장 */
function MoodPicker({
  initial,
  onSuccess,
  onError,
}: {
  /** undefined: 아직 불러오는 중 */
  initial: MoodLevelCode | null | undefined;
} & FeedbackHandlers) {
  const [selected, setSelected] = useState<MoodLevelCode | null>(initial ?? null);
  const [saving, setSaving] = useState<MoodLevelCode | null>(null);
  const loading = initial === undefined;

  useEffect(() => {
    if (initial !== undefined) setSelected(initial);
  }, [initial]);

  async function choose(code: MoodLevelCode) {
    if (saving || loading || code === selected) return;
    const previous = selected;
    setSelected(code);
    setSaving(code);
    try {
      const result = await saveStudentTodayMood(code);
      setSelected(result.moodLevel.code);
      onSuccess(`오늘 마음 날씨를 '${result.moodLevel.label}'(으)로 남겼어요.`);
    } catch (error) {
      setSelected(previous);
      onError(resolveErrorMessage(error, '마음 날씨를 저장하지 못했습니다.'));
    } finally {
      setSaving(null);
    }
  }

  return (
    <Block
      title="오늘 마음 날씨"
      footer="하루 한 번 남기고, 바꾸고 싶으면 다시 고르면 돼요. 담임 선생님만 볼 수 있어요."
    >
      <div role="radiogroup" aria-label="오늘 마음 날씨" className="grid grid-cols-5 gap-1.5">
        {MOOD_CHOICES.map(({ code, label, icon: Icon }) => {
          const active = selected === code;
          return (
            <button
              key={code}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={loading || saving !== null}
              onClick={() => void choose(code)}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-md border py-3 text-xs font-medium transition-colors duration-150',
                active ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50',
                (loading || saving !== null) && !active && 'opacity-60',
              )}
            >
              <Icon size={20} aria-hidden className={active ? 'text-blue-700' : 'text-gray-400'} />
              {label}
            </button>
          );
        })}
      </div>
    </Block>
  );
}
