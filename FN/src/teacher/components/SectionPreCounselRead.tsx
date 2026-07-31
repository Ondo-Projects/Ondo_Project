import { useEffect, useState } from 'react';
import {
  getTeacherPreCounselingProfile,
} from '../../api/teacher.api';
import { ApiError } from '../../api/types/api-error';
import type { PreCounselingProfileSummary } from '../../api/types/home';
import type { PreCounselingProfile } from '../../api/types/student';
import { TEACHER_SECTIONS } from '../constants';
import {
  displayFieldValue,
  formatDateTime,
  formatTeacherDisplay,
  scrollToTeacherSection,
} from '../teacherUtils';
import { Badge, Btn, CardHelper } from '../../components/ui';
import TeacherSectionCard from './TeacherSectionCard';

interface SectionPreCounselReadProps {
  prefetchedSummaries: PreCounselingProfileSummary[] | null;
  summariesLoaded: boolean;
  onError: (message: string) => void;
}

export default function SectionPreCounselRead({
  prefetchedSummaries,
  summariesLoaded,
  onError,
}: SectionPreCounselReadProps) {
  const [summaries, setSummaries] = useState<PreCounselingProfileSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState('');
  const [detailProfile, setDetailProfile] = useState<PreCounselingProfile | null>(null);
  const [showIncompleteMessage, setShowIncompleteMessage] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  useEffect(() => {
    if (summariesLoaded) {
      setSummaries(prefetchedSummaries ?? []);
      setIsLoading(false);
    }
  }, [summariesLoaded, prefetchedSummaries]);

  useEffect(() => {
    if (!selectedUsername) {
      return;
    }
    if (!summaries.some((item) => item.studentUsername === selectedUsername)) {
      setSelectedUsername(null);
      setSelectedStudentName('');
      setDetailProfile(null);
      setShowIncompleteMessage(false);
    }
  }, [summaries, selectedUsername]);

  function closeDetail() {
    setSelectedUsername(null);
    setSelectedStudentName('');
    setDetailProfile(null);
    setShowIncompleteMessage(false);
  }

  async function openProfile(
    studentUsername: string,
    completed: boolean,
    studentName: string,
  ) {
    setSelectedUsername(studentUsername);
    setSelectedStudentName(studentName);
    setDetailProfile(null);
    setShowIncompleteMessage(false);
    setIsDetailLoading(completed);

    if (!completed) {
      setShowIncompleteMessage(true);
      scrollDetailIntoView();
      return;
    }

    try {
      const profile = await getTeacherPreCounselingProfile(studentUsername);
      setDetailProfile(profile);
      scrollDetailIntoView();
    } catch (error) {
      setSelectedUsername(null);
      setSelectedStudentName('');
      onError(resolveErrorMessage(error, '사전 상담 카드를 불러오지 못했습니다.'));
    } finally {
      setIsDetailLoading(false);
    }
  }

  function scrollDetailIntoView() {
    if (window.innerWidth < 900) {
      scrollToTeacherSection(TEACHER_SECTIONS.PRE_COUNSEL_DETAIL);
    }
  }

  const showDetail =
    Boolean(selectedUsername) &&
    (showIncompleteMessage || isDetailLoading || Boolean(detailProfile));

  return (
    <TeacherSectionCard
      id={TEACHER_SECTIONS.PRE_COUNSEL_SUMMARY}
      title="4. 사전 상담 카드"
      helper="담당 학생이 작성한 사전 상담 카드를 열람할 수 있습니다. 열람 기록이 저장됩니다."
    >
      {isLoading ? (
        <p className="teacher-status">불러오는 중…</p>
      ) : summaries.length === 0 ? (
        <p className="teacher-status">등록된 학생이 없습니다.</p>
      ) : (
        <div className="teacher-pre-counsel-list">
          {summaries.map((item) => {
            const studentName = formatTeacherDisplay(item.studentName, item.studentUsername);
            const meta = item.updatedAt
              ? `최종 수정 ${formatDateTime(item.updatedAt)}`
              : '아직 작성하지 않았습니다.';

            return (
              <button
                key={item.studentUsername}
                type="button"
                className={`teacher-pre-counsel-item${
                  selectedUsername === item.studentUsername ? ' is-active' : ''
                }`}
                onClick={() => {
                  void openProfile(item.studentUsername, item.completed, studentName);
                }}
              >
                <div className="teacher-pre-counsel-item__header">
                  <strong>{studentName}</strong>
                  <Badge variant={item.completed ? 'completed' : 'pending'}>
                    {item.completed ? '작성완료' : '미작성'}
                  </Badge>
                </div>
                <p className="teacher-pre-counsel-item__meta">{meta}</p>
              </button>
            );
          })}
        </div>
      )}

      {showDetail ? (
        <div
          id={TEACHER_SECTIONS.PRE_COUNSEL_DETAIL}
          className="teacher-pre-counsel-detail-panel"
        >
          <div className="teacher-pre-counsel-detail-header">
            <h3 className="teacher-pre-counsel-detail-header__title">
              사전 상담 · {selectedStudentName || selectedUsername}
            </h3>
            <Btn type="button" variant="secondary" size="student" aria-label="사전 상담 닫기" onClick={closeDetail}>
              닫기
            </Btn>
          </div>

          {isDetailLoading ? (
            <p className="teacher-status">불러오는 중…</p>
          ) : showIncompleteMessage ? (
            <p className="teacher-status">아직 사전 상담 카드를 작성하지 않았습니다.</p>
          ) : detailProfile ? (
            <>
              <PreCounselDetailBody profile={detailProfile} />
              <CardHelper>최종 수정: {formatDateTime(detailProfile.updatedAt)}</CardHelper>
            </>
          ) : null}
        </div>
      ) : null}
    </TeacherSectionCard>
  );
}

