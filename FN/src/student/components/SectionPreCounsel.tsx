import { type FormEvent, useEffect, useState } from 'react';
import { ApiError } from '../../api/types/api-error';
import type { PreCounselingProfile } from '../../api/types/student';
import {
  saveStudentPreCounselingProfile,
} from '../../api/student.api';
import { Badge, Btn, Field, Input, Textarea } from '../../components/ui';
import { PRE_COUNSEL_SECTIONS, STUDENT_SECTIONS } from '../constants';
import {
  EMPTY_PRE_COUNSEL_FORM,
  mapFormToSaveRequest,
  mapProfileToForm,
  type PreCounselFormState,
} from '../preCounselForm';
import { scrollToStudentSection } from '../studentUtils';
import StudentSectionCard from './StudentSectionCard';

interface SectionPreCounselProps {
  prefetchedProfile: PreCounselingProfile | null;
  profileLoaded: boolean;
  navFocusToken?: number;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function SectionPreCounsel({
  prefetchedProfile,
  profileLoaded,
  navFocusToken = 0,
  onSuccess,
  onError,
}: SectionPreCounselProps) {
  const [profileMeta, setProfileMeta] = useState<Pick<
    PreCounselingProfile,
    'studentName' | 'birthDate' | 'completed'
  > | null>(null);
  const [form, setForm] = useState<PreCounselFormState>(EMPTY_PRE_COUNSEL_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!profileLoaded) {
      setIsLoading(true);
      return;
    }

    if (prefetchedProfile) {
      applyProfile(prefetchedProfile);
    }
    setIsLoading(false);
  }, [profileLoaded, prefetchedProfile]);

  useEffect(() => {
    if (navFocusToken === 0) {
      return;
    }

    const sections = document.querySelectorAll<HTMLDetailsElement>(
      '.student-pre-counsel-form .student-form-section',
    );
    const expandAll = window.matchMedia('(min-width: 641px)').matches;

    sections.forEach((section, index) => {
      section.open = expandAll || index === 0;
    });
  }, [navFocusToken]);

  function applyProfile(profile: PreCounselingProfile) {
    setProfileMeta({
      studentName: profile.studentName,
      birthDate: profile.birthDate,
      completed: profile.completed,
    });
    setForm(mapProfileToForm(profile));
  }

  function updateField<K extends keyof PreCounselFormState>(key: K, value: PreCounselFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const result = await saveStudentPreCounselingProfile(mapFormToSaveRequest(form));
      applyProfile(result.profile);
      onSuccess(result.message || '사전 상담 카드가 저장되었습니다.');
    } catch (error) {
      onError(resolveErrorMessage(error, '사전 상담 카드를 저장하지 못했습니다.'));
    } finally {
      setIsSaving(false);
    }
  }

  const statusLabel = profileMeta?.completed ? '작성 완료' : '작성 전';

  return (
    <StudentSectionCard
      id={STUDENT_SECTIONS.PRE_COUNSEL}
      title="사전 상담 카드"
      helper="상담 전에 나를 소개하는 카드를 작성합니다. 담당 교사만 열람할 수 있습니다."
      compact
    >
      {isLoading ? (
        <p className="student-status">불러오는 중…</p>
      ) : (
        <>
          <Badge variant={profileMeta?.completed ? 'completed' : 'pending'}>{statusLabel}</Badge>

          <form className="student-form student-pre-counsel-form" onSubmit={handleSubmit}>
            <nav className="student-pre-counsel-nav" aria-label="사전 상담 섹션">
              <button
                type="button"
                className="student-pre-counsel-nav__link"
                onClick={() => scrollToStudentSection(PRE_COUNSEL_SECTIONS.BASIC)}
              >
                기본 정보
              </button>
              <button
                type="button"
                className="student-pre-counsel-nav__link"
                onClick={() => scrollToStudentSection(PRE_COUNSEL_SECTIONS.SELF)}
              >
                자기 이해
              </button>
              <button
                type="button"
                className="student-pre-counsel-nav__link"
                onClick={() => scrollToStudentSection(PRE_COUNSEL_SECTIONS.SCHOOL)}
              >
                학교생활
              </button>
            </nav>

            <details className="student-form-section" id={PRE_COUNSEL_SECTIONS.BASIC} open>
              <summary className="student-form-section__title">인적 사항 및 기본 정보</summary>
              <div className="student-form-section__body">
                <ReadonlyField label="이름" value={profileMeta?.studentName || '-'} />
                <ReadonlyField label="생년월일" value={profileMeta?.birthDate || '-'} />
                <TextField
                  id="preCounselStudentPhone"
                  label="연락처"
                  value={form.studentPhone}
                  placeholder="01012345678"
                  maxLength={20}
                  required
                  disabled={isSaving}
                  onChange={(value) => updateField('studentPhone', value)}
                />
                <TextField
                  id="preCounselParentPhone"
                  label="부모님 연락처"
                  value={form.parentPhone}
                  placeholder="01012345678"
                  maxLength={20}
                  required
                  disabled={isSaving}
                  onChange={(value) => updateField('parentPhone', value)}
                />
                <TextField
                  id="preCounselMbti"
                  label="MBTI (선택)"
                  value={form.mbti}
                  placeholder="예: ENFP"
                  maxLength={10}
                  disabled={isSaving}
                  onChange={(value) => updateField('mbti', value)}
                />
                <TextField
                  id="preCounselFutureHope"
                  label="장래희망"
                  value={form.futureHope}
                  placeholder="되고 싶은 직업이나 꿈"
                  maxLength={200}
                  required
                  disabled={isSaving}
                  onChange={(value) => updateField('futureHope', value)}
                />
                <TextAreaField
                  id="preCounselFavoriteWords"
                  label="좌우명이나 좋아하는 단어"
                  value={form.favoriteWords}
                  placeholder="나를 표현하는 문장이나 단어"
                  required
                  disabled={isSaving}
                  onChange={(value) => updateField('favoriteWords', value)}
                />
              </div>
            </details>

            <details className="student-form-section" id={PRE_COUNSEL_SECTIONS.SELF}>
              <summary className="student-form-section__title">
                자기 이해 및 성향 (나를 소개합니다)
              </summary>
              <div className="student-form-section__body">
                <TextAreaField
                  id="preCounselStrength"
                  label="내가 생각하는 나의 장점"
                  value={form.personalityStrength}
                  placeholder="장점 하나"
                  required
                  disabled={isSaving}
                  onChange={(value) => updateField('personalityStrength', value)}
                />
                <TextAreaField
                  id="preCounselWeakness"
                  label="내가 생각하는 나의 단점"
                  value={form.personalityWeakness}
                  placeholder="단점 하나"
                  required
                  disabled={isSaving}
                  onChange={(value) => updateField('personalityWeakness', value)}
                />
                <TextAreaField
                  id="preCounselHobbies"
                  label="나의 취미, 특기, 요즘 가장 관심 있는 것"
                  value={form.hobbiesSpecialtiesInterests}
                  required
                  disabled={isSaving}
                  onChange={(value) => updateField('hobbiesSpecialtiesInterests', value)}
                />
                <TextAreaField
                  id="preCounselHappiest"
                  label="내가 가장 행복할 때"
                  value={form.happiestMoment}
                  required
                  disabled={isSaving}
                  onChange={(value) => updateField('happiestMoment', value)}
                />
                <TextAreaField
                  id="preCounselStressful"
                  label="내가 가장 스트레스받을 때"
                  value={form.stressfulMoment}
                  required
                  disabled={isSaving}
                  onChange={(value) => updateField('stressfulMoment', value)}
                />
                <TextAreaField
                  id="preCounselStressRelief"
                  label="스트레스를 해소하는 나만의 방법"
                  value={form.stressReliefMethod}
                  required
                  disabled={isSaving}
                  onChange={(value) => updateField('stressReliefMethod', value)}
                />
              </div>
            </details>

            <details className="student-form-section" id={PRE_COUNSEL_SECTIONS.SCHOOL}>
              <summary className="student-form-section__title">교우 관계 및 학교생활</summary>
              <div className="student-form-section__body">
                <TextAreaField
                  id="preCounselMemorable"
                  label="작년 학교생활 중 가장 기억에 남는 일이나 즐거웠던 점"
                  value={form.memorableSchoolMoment}
                  required
                  disabled={isSaving}
                  onChange={(value) => updateField('memorableSchoolMoment', value)}
                />
                <TextAreaField
                  id="preCounselFriendType"
                  label="친해지고 싶은 친구 유형 또는 작년에 친했던 친구들"
                  value={form.desiredFriendType}
                  required
                  disabled={isSaving}
                  onChange={(value) => updateField('desiredFriendType', value)}
                />
                <TextAreaField
                  id="preCounselClassRole"
                  label="올해 학급에서 내가 꼭 해보고 싶은 역할"
                  value={form.desiredClassRole}
                  placeholder="1인 1역, 부서 활동 등"
                  required
                  disabled={isSaving}
                  onChange={(value) => updateField('desiredClassRole', value)}
                />
              </div>
            </details>

            <Btn type="submit" variant="primary" size="student" className="student-submit-btn" disabled={isSaving}>
              {isSaving ? '저장 중…' : '사전 상담 카드 저장'}
            </Btn>
          </form>
        </>
      )}
    </StudentSectionCard>
  );
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  const fieldId = `preCounselReadonly-${label}`;
  return (
    <Field id={fieldId} label={label}>
      <Input readOnly value={value} />
    </Field>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  required,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <Field id={id} label={label} required={required}>
      <Input
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        required={required}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

function TextAreaField({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <Field id={id} label={label} required={required}>
      <Textarea
        value={value}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

function resolveErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
}
