import { type FormEvent, useCallback, useEffect, useState } from 'react';
import {
  deleteCounselingPost,
  getCounselingPost,
  getMyCounselingPosts,
  updateCounselingPost,
} from '../../api/counseling.api';
import { ApiError } from '../../api/types/api-error';
import type { CounselingPost, CounselingType } from '../../api/types/counseling';
import {
  COUNSELING_TYPE_OPTIONS,
  getCounselingStatusLabel,
  getCounselingTypeLabel,
  getTodayDateInputValue,
} from '../counselingLabels';
import { STUDENT_SECTIONS } from '../constants';
import { formatDateTime, formatScheduleDateShort, scrollToStudentSection } from '../studentUtils';
import StudentSectionCard from './StudentSectionCard';

interface SectionCounselListProps {
  isActive: boolean;
  refreshToken: number;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

interface EditFormState {
  id: number;
  title: string;
  counselingType: CounselingType;
  desiredDate: string;
  content: string;
}

export default function SectionCounselList({
  isActive,
  refreshToken,
  onSuccess,
  onError,
}: SectionCounselListProps) {
  const [posts, setPosts] = useState<CounselingPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [detailPost, setDetailPost] = useState<CounselingPost | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadPosts = useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await getMyCounselingPosts();
      setPosts(data);
    } catch (error) {
      onError(resolveErrorMessage(error, '상담 목록을 불러오지 못했습니다.'));
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    if (!isActive) {
      return;
    }
    loadPosts();
  }, [isActive, refreshToken, loadPosts]);

  useEffect(() => {
    if (!selectedPostId || !posts.some((post) => post.id === selectedPostId)) {
      setDetailPost(null);
      setIsEditOpen(false);
      setEditForm(null);
    }
  }, [posts, selectedPostId]);

  async function openDetail(id: number, scroll = true) {
    setSelectedPostId(id);
    setIsEditOpen(false);
    setEditForm(null);
    setIsDetailLoading(true);

    try {
      const post = await getCounselingPost(id);
      setDetailPost(post);
      if (scroll) {
        scrollToStudentSection(STUDENT_SECTIONS.COUNSEL_DETAIL);
      }
    } catch (error) {
      setSelectedPostId(null);
      setDetailPost(null);
      onError(resolveErrorMessage(error, '상담 상세를 불러오지 못했습니다.'));
    } finally {
      setIsDetailLoading(false);
    }
  }

  function closeDetail() {
    setSelectedPostId(null);
    setDetailPost(null);
    setIsEditOpen(false);
    setEditForm(null);
  }

  function openEditForm(post: CounselingPost) {
    setEditForm({
      id: post.id,
      title: post.title,
      counselingType: post.counselingType,
      desiredDate: post.desiredDate,
      content: post.content,
    });
    setIsEditOpen(true);
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editForm) {
      return;
    }

    setIsSavingEdit(true);

    try {
      await updateCounselingPost(editForm.id, {
        title: editForm.title.trim(),
        counselingType: editForm.counselingType,
        desiredDate: editForm.desiredDate,
        content: editForm.content.trim(),
      });
      onSuccess('상담 사전 정보가 수정되었습니다.');
      setIsEditOpen(false);
      setEditForm(null);
      await loadPosts();
      await openDetail(editForm.id, false);
    } catch (error) {
      onError(resolveErrorMessage(error, '상담 사전 정보를 수정하지 못했습니다.'));
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('이 상담 사전 정보를 삭제할까요?')) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteCounselingPost(id);
      onSuccess('상담 사전 정보가 삭제되었습니다.');
      closeDetail();
      await loadPosts();
    } catch (error) {
      onError(resolveErrorMessage(error, '상담 사전 정보를 삭제하지 못했습니다.'));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <StudentSectionCard id={STUDENT_SECTIONS.COUNSEL_LIST} title="상담 목록" compact>
        {isLoading ? (
          <p className="student-status">불러오는 중…</p>
        ) : posts.length === 0 ? (
          <p className="student-status">작성한 상담이 없습니다.</p>
        ) : (
          <div className="student-post-list">
            {posts.map((post) => (
              <button
                key={post.id}
                type="button"
                className={`student-post-item${selectedPostId === post.id ? ' is-active' : ''}`}
                onClick={() => openDetail(post.id)}
              >
                <div className="student-post-item__header">
                  <h3 className="student-post-item__title">{post.title}</h3>
                  <span className={`student-badge student-badge--${post.status.toLowerCase()}`}>
                    {getCounselingStatusLabel(post.status)}
                  </span>
                </div>
                <p className="student-post-item__meta">
                  {getCounselingTypeLabel(post.counselingType)} · 희망{' '}
                  {formatScheduleDateShort(post.desiredDate)} · {formatDateTime(post.createdAt)}
                </p>
              </button>
            ))}
          </div>
        )}
      </StudentSectionCard>

      {detailPost || isDetailLoading ? (
        <StudentSectionCard id={STUDENT_SECTIONS.COUNSEL_DETAIL} title="상담 상세" compact>
          <div className="student-detail-header">
            <span className="student-detail-header__spacer" aria-hidden="true" />
            <button
              type="button"
              className="student-btn student-btn--secondary"
              onClick={closeDetail}
              aria-label="상담 상세 닫기"
            >
              닫기
            </button>
          </div>

          {isDetailLoading || !detailPost ? (
            <p className="student-status">불러오는 중…</p>
          ) : (
            <>
              <div className="student-post-item__header">
                <h3 className="student-post-item__title">{detailPost.title}</h3>
                <span className={`student-badge student-badge--${detailPost.status.toLowerCase()}`}>
                  {getCounselingStatusLabel(detailPost.status)}
                </span>
              </div>

              <p className="student-post-item__meta">
                담당 교사: {detailPost.teacherName || detailPost.teacherUsername}
              </p>
              <p className="student-post-item__meta">
                상담 분류: {getCounselingTypeLabel(detailPost.counselingType)} · 희망{' '}
                {formatScheduleDateShort(detailPost.desiredDate)}
              </p>
              <p className="student-post-item__meta">
                작성: {formatDateTime(detailPost.createdAt)} · 수정:{' '}
                {formatDateTime(detailPost.updatedAt)}
              </p>

              <div className="student-detail-content">{detailPost.content}</div>

              {detailPost.teacherReply ? (
                <div className="student-reply-box">
                  <strong>교사 답변</strong>
                  <p className="student-post-item__meta">{formatDateTime(detailPost.repliedAt)}</p>
                  <div>{detailPost.teacherReply}</div>
                </div>
              ) : null}

              {detailPost.status === 'WAITING' ? (
                <div className="student-form-actions">
                  <button
                    type="button"
                    className="student-btn student-btn--primary"
                    onClick={() => openEditForm(detailPost)}
                    disabled={isDeleting}
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    className="student-btn student-btn--danger"
                    onClick={() => handleDelete(detailPost.id)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? '삭제 중…' : '삭제'}
                  </button>
                </div>
              ) : null}

              {isEditOpen && editForm ? (
                <div className="student-detail-panel">
                  <h3 className="student-detail-panel__title">수정하기</h3>
                  <form className="student-form" onSubmit={handleEditSubmit}>
                    <div className="student-field">
                      <label className="student-field__label" htmlFor="editCounselTitle">
                        제목
                      </label>
                      <input
                        id="editCounselTitle"
                        className="student-field__input"
                        type="text"
                        maxLength={100}
                        required
                        disabled={isSavingEdit}
                        value={editForm.title}
                        onChange={(event) =>
                          setEditForm((prev) =>
                            prev ? { ...prev, title: event.target.value } : prev,
                          )
                        }
                      />
                    </div>

                    <div className="student-field">
                      <label className="student-field__label" htmlFor="editCounselType">
                        상담 분류
                      </label>
                      <select
                        id="editCounselType"
                        className="student-field__input"
                        required
                        disabled={isSavingEdit}
                        value={editForm.counselingType}
                        onChange={(event) =>
                          setEditForm((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  counselingType: event.target.value as CounselingType,
                                }
                              : prev,
                          )
                        }
                      >
                        {COUNSELING_TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="student-field">
                      <label className="student-field__label" htmlFor="editCounselDesiredDate">
                        희망 상담일
                      </label>
                      <input
                        id="editCounselDesiredDate"
                        className="student-field__input"
                        type="date"
                        required
                        disabled={isSavingEdit}
                        min={getTodayDateInputValue()}
                        value={editForm.desiredDate}
                        onChange={(event) =>
                          setEditForm((prev) =>
                            prev ? { ...prev, desiredDate: event.target.value } : prev,
                          )
                        }
                      />
                    </div>

                    <div className="student-field">
                      <label className="student-field__label" htmlFor="editCounselContent">
                        상담 내용
                      </label>
                      <textarea
                        id="editCounselContent"
                        className="student-field__textarea"
                        required
                        disabled={isSavingEdit}
                        value={editForm.content}
                        onChange={(event) =>
                          setEditForm((prev) =>
                            prev ? { ...prev, content: event.target.value } : prev,
                          )
                        }
                      />
                    </div>

                    <div className="student-form-actions">
                      <button
                        type="submit"
                        className="student-btn student-btn--primary"
                        disabled={isSavingEdit}
                      >
                        {isSavingEdit ? '저장 중…' : '저장'}
                      </button>
                      <button
                        type="button"
                        className="student-btn student-btn--secondary"
                        disabled={isSavingEdit}
                        onClick={() => {
                          setIsEditOpen(false);
                          setEditForm(null);
                        }}
                      >
                        취소
                      </button>
                    </div>
                  </form>
                </div>
              ) : null}
            </>
          )}
        </StudentSectionCard>
      ) : null}
    </>
  );
}

function resolveErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  return fallback;
}
