import { type FormEvent, useEffect, useState } from 'react';
import { saveStudentPreCounselingProfile } from '../../api/student.api';
import type { PreCounselingProfile } from '../../api/types/student';
import { Badge, Button, Field, Input, Skeleton, Textarea } from '../../ds';
import {
  EMPTY_PRE_COUNSEL_FORM,
  mapFormToSaveRequest,
  mapProfileToForm,
  type PreCounselFormState,
} from '../../student/preCounselForm';
import { type FeedbackHandlers, formatCompactDateTime, resolveErrorMessage } from '../common';
import { Block, StickyFooter } from './ui';

type Key = keyof PreCounselFormState;

interface FieldDef {
  key: Key;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  optional?: boolean;
  maxLength?: number;
  inputMode?: 'tel' | 'text';
}

const GROUPS: Array<{ title: string; fields: FieldDef[] }> = [
  {
    title: '기본 정보',
    fields: [
      { key: 'studentPhone', label: '내 연락처', placeholder: '01012345678', maxLength: 20, inputMode: 'tel' },
      { key: 'parentPhone', label: '보호자 연락처', placeholder: '01012345678', maxLength: 20, inputMode: 'tel' },
      { key: 'mbti', label: 'MBTI', placeholder: 'ENFP', maxLength: 10, optional: true },
      { key: 'futureHope', label: '장래 희망', placeholder: '되고 싶은 직업이나 꿈', maxLength: 200 },
      {
        key: 'favoriteWords',
        label: '좌우명이나 좋아하는 말',
        placeholder: '나를 표현하는 문장이나 단어',
        multiline: true,
      },
    ],
  },
  {
    title: '나를 소개해요',
    fields: [
      { key: 'personalityStrength', label: '내가 생각하는 나의 장점', multiline: true },
      { key: 'personalityWeakness', label: '내가 생각하는 나의 단점', multiline: true },
      { key: 'hobbiesSpecialtiesInterests', label: '취미, 특기, 요즘 가장 관심 있는 것', multiline: true },
      { key: 'happiestMoment', label: '내가 가장 행복할 때', multiline: true },
      { key: 'stressfulMoment', label: '내가 가장 스트레스받을 때', multiline: true },
      { key: 'stressReliefMethod', label: '스트레스를 푸는 나만의 방법', multiline: true },
    ],
  },
  {
    title: '친구 관계와 학교생활',
    fields: [
      { key: 'memorableSchoolMoment', label: '작년 학교생활에서 가장 기억에 남는 일', multiline: true },
      { key: 'desiredFriendType', label: '친해지고 싶은 친구, 또는 작년에 친했던 친구', multiline: true },
      {
        key: 'desiredClassRole',
        label: '올해 학급에서 꼭 해 보고 싶은 역할',
        placeholder: '1인 1역, 부서 활동 등',
        multiline: true,
      },
    ],
  },
];

interface PreCounselFormProps extends FeedbackHandlers {
  profile: PreCounselingProfile | null;
  loaded: boolean;
  hasAssignment: boolean;
  go: (hash: string) => void;
  reload: () => Promise<void>;
}

export default function PreCounselForm({ profile, loaded, go, reload, onSuccess, onError }: PreCounselFormProps) {
  const [form, setForm] = useState<PreCounselFormState>(profile ? mapProfileToForm(profile) : EMPTY_PRE_COUNSEL_FORM);
  const [errors, setErrors] = useState<Partial<Record<Key, string>>>({});
  const [busy, setBusy] = useState(false);

  // 처음 불러온 값이 늦게 오면 채워 넣기 (이미 고치기 시작했으면 건드리지 않음)
  useEffect(() => {
    if (profile) setForm((prev) => (Object.values(prev).every((value) => !value) ? mapProfileToForm(profile) : prev));
  }, [profile]);

  function set(key: Key, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Partial<Record<Key, string>> = {};
    GROUPS.flatMap((group) => group.fields).forEach((field) => {
      if (!field.optional && !form[field.key].trim()) next[field.key] = '적어 주세요.';
    });
    setErrors(next);
    const firstMissing = Object.keys(next)[0];
    if (firstMissing) {
      document.getElementById(`pc-${firstMissing}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      onError(`빈 칸이 ${Object.keys(next).length}개 있어요. MBTI 말고는 모두 적어 주세요.`);
      return;
    }

    setBusy(true);
    try {
      const result = await saveStudentPreCounselingProfile(mapFormToSaveRequest(form));
      setForm(mapProfileToForm(result.profile));
      onSuccess(result.message || '사전상담 카드를 저장했어요.');
      await reload();
      go('#counsel');
    } catch (error) {
      onError(resolveErrorMessage(error, '사전상담 카드를 저장하지 못했습니다.'));
    } finally {
      setBusy(false);
    }
  }

  if (!loaded) {
    return (
      <Block>
        <Skeleton className="h-40 w-full" />
      </Block>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <div className="px-1 pt-1">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">사전상담 카드</h1>
          {profile?.completed ? <Badge tone="success">작성 완료</Badge> : <Badge>작성 전</Badge>}
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-gray-500">
          상담 전에 선생님이 나를 미리 알 수 있도록 적어 주세요. 담임 선생님만 볼 수 있고, 연락처는 암호화해서 저장해요.
          {profile?.updatedAt ? ` 마지막 저장 ${formatCompactDateTime(profile.updatedAt)}.` : ''}
        </p>
      </div>

      <Block title="이름과 생년월일" footer="가입할 때 입력한 정보예요.">
        <dl className="grid grid-cols-[72px_minmax(0,1fr)] gap-y-1.5 text-sm">
          <dt className="text-gray-500">이름</dt>
          <dd className="text-gray-900">{profile?.studentName || '-'}</dd>
          <dt className="text-gray-500">생년월일</dt>
          <dd className="text-gray-900 tabular-nums">{profile?.birthDate || '-'}</dd>
        </dl>
      </Block>

      {GROUPS.map((group) => (
        <Block key={group.title} title={group.title}>
          <div className="flex flex-col gap-4">
            {group.fields.map((field) => (
              <div key={field.key} id={`pc-${field.key}`} className="scroll-mt-24">
                <Field
                  label={field.optional ? `${field.label} (선택)` : field.label}
                  required={!field.optional}
                  error={errors[field.key]}
                >
                  {field.multiline ? (
                    <Textarea
                      rows={3}
                      value={form[field.key]}
                      placeholder={field.placeholder}
                      disabled={busy}
                      onChange={(event) => set(field.key, event.target.value)}
                    />
                  ) : (
                    <Input
                      value={form[field.key]}
                      placeholder={field.placeholder}
                      maxLength={field.maxLength}
                      inputMode={field.inputMode}
                      type={field.inputMode === 'tel' ? 'tel' : 'text'}
                      disabled={busy}
                      onChange={(event) => set(field.key, event.target.value)}
                    />
                  )}
                </Field>
              </div>
            ))}
          </div>
        </Block>
      ))}

      <StickyFooter>
        <Button type="submit" variant="primary" className="w-full" loading={busy}>
          사전상담 카드 저장
        </Button>
      </StickyFooter>
    </form>
  );
}
