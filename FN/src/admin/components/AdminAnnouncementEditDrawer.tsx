import { type FormEvent } from 'react';

import type { AnnouncementAudience, AnnouncementDetail, AnnouncementStatus } from '../../api/types/announcement';
import {
  Alert,
  Btn,
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerHeader,
  DrawerTitle,
  Field,
  Input,
  Select,
  Textarea,
} from '../../components/ui';
import {
  ANNOUNCEMENT_AUDIENCE_OPTIONS,
  ANNOUNCEMENT_STATUS_OPTIONS,
} from '../constants';

export interface AdminAnnouncementEditFormState {
  title: string;
  content: string;
  audience: AnnouncementAudience;
  pinned: boolean;
  status: AnnouncementStatus;
}

interface AdminAnnouncementEditDrawerProps {
  isOpen: boolean;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  form: AdminAnnouncementEditFormState | null;
  onChange: (next: AdminAnnouncementEditFormState) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export default function AdminAnnouncementEditDrawer({
  isOpen,
  isLoading,
  isSaving,
  error,
  form,
  onChange,
  onClose,
  onSubmit,
}: AdminAnnouncementEditDrawerProps) {
  return (
    <Drawer isOpen={isOpen} onClose={onClose}>
      <DrawerHeader>
        <DrawerTitle>공지 수정</DrawerTitle>
        <DrawerClose>닫기</DrawerClose>
      </DrawerHeader>

      <DrawerBody>
        {isLoading || !form ? (
          <p className="admin-status">불러오는 중…</p>
        ) : (
          <form className="admin-form admin-form--drawer" onSubmit={onSubmit}>
            {error ? <Alert variant="error">{error}</Alert> : null}

            <Field id="admin-announcement-edit-title" label="제목">
              <Input
                type="text"
                maxLength={100}
                disabled={isSaving}
                value={form.title}
                onChange={(event) => onChange({ ...form, title: event.target.value })}
              />
            </Field>

            <Field id="admin-announcement-edit-audience" label="대상">
              <Select
                disabled={isSaving}
                value={form.audience}
                onChange={(event) =>
                  onChange({
                    ...form,
                    audience: event.target.value as AnnouncementAudience,
                  })
                }
              >
                {ANNOUNCEMENT_AUDIENCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field id="admin-announcement-edit-status" label="상태">
              <Select
                disabled={isSaving}
                value={form.status}
                onChange={(event) =>
                  onChange({
                    ...form,
                    status: event.target.value as AnnouncementStatus,
                  })
                }
              >
                {ANNOUNCEMENT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="admin-field admin-field--checkbox">
              <label htmlFor="admin-announcement-edit-pinned">
                <Input
                  id="admin-announcement-edit-pinned"
                  type="checkbox"
                  disabled={isSaving}
                  checked={form.pinned}
                  onChange={(event) => onChange({ ...form, pinned: event.target.checked })}
                />
                상단 고정
              </label>
            </div>

            <Field id="admin-announcement-edit-content" label="내용">
              <Textarea
                disabled={isSaving}
                value={form.content}
                onChange={(event) => onChange({ ...form, content: event.target.value })}
              />
            </Field>

            <div className="admin-inline-actions admin-inline-actions--spaced">
              <Btn type="submit" variant="primary" size="student" disabled={isSaving}>
                {isSaving ? '저장 중…' : '변경 저장'}
              </Btn>
            </div>
          </form>
        )}
      </DrawerBody>
    </Drawer>
  );
}

export function toEditFormState(detail: AnnouncementDetail): AdminAnnouncementEditFormState {
  return {
    title: detail.title,
    content: detail.content,
    audience: detail.audience,
    pinned: detail.pinned,
    status: detail.status,
  };
}