function PreCounselDetailBody({ profile }: { profile: PreCounselingProfile }) {
  return (
    <div className="teacher-pre-counsel-detail">
      <div className="teacher-pre-counsel-block">
        <h3>인적 사항 및 기본 정보</h3>
        <p>
          <span className="teacher-pre-counsel-label">이름</span>{' '}
          {displayFieldValue(profile.studentName ?? undefined)}
        </p>
        <p>
          <span className="teacher-pre-counsel-label">생년월일</span>{' '}
          {displayFieldValue(profile.birthDate ?? undefined)}
        </p>
        <p>
          <span className="teacher-pre-counsel-label">연락처</span>{' '}
          {displayFieldValue(profile.studentPhone ?? undefined)}
        </p>
        <p>
          <span className="teacher-pre-counsel-label">부모님 연락처</span>{' '}
          {displayFieldValue(profile.parentPhone ?? undefined)}
        </p>
        <p>
          <span className="teacher-pre-counsel-label">MBTI</span>{' '}
          {displayFieldValue(profile.mbti ?? undefined)}
        </p>
        <p>
          <span className="teacher-pre-counsel-label">장래희망</span>{' '}
          {displayFieldValue(profile.futureHope ?? undefined)}
        </p>
        <p>
          <span className="teacher-pre-counsel-label">좌우명/좋아하는 단어</span>
          <br />
          {displayFieldValue(profile.favoriteWords ?? undefined)}
        </p>
      </div>

      <div className="teacher-pre-counsel-block">
        <h3>자기 이해 및 성향</h3>
        <p>
          <span className="teacher-pre-counsel-label">장점</span>
          <br />
          {displayFieldValue(profile.personalityStrength ?? undefined)}
        </p>
        <p>
          <span className="teacher-pre-counsel-label">단점</span>
          <br />
          {displayFieldValue(profile.personalityWeakness ?? undefined)}
        </p>
        <p>
          <span className="teacher-pre-counsel-label">취미·특기·관심사</span>
          <br />
          {displayFieldValue(profile.hobbiesSpecialtiesInterests ?? undefined)}
        </p>
        <p>
          <span className="teacher-pre-counsel-label">가장 행복할 때</span>
          <br />
          {displayFieldValue(profile.happiestMoment ?? undefined)}
        </p>
        <p>
          <span className="teacher-pre-counsel-label">가장 스트레스받을 때</span>
          <br />
          {displayFieldValue(profile.stressfulMoment ?? undefined)}
        </p>
        <p>
          <span className="teacher-pre-counsel-label">스트레스 해소 방법</span>
          <br />
          {displayFieldValue(profile.stressReliefMethod ?? undefined)}
        </p>
      </div>

      <div className="teacher-pre-counsel-block">
        <h3>교우 관계 및 학교생활</h3>
        <p>
          <span className="teacher-pre-counsel-label">작년 기억/즐거웠던 점</span>
          <br />
          {displayFieldValue(profile.memorableSchoolMoment ?? undefined)}
        </p>
        <p>
          <span className="teacher-pre-counsel-label">친해지고 싶은 친구 유형</span>
          <br />
          {displayFieldValue(profile.desiredFriendType ?? undefined)}
        </p>
        <p>
          <span className="teacher-pre-counsel-label">올해 해보고 싶은 역할</span>
          <br />
          {displayFieldValue(profile.desiredClassRole ?? undefined)}
        </p>
      </div>
    </div>
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
