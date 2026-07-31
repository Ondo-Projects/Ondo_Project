import { type FormEvent, useCallback, useEffect, useState } from 'react';

import {
  createAdminAnnouncement,
  deleteAdminAnnouncement,
  getAdminAnnouncement,
  getAdminAnnouncements,
  updateAdminAnnouncement,
} from '../../api/admin.api';
import type { AdminPageResponse } from '../../api/types/admin';
import type {
  AnnouncementAudience,
  AnnouncementPageResponse,
  AnnouncementStatus,
  AnnouncementSummary,
} from '../../api/types/announcement';
import { ApiError } from '../../api/types/api-error';
import {
  ADMIN_SECTIONS,
  ANNOUNCEMENT_AUDIENCE_LABELS,
  ANNOUNCEMENT_AUDIENCE_OPTIONS,
  ANNOUNCEMENT_STATUS_LABELS,
  PAGE_SIZE,
} from '../constants';
import { formatDateTime, resolveErrorMessage } from '../adminUtils';
import AdminAnnouncementEditDrawer, {
  toEditFormState,
  type AdminAnnouncementEditFormState,
} from './AdminAnnouncementEditDrawer';
import AdminPager from './AdminPager';
import AdminSectionCard from './AdminSectionCard';

interface SectionAnnouncementAdminProps {
  refreshToken: number;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

interface AnnouncementCreateFormState {
  title: string;
  content: string;
  audience: AnnouncementAudience;
}

const EMPTY_CREATE_FORM: AnnouncementCreateFormState = {
  title: '',
  content: '',
  audience: 'ALL',
};

function getStatusBadgeClass(status: AnnouncementStatus): string {
  return status === 'PUBLISHED'
    ? 'admin-badge admin-badge--mapped'
    : 'admin-badge admin-badge--inactive';
}

export default function SectionAnnouncementAdmin({
  refreshToken,
  onSuccess,
  onError,
}: SectionAnnouncementAdminProps) {
  const [createForm, setCreateForm] = useState<AnnouncementCreateFormState>(EMPTY_CREATE_FORM);
  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState<AnnouncementPageResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<AdminAnnouncementEditFormState | null>(null);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isEditSaving, setIsEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const loadAnnouncements = useCallback(async (nextPage: number) => {
      setIsLoading(true);

      try {
        const response = await getAdminAnnouncements(nextPage, PAGE_SIZE);
        setPageData(response);
        setPage(nextPage);
      } catch (error) {
        onError(
          error instanceof ApiError
            ? error.message
            : resolveErrorMessage(error, '플랫폼 공지 목록을 불러오지 못했습니다.'),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [onError],
  );

  useEffect(() => {
    void loadAnnouncements(0);
  }, [loadAnnouncements, refreshToken]);

  async function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = createForm.title.trim();
    const content = createForm.content.trim();
    if (!title || !content) {
      onError('제목과 내용을 모두 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      await createAdminAnnouncement({
        title,
        content,
        audience: createForm.audience,
      });
      setCreateForm(EMPTY_CREATE_FORM);
      onSuccess('플랫폼 공지를 등록했습니다.');
      await loadAnnouncements(0);
    } catch (error) {
      onError(
        error instanceof ApiError
          ? error.message
          : resolveErrorMessage(error, '플랫폼 공지를 등록하지 못했습니다.'),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (
      !window.confirm(
        '이 공지를 삭제할까요? 공통 홈과 해당 대상 사용자 화면에서 더 이상 보이지 않습니다.',
      )
    ) {
      return;
    }

    setDeletingId(id);

    try {
      await deleteAdminAnnouncement(id);
      if (selectedId === id) {
        closeEditDrawer();
      }
      onSuccess('플랫폼 공지를 삭제했습니다.');
      await loadAnnouncements(page);
    } catch (error) {
      onError(
        error instanceof ApiError
          ? error.message
          : resolveErrorMessage(error, '플랫폼 공지를 삭제하지 못했습니다.'),
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function handleTogglePin(announcement: AnnouncementSummary) {
    setUpdatingId(announcement.id);

    try {
      await updateAdminAnnouncement(announcement.id, { pinned: !announcement.pinned });
      onSuccess(announcement.pinned ? '상단 고정을 해제했습니다.' : '공지를 상단에 고정했습니다.');
      await loadAnnouncements(page);
    } catch (error) {
      onError(
        error instanceof ApiError
          ? error.message
          : resolveErrorMessage(error, '고정 상태 변경에 실패했습니다.'),
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleToggleStatus(announcement: AnnouncementSummary) {
    const nextStatus: AnnouncementStatus =
      announcement.status === 'PUBLISHED' ? 'ARCHIVED' : 'PUBLISHED';

    setUpdatingId(announcement.id);

    try {
      await updateAdminAnnouncement(announcement.id, { status: nextStatus });
      onSuccess(nextStatus === 'ARCHIVED' ? '공지를 보관했습니다.' : '공지를 다시 게시했습니다.');
      await loadAnnouncements(page);
    } catch (error) {
      onError(
        error instanceof ApiError
          ? error.message
          : resolveErrorMessage(error, '공지 상태 변경에 실패했습니다.'),
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function closeEditDrawer() {
    setSelectedId(null);
    setEditForm(null);
    setEditError(null);
    setIsEditLoading(false);
    setIsEditSaving(false);
  }

  async function openEditDrawer(id: number) {
    setSelectedId(id);
    setEditForm(null);
    setEditError(null);
    setIsEditLoading(true);

    try {
      const detail = await getAdminAnnouncement(id);
      setEditForm(toEditFormState(detail));
    } catch (error) {
      setEditError(
        error instanceof ApiError
          ? error.message
          : resolveErrorMessage(error, '공지 상세를 불러오지 못했습니다.'),
      );
    } finally {
      setIsEditLoading(false);
    }
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedId || !editForm) {
      return;
    }

    const title = editForm.title.trim();
    const content = editForm.content.trim();
    if (!title || !content) {
      setEditError('제목과 내용을 모두 입력해 주세요.');
      return;
    }

    setIsEditSaving(true);
    setEditError(null);

    try {
      await updateAdminAnnouncement(selectedId, {
        title,
        content,
        audience: editForm.audience,
        pinned: editForm.pinned,
        status: editForm.status,
      });
      closeEditDrawer();
      onSuccess('플랫폼 공지를 수정했습니다.');
      await loadAnnouncements(page);
    } catch (error) {
      setEditError(
        error instanceof ApiError
          ? error.message
          : resolveErrorMessage(error, '플랫폼 공지 수정에 실패했습니다.'),
      );
    } finally {
      setIsEditSaving(false);
    }
  }

  const pagerData: AdminPageResponse<AnnouncementSummary> | null = pageData;

  return (
    <>
      <AdminSectionCard
        id={ADMIN_SECTIONS.ANNOUNCEMENT}
        title="8. 플랫폼 공지"
        helper="학생·교사 공통 홈 게시판에 올릴 공지를 작성·관리합니다."
      >
        <form className="admin-form" onSubmit={handleCreateSubmit}>
          <div className="admin-field">
            <label htmlFor="admin-announcement-title">제목</label>
            <input
              id="admin-announcement-title"
              type="text"
              maxLength={100}
              placeholder="공지 제목"
              disabled={isSubmitting}
              value={createForm.title}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, title: event.target.value }))
              }
            />
          </div>

          <div className="admin-field">
            <label htmlFor="admin-announcement-audience">대상</label>
            <select
              id="admin-announcement-audience"
              disabled={isSubmitting}
              value={createForm.audience}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  audience: event.target.value as AnnouncementAudience,
                }))
              }
            >
              {ANNOUNCEMENT_AUDIENCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-field">
            <label htmlFor="admin-announcement-content">내용</label>
            <textarea
              id="admin-announcement-content"
              placeholder="공통 홈에 표시할 내용을 작성해 주세요."
              disabled={isSubmitting}
              value={createForm.content}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, content: event.target.value }))
              }
            />
          </div>

          <div className="admin-search-actions">
            <button
              type="submit"
              className="admin-btn admin-btn--primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? '등록 중…' : '공지 등록'}
            </button>
          </div>
        </form>

        <h3 className="admin-subtitle admin-subtitle--flush">공지 게시판</h3>

        {isLoading ? (
          <p className="admin-status">불러오는 중…</p>
        ) : !pageData || pageData.items.length === 0 ? (
          <p className="admin-status">등록된 플랫폼 공지가 없습니다.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>제목</th>
                  <th>대상</th>
                  <th>상태</th>
                  <th>고정</th>
                  <th>등록일</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {pageData.items.map((announcement) => (
                  <tr key={announcement.id}>
                    <td data-label="ID">{announcement.id}</td>
                    <td data-label="제목" className="admin-announcement-table__title">
                      <button
                        type="button"
                        className="admin-link-button"
                        onClick={() => void openEditDrawer(announcement.id)}
                      >
                        {announcement.title}
                      </button>
                      <p className="admin-helper">{announcement.contentPreview}</p>
                    </td>
                    <td data-label="대상">
                      <span className="admin-badge admin-badge--audience">
                        {ANNOUNCEMENT_AUDIENCE_LABELS[announcement.audience]}
                      </span>
                    </td>
                    <td data-label="상태">
                      <span className={getStatusBadgeClass(announcement.status)}>
                        {ANNOUNCEMENT_STATUS_LABELS[announcement.status]}
                      </span>
                    </td>
                    <td data-label="고정">
                      {announcement.pinned ? (
                        <span className="admin-badge admin-badge--category">고정</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td data-label="등록일">{formatDateTime(announcement.createdAt)}</td>
                    <td data-label="관리" className="admin-table__actions">
                      <button
                        type="button"
                        className="admin-btn admin-btn--secondary"
                        disabled={updatingId === announcement.id}
                        onClick={() => void openEditDrawer(announcement.id)}
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn--muted"
                        disabled={updatingId === announcement.id}
                        onClick={() => void handleTogglePin(announcement)}
                      >
                        {announcement.pinned ? '고정 해제' : '고정'}
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn--muted"
                        disabled={updatingId === announcement.id}
                        onClick={() => void handleToggleStatus(announcement)}
                      >
                        {announcement.status === 'PUBLISHED' ? '보관' : '게시'}
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn--danger"
                        disabled={deletingId === announcement.id}
                        onClick={() => void handleDelete(announcement.id)}
                      >
                        {deletingId === announcement.id ? '삭제 중…' : '삭제'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <AdminPager
          pageData={pagerData}
          onPageChange={(nextPage) => void loadAnnouncements(nextPage)}
        />
      </AdminSectionCard>

      <AdminAnnouncementEditDrawer
        isOpen={selectedId !== null}
        isLoading={isEditLoading}
        isSaving={isEditSaving}
        error={editError}
        form={editForm}
        onChange={setEditForm}
        onClose={closeEditDrawer}
        onSubmit={(event) => void handleEditSubmit(event)}
      />
    </>
  );
}
