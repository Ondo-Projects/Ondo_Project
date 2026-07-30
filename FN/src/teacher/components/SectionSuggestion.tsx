import { type FormEvent, useCallback, useEffect, useState } from 'react';
import {
  createTeacherSuggestion,
  deleteTeacherSuggestion,
  getTeacherSuggestion,
  getTeacherSuggestions,
  updateTeacherSuggestion,
} from '../../api/teacher.api';
import { ApiError } from '../../api/types/api-error';
import type { SuggestionCategory, SuggestionPost } from '../../api/types/suggestion';
import {
  getSuggestionCategoryLabel,
  getSuggestionStatusLabel,
  getTeacherSuggestionCategoryBadgeClass,
  getTeacherSuggestionStatusBadgeClass,
  isSuggestionOpen,
  SUGGESTION_CATEGORY_OPTIONS,
} from '../teacherSuggestionUtils';
import { TEACHER_SECTIONS } from '../constants';
import { formatDateTime, scrollToTeacherSection } from '../teacherUtils';
import TeacherSectionCard from './TeacherSectionCard';

interface SectionSuggestionProps {
  refreshToken: number;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

interface CreateFormState {
  category: SuggestionCategory | '';
  title: string;
  content: string;
}

interface EditFormState {
  id: number;
  category: SuggestionCategory;
  title: string;
  content: string;
}

const EMPTY_CREATE_FORM: CreateFormState = {
  category: '',
  title: '',
  content: '',
};

export default function SectionSuggestion({
  refreshToken,
  onSuccess,
  onError,
}: SectionSuggestionProps) {
  const [createForm, setCreateForm] = useState<CreateFormState>(EMPTY_CREATE_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailPost, setDetailPost] = useState<SuggestionPost | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadSuggestions = useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await getTeacherSuggestions();
      setSuggestions(data);
    } catch (error) {
      onError(resolveErrorMessage(error, '건의 목록을 불러오지 못했습니다.'));
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions, refreshToken]);

  useEffect(() => {
    if (!selectedId || !suggestions.some((item) => item.id === selectedId)) {
      setDetailPost(null);
      setIsEditOpen(false);
      setEditForm(null);
    }
  }, [selectedId, suggestions]);

  async function openDetail(id: number, scroll = true) {
    setSelectedId(id);
    setIsEditOpen(false);
    setEditForm(null);
    setIsDetailLoading(true);

    try {
      const post = await getTeacherSuggestion(id);
      setDetailPost(post);
      if (scroll) {
        scrollToTeacherSection(`${TEACHER_SECTIONS.SUGGESTION}-detail`);
      }
    } catch (error) {
      setSelectedId(null);
      setDetailPost(null);
      onError(resolveErrorMessage(error, '건의 상세를 불러오지 못했습니다.'));
    } finally {
      setIsDetailLoading(false);
    }
  }

  function closeDetail() {
    setSelectedId(null);
    setDetailPost(null);
    setIsEditOpen(false);
    setEditForm(null);
  }

  async function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!createForm.category) {
      onError('건의 분류를 선택해 주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const created = await createTeacherSuggestion({
        category: createForm.category,
        title: createForm.title.trim(),
        content: createForm.content.trim(),
      });
      setCreateForm(EMPTY_CREATE_FORM);
      onSuccess('건의가 등록되었습니다.');
      await loadSuggestions();
      await openDetail(created.id);
    } catch (error) {
      onError(resolveErrorMessage(error, '건의를 등록하지 못했습니다.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  function openEditForm(post: SuggestionPost) {
    setEditForm({
      id: post.id,
      category: post.category,
      title: post.title,
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
      await updateTeacherSuggestion(editForm.id, {
        category: editForm.category,
        title: editForm.title.trim(),
        content: editForm.content.trim(),
      });
      onSuccess('건의 글이 수정되었습니다.');
      setIsEditOpen(false);
      setEditForm(null);
      await loadSuggestions();
      await openDetail(editForm.id, false);
    } catch (error) {
      onError(resolveErrorMessage(error, '건의 글을 수정하지 못했습니다.'));
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('이 건의 글을 삭제할까요?')) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteTeacherSuggestion(id);
      onSuccess('건의 글이 삭제되었습니다.');
      closeDetail();
      await loadSuggestions();
    } catch (error) {
      onError(resolveErrorMessage(error, '건의 글을 삭제하지 못했습니다.'));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <TeacherSectionCard
      id={TEACHER_SECTIONS.SUGGESTION}
      title="6. 운영 건의"
      helper="서비스 버그, 기능 개선, 운영 문의를 운영팀에 남길 수 있습니다. 담당 관리자만 확인합니다."
    >
      <form className="teacher-form" onSubmit={handleCreateSubmit}>
        <div className="teacher-field">
          <label className="teacher-field__label" htmlFor="suggestionCategory">
            분류
          </label>
          <select
            id="suggestionCategory"
            className="teacher-field__input"
            required
            disabled={isSubmitting}
            value={createForm.category}
            onChange={(event) =>
              setCreateForm((prev) => ({
                ...prev,
                category: event.target.value as SuggestionCategory,
              }))
            }
          >
            <option value="">선택해 주세요</option>
            {SUGGESTION_CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="teacher-field">
          <label className="teacher-field__label" htmlFor="suggestionTitle">
            제목
          </label>
          <input
            id="suggestionTitle"
            className="teacher-field__input"
            type="text"
            maxLength={100}
            required
            disabled={isSubmitting}
            placeholder="건의 제목을 입력해 주세요."
            value={createForm.title}
            onChange={(event) =>
              setCreateForm((prev) => ({ ...prev, title: event.target.value }))
            }
          />
        </div>

        <div className="teacher-field">
          <label className="teacher-field__label" htmlFor="suggestionContent">
            내용
          </label>
          <textarea
            id="suggestionContent"
            className="teacher-field__textarea"
            maxLength={2000}
            required
            disabled={isSubmitting}
            placeholder="어떤 문제인지, 어떤 점이 불편했는지 구체적으로 적어 주세요."
            value={createForm.content}
            onChange={(event) =>
              setCreateForm((prev) => ({ ...prev, content: event.target.value }))
            }
          />
        </div>

        <div className="teacher-form-actions">
          <button
            type="submit"
            className="teacher-btn teacher-btn--primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? '등록 중…' : '건의 등록하기'}
          </button>
        </div>
      </form>

      <h3 className="teacher-subheading">내 건의</h3>

      {isLoading ? (
        <p className="teacher-status">불러오는 중…</p>
      ) : suggestions.length === 0 ? (
        <p className="teacher-status">아직 등록한 건의가 없습니다.</p>
      ) : (
        <div className="teacher-post-list">
          {suggestions.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`teacher-post-item${selectedId === item.id ? ' is-active' : ''}`}
              onClick={() => openDetail(item.id)}
            >
              <div className="teacher-post-item__header">
                <h4 className="teacher-post-item__title">{item.title}</h4>
                <div className="teacher-suggestion-badges">
                  <span className={getTeacherSuggestionCategoryBadgeClass()}>
                    {getSuggestionCategoryLabel(item.category)}
                  </span>
                  <span className={getTeacherSuggestionStatusBadgeClass(item.status)}>
                    {getSuggestionStatusLabel(item.status)}
                  </span>
                </div>
              </div>
              <p className="teacher-post-item__meta">
                {formatDateTime(item.createdAt)}
                {item.adminReply ? ' · 답변 있음' : ''}
              </p>
            </button>
          ))}
        </div>
      )}

      {detailPost || isDetailLoading ? (
        <div
          id={`${TEACHER_SECTIONS.SUGGESTION}-detail`}
          className="teacher-suggestion-detail"
        >
          <div className="teacher-suggestion-detail__header">
            <h3 className="teacher-subheading teacher-subheading--compact">건의 상세</h3>
            <button
              type="button"
              className="teacher-btn teacher-btn--secondary"
              onClick={closeDetail}
              aria-label="건의 상세 닫기"
            >
              닫기
            </button>
          </div>

          {isDetailLoading || !detailPost ? (
            <p className="teacher-status">불러오는 중…</p>
          ) : (
            <>
              <div className="teacher-post-item__header">
                <h4 className="teacher-post-item__title">{detailPost.title}</h4>
                <div className="teacher-suggestion-badges">
                  <span className={getTeacherSuggestionCategoryBadgeClass()}>
                    {getSuggestionCategoryLabel(detailPost.category)}
                  </span>
                  <span className={getTeacherSuggestionStatusBadgeClass(detailPost.status)}>
                    {getSuggestionStatusLabel(detailPost.status)}
                  </span>
                </div>
              </div>

              <p className="teacher-post-meta">
                작성 {formatDateTime(detailPost.createdAt)}
                {detailPost.updatedAt !== detailPost.createdAt
                  ? ` · 수정 ${formatDateTime(detailPost.updatedAt)}`
                  : ''}
              </p>

              <div className="teacher-detail-content">{detailPost.content}</div>

              {detailPost.adminReply ? (
                <div className="teacher-existing-reply">
                  <strong>관리자 답변</strong>
                  <p className="teacher-post-meta">
                    {detailPost.repliedByUsername ? `${detailPost.repliedByUsername} · ` : ''}
                    {formatDateTime(detailPost.repliedAt)}
                  </p>
                  <div className="teacher-detail-content teacher-detail-content--plain">
                    {detailPost.adminReply}
                  </div>
                </div>
              ) : null}

              {isSuggestionOpen(detailPost.status) ? (
                <div className="teacher-form-actions">
                  <button
                    type="button"
                    className="teacher-btn teacher-btn--primary"
                    onClick={() => openEditForm(detailPost)}
                    disabled={isDeleting}
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    className="teacher-btn teacher-btn--danger"
                    onClick={() => handleDelete(detailPost.id)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? '삭제 중…' : '삭제'}
                  </button>
                </div>
              ) : (
                <p className="teacher-card__helper">
                  검토 중이거나 처리된 건의는 수정할 수 없습니다.
                </p>
              )}

              {isEditOpen && editForm ? (
                <div className="teacher-detail-panel">
                  <h3 className="teacher-detail-panel__title">건의 수정</h3>
                  <form className="teacher-form" onSubmit={handleEditSubmit}>
                    <div className="teacher-field">
                      <label className="teacher-field__label" htmlFor="suggestionEditCategory">
                        분류
                      </label>
                      <select
                        id="suggestionEditCategory"
                        className="teacher-field__input"
                        required
                        disabled={isSavingEdit}
                        value={editForm.category}
                        onChange={(event) =>
                          setEditForm((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  category: event.target.value as SuggestionCategory,
                                }
                              : prev,
                          )
                        }
                      >
                        {SUGGESTION_CATEGORY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="teacher-field">
                      <label className="teacher-field__label" htmlFor="suggestionEditTitle">
                        제목
                      </label>
                      <input
                        id="suggestionEditTitle"
                        className="teacher-field__input"
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

                    <div className="teacher-field">
                      <label className="teacher-field__label" htmlFor="suggestionEditContent">
                        내용
                      </label>
                      <textarea
                        id="suggestionEditContent"
                        className="teacher-field__textarea"
                        maxLength={2000}
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

                    <div className="teacher-form-actions">
                      <button
                        type="submit"
                        className="teacher-btn teacher-btn--primary"
                        disabled={isSavingEdit}
                      >
                        {isSavingEdit ? '저장 중…' : '저장'}
                      </button>
                      <button
                        type="button"
                        className="teacher-btn teacher-btn--secondary"
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
        </div>
      ) : null}
    </TeacherSectionCard>
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
