import { type FormEvent, useEffect, useState } from 'react';
import { GraduationCap, LogOut, MessageSquarePlus, School, UserRound, UserX } from 'lucide-react';
import {
  changeStudentAssignment,
  getStudentAssignmentOptional,
  getStudentClassProfile,
  registerStudentAssignment,
  updateStudentClassProfile,
} from '../../api/student.api';
import { ApiError } from '../../api/types/api-error';
import type { StudentAssignment, StudentClassProfile } from '../../api/types/student';
import type { SuggestionPost } from '../../api/types/suggestion';
import { Button, Field, Input, ListGroup, ListRow, Skeleton } from '../../ds';
import { PATHS } from '../../routes/paths';
import { type FeedbackHandlers, formatCompactDateTime, resolveErrorMessage } from '../common';
import SuggestionScreens from './SuggestionScreens';
import { Block, StickyFooter } from './ui';

interface MeTabProps extends FeedbackHandlers {
  sub: string[];
  name: string;
  username: string;
  schoolName: string;
  assignment: StudentAssignment | null;
  suggestions: SuggestionPost[] | null;
  loaded: boolean;
  go: (hash: string) => void;
  onLogout: () => void;
  onAssignmentChanged: (assignment: StudentAssignment) => Promise<void>;
  onClassChanged: () => Promise<void>;
  reload: () => Promise<void>;
}

export default function MeTab(props: MeTabProps) {
  const [first] = props.sub;
  if (first === 'class') return <ClassProfileScreen {...props} />;
  if (first === 'teacher') return <TeacherScreen {...props} />;
  if (first === 'suggestions') return <SuggestionScreens {...props} sub={props.sub.slice(1)} />;
  return <MeHome {...props} />;
}

function MeHome({ name, username, schoolName, assignment, suggestions, loaded, go, onLogout }: MeTabProps) {
  const [classProfile, setClassProfile] = useState<StudentClassProfile | null>(null);
  useEffect(() => {
    getStudentClassProfile()
      .then(setClassProfile)
      .catch(() => setClassProfile(null));
  }, []);

  const replied = suggestions?.filter((item) => item.adminReply).length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 px-1 pt-1">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-gray-500">
          <UserRound size={24} aria-hidden />
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold tracking-tight text-gray-900">{name}</h1>
          <p className="truncate text-[13px] text-gray-500">
            {schoolName} · <span className="font-mono text-xs">{username}</span>
          </p>
        </div>
      </div>

      <ListGroup title="학교">
        <ListRow
          icon={<GraduationCap size={18} />}
          label="학년·반"
          value={classProfile?.completed ? `${classProfile.grade}학년 ${classProfile.classNumber}반` : '입력 전'}
          onClick={() => go('#me/class')}
        />
        <ListRow
          icon={<School size={18} />}
          label="담임 선생님"
          value={
            !loaded
              ? undefined
              : assignment
                ? `${assignment.teacherName || assignment.teacherUsername} 선생님`
                : '연결 전'
          }
          onClick={() => go('#me/teacher')}
        />
      </ListGroup>

      <ListGroup
        title="도움"
        footer="서비스 오류나 바라는 점은 온도 운영팀이 확인해요. 담임 선생님에게는 보이지 않아요."
      >
        <ListRow
          icon={<MessageSquarePlus size={18} />}
          label="운영 건의"
          value={replied > 0 ? `답변 ${replied}건` : undefined}
          onClick={() => go('#me/suggestions')}
        />
      </ListGroup>

      <ListGroup title="계정">
        <ListRow icon={<LogOut size={18} />} label="로그아웃" onClick={onLogout} />
        <ListRow icon={<UserX size={18} />} label="회원 탈퇴" to={PATHS.WITHDRAW} destructive />
      </ListGroup>
    </div>
  );
}

