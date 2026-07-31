import { type FormEvent, useState } from 'react';
import { createCounselingPost } from '../../api/counseling.api';
import { ApiError } from '../../api/types/api-error';
import type { CounselingType } from '../../api/types/counseling';
import { Btn, Field, Input, Select, Textarea } from '../../components/ui';
import {
  COUNSELING_TYPE_OPTIONS,
  getTodayDateInputValue,
} from '../counselingLabels';
import { STUDENT_SECTIONS } from '../constants';
import StudentSectionCard from './StudentSectionCard';

interface SectionCounselCreateProps {
  hasAssignment: boolean;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onCreated: () => void;
}

const EMPTY_FORM = {
  title: '',
  counselingType: '' as CounselingType | '',
  desiredDate: getTodayDateInputValue(),
  content: '',
};

export default function SectionCounselCreate({
  hasAssignment,
  onSuccess,
  onError,
  onCreated,
}: SectionCounselCreateProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formDisabled = !hasAssignment || isSubmitting;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!hasAssignment) {
      onError('담당 교사를 먼저 등록해 주세요.');
      return;
    }

    if (!form.counselingType) {
      onError('상담 분류를 선택해 주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      await createCounselingPost({
        title: form.title.trim(),
        counselingType: form.counselingType,
        desiredDate: form.desiredDate,
        content: form.content.trim(),
      });
      setForm({ ...EMPTY_FORM, desiredDate: getTodayDateInputValue() });
      onSuccess('상담 신청이 등록되었습니다.');
      onCreated();
    } catch (error) {
      onError(resolveErrorMessage(error, '상담 신청을 등록하지 못했습니다.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <StudentSectionCard
      id={STUDENT_SECTIONS.COUNSEL_CREATE}
      title="상담 신청"
      helper={
        hasAssignment
          ? '담당 교사에게 상담을 요청합니다.'
          : '담당 교사 등록 후 상담을 신청할 수 있습니다.'
      }
      compact
    >
      <form className="student-form" onSubmit={handleSubmit}>
        <Field id="counselTitle" label="제목" required>
          <Input
            type="text"
            maxLength={100}
            required
            disabled={formDisabled}
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
          />
        </Field>

        <Field id="counselType" label="상담 분류" required>
          <Select
            required
            disabled={formDisabled}
            value={form.counselingType}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                counselingType: event.target.value as CounselingType,
              }))
            }
          >
            <option value="">선택해 주세요</option>
            {COUNSELING_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field id="counselDesiredDate" label="희망 상담일" required>
          <Input
            type="date"
            required
            disabled={formDisabled}
            min={getTodayDateInputValue()}
            value={form.desiredDate}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, desiredDate: event.target.value }))
            }
          />
        </Field>

        <Field id="counselContent" label="상담 내용" required>
          <Textarea
            required
            disabled={formDisabled}
            placeholder="상담하고 싶은 내용을 작성해 주세요."
            value={form.content}
            onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
          />
        </Field>

        <div className="student-form-actions">
          <Btn type="submit" variant="primary" size="student" disabled={formDisabled}>
            {isSubmitting ? '등록 중…' : '상담 신청하기'}
          </Btn>
        </div>
      </form>
    </StudentSectionCard>
  );
}

function resolveErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  return fallback;
}