function ClassProfileScreen({ go, onSuccess, onError, onClassChanged }: MeTabProps) {
  const [profile, setProfile] = useState<StudentClassProfile | null>(null);
  const [grade, setGrade] = useState('');
  const [classNumber, setClassNumber] = useState('');
  const [errors, setErrors] = useState<{ grade?: string; classNumber?: string }>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getStudentClassProfile()
      .then((data) => {
        setProfile(data);
        setGrade(data.grade != null ? String(data.grade) : '');
        setClassNumber(data.classNumber != null ? String(data.classNumber) : '');
      })
      .catch((error) => onError(resolveErrorMessage(error, '학년·반을 불러오지 못했습니다.')));
  }, [onError]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const g = Number(grade);
    const c = Number(classNumber);
    const next = {
      grade: Number.isInteger(g) && g >= 1 && g <= 6 ? undefined : '1~6 사이 숫자로 적어 주세요.',
      classNumber: Number.isInteger(c) && c >= 1 && c <= 20 ? undefined : '1~20 사이 숫자로 적어 주세요.',
    };
    setErrors(next);
    if (next.grade || next.classNumber) return;
    setBusy(true);
    try {
      const data = await updateStudentClassProfile({ grade: g, classNumber: c });
      setProfile(data);
      onSuccess(data.message || `${g}학년 ${c}반으로 저장했어요. 오늘 시간표가 바로 바뀌어요.`);
      await onClassChanged();
      go('#me');
    } catch (error) {
      onError(resolveErrorMessage(error, '학년·반을 저장하지 못했습니다.'));
    } finally {
      setBusy(false);
    }
  }

  async function clear() {
    if (!window.confirm('학년·반을 지울까요? 시간표가 보이지 않게 돼요.')) return;
    setBusy(true);
    try {
      const data = await updateStudentClassProfile({ grade: null, classNumber: null });
      setProfile(data);
      setGrade('');
      setClassNumber('');
      onSuccess(data.message || '학년·반을 지웠어요.');
      await onClassChanged();
    } catch (error) {
      onError(resolveErrorMessage(error, '학년·반을 지우지 못했습니다.'));
    } finally {
      setBusy(false);
    }
  }

  if (!profile) {
    return (
      <Block>
        <Skeleton className="h-24 w-full" />
      </Block>
    );
  }

  return (
    <form onSubmit={save} noValidate className="flex flex-col gap-6">
      <Block title="학년·반" footer="오늘 시간표를 불러올 때 써요.">
        <div className="grid grid-cols-2 gap-3">
          <Field label="학년" error={errors.grade}>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={6}
              placeholder="2"
              value={grade}
              disabled={busy}
              onChange={(event) => setGrade(event.target.value)}
            />
          </Field>
          <Field label="반" error={errors.classNumber}>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={20}
              placeholder="3"
              value={classNumber}
              disabled={busy}
              onChange={(event) => setClassNumber(event.target.value)}
            />
          </Field>
        </div>
      </Block>
      {profile.completed ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void clear()}
          className="self-start px-1 text-[13px] font-medium text-red-700 disabled:opacity-50"
        >
          학년·반 지우기
        </button>
      ) : null}
      <StickyFooter>
        <Button type="submit" variant="primary" className="w-full" loading={busy}>
          저장
        </Button>
      </StickyFooter>
    </form>
  );
}

function TeacherScreen({ assignment, loaded, go, onSuccess, onAssignmentChanged }: MeTabProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = code.trim();
    if (!/^\d{6}$/.test(normalized)) {
      setError('초대 코드는 숫자 6자리예요.');
      return;
    }
    setBusy(true);
    try {
      const data = await registerStudentAssignment({ inviteCode: normalized });
      await onAssignmentChanged(data);
      onSuccess(`${data.teacherName || data.teacherUsername} 선생님과 연결됐어요.`);
      go('');
    } catch (err) {
      // 이미 연결돼 있으면 현재 연결 정보를 다시 받아 보여 줍니다.
      if (err instanceof ApiError && err.message.includes('이미 담당 교사')) {
        const existing = await getStudentAssignmentOptional();
        if (existing) {
          await onAssignmentChanged(existing);
          onSuccess('이미 담임 선생님과 연결돼 있어요.');
          setBusy(false);
          return;
        }
      }
      setError(resolveErrorMessage(err, '선생님과 연결하지 못했습니다.'));
    } finally {
      setBusy(false);
    }
  }

  if (!loaded) {
    return (
      <Block>
        <Skeleton className="h-24 w-full" />
      </Block>
    );
  }

  if (assignment) {
    return (
      <div className="flex flex-col gap-6">
        <ListGroup title="담임 선생님">
          <ListRow label="선생님" value={`${assignment.teacherName || assignment.teacherUsername} 선생님`} />
          <ListRow label="학교" value={assignment.schoolName || '-'} />
          <ListRow label="연결한 날" value={formatCompactDateTime(assignment.assignedAt)} />
        </ListGroup>
        <ChangeTeacherForm assignment={assignment} go={go} onSuccess={onSuccess} onAssignmentChanged={onAssignmentChanged} />
      </div>
    );
  }

  return (
    <form onSubmit={register} noValidate className="flex flex-col gap-6">
      <Block
        title="담임 선생님 연결"
        footer="선생님께 받은 숫자 6자리를 입력하세요. 연결하면 상담 신청과 학급 공지를 쓸 수 있어요."
      >
        <Field label="초대 코드" error={error}>
          <Input
            value={code}
            onChange={(event) => {
              setCode(event.target.value.replace(/\D/g, '').slice(0, 6));
              setError(null);
            }}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            maxLength={6}
            disabled={busy}
            className="text-center font-mono text-lg tracking-[0.4em]"
          />
        </Field>
      </Block>
      <StickyFooter>
        <Button type="submit" variant="primary" className="w-full" loading={busy} disabled={code.length !== 6}>
          연결하기
        </Button>
      </StickyFooter>
    </form>
  );
}

/** 새 학기에 담임이 바뀌면 새 선생님의 초대 코드로 연결을 옮깁니다 */
function ChangeTeacherForm({
  assignment,
  go,
  onSuccess,
  onAssignmentChanged,
}: Pick<MeTabProps, 'go' | 'onSuccess' | 'onAssignmentChanged'> & { assignment: StudentAssignment }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const currentName = `${assignment.teacherName || assignment.teacherUsername} 선생님`;

  async function change(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = code.trim();
    if (!/^\d{6}$/.test(normalized)) {
      setError('초대 코드는 숫자 6자리예요.');
      return;
    }
    if (
      !window.confirm(
        `담임 선생님을 바꿀까요?\n\n` +
          `· ${currentName}께 보낸 상담 중 아직 끝나지 않은 상담은 취소돼요.\n` +
          '· 지난 상담 기록은 내 상담 목록에 그대로 남고, 새 선생님에게는 보이지 않아요.\n' +
          '· 마음 날씨와 사전상담 카드는 새 선생님이 보게 돼요.',
      )
    )
      return;
    setBusy(true);
    try {
      const data = await changeStudentAssignment({ inviteCode: normalized });
      await onAssignmentChanged(data);
      onSuccess(`${data.teacherName || data.teacherUsername} 선생님으로 담임을 바꿨어요.`);
      setCode('');
      go('');
    } catch (err) {
      setError(resolveErrorMessage(err, '담임 선생님을 바꾸지 못했습니다.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={change} noValidate className="flex flex-col gap-3">
      <Block
        title="담임 선생님 바꾸기"
        footer="새 학년이 되어 담임 선생님이 바뀌었다면, 새 선생님께 받은 초대 코드를 입력하세요."
      >
        <Field label="새 선생님 초대 코드" error={error}>
          <Input
            value={code}
            onChange={(event) => {
              setCode(event.target.value.replace(/\D/g, '').slice(0, 6));
              setError(null);
            }}
            inputMode="numeric"
            autoComplete="off"
            placeholder="123456"
            maxLength={6}
            disabled={busy}
            className="text-center font-mono text-lg tracking-[0.4em]"
          />
        </Field>
        <Button type="submit" className="mt-3 w-full" loading={busy} disabled={code.length !== 6}>
          담임 바꾸기
        </Button>
      </Block>
    </form>
  );
}
