import { useCallback, useEffect, useState } from 'react';
import { getTeacherCounselingPosts, getTeacherUnreadCount } from '../api/counseling.api';
import { getTeacherPreCounselingProfiles, getTeacherSuggestions } from '../api/teacher.api';
import { ApiError } from '../api/types/api-error';
import type { CounselingPost } from '../api/types/counseling';
import type { PreCounselingProfileSummary } from '../api/types/home';
import type { SuggestionPost } from '../api/types/suggestion';

export interface TeacherSuggestionSummary {
  count: string;
  hint: string;
  highlight: boolean;
}

export interface TeacherDashboardSummary {
  unreadCount: number | null;
  waitingCount: number | null;
  preCounselPendingCount: number | null;
  suggestion: TeacherSuggestionSummary;
  isLoading: boolean;
  error: string | null;
}

export interface TeacherDashboardData {
  summary: TeacherDashboardSummary;
  counselingPosts: CounselingPost[] | null;
  preCounselSummaries: PreCounselingProfileSummary[] | null;
  suggestions: SuggestionPost[] | null;
  listsLoaded: boolean;
}

const initialSuggestionSummary: TeacherSuggestionSummary = {
  count: '-',
  hint: '불러오는 중…',
  highlight: false,
};

const initialSummary: TeacherDashboardSummary = {
  unreadCount: null,
  waitingCount: null,
  preCounselPendingCount: null,
  suggestion: initialSuggestionSummary,
  isLoading: true,
  error: null,
};

const initialState: TeacherDashboardData = {
  summary: initialSummary,
  counselingPosts: null,
  preCounselSummaries: null,
  suggestions: null,
  listsLoaded: false,
};

function resolveErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
}

function buildSuggestionSummary(
  suggestions: SuggestionPost[] | null,
  suggestionsLoaded: boolean,
): TeacherSuggestionSummary {
  if (!suggestionsLoaded || suggestions === null) {
    return initialSuggestionSummary;
  }

  const withReplyCount = suggestions.filter((item) => item.adminReply).length;
  const awaitingReplyCount = suggestions.filter(
    (item) => !item.adminReply && item.status !== 'CLOSED',
  ).length;

  if (withReplyCount > 0) {
    return {
      count: String(withReplyCount),
      hint: '관리자 답변',
      highlight: true,
    };
  }
  if (awaitingReplyCount > 0) {
    return {
      count: String(awaitingReplyCount),
      hint: '접수 중',
      highlight: false,
    };
  }
  return {
    count: '0',
    hint: '건의하기',
    highlight: false,
  };
}

function buildSummaryFromLists(
  unreadResult: { count: number } | null,
  postsResult: CounselingPost[] | null,
  preCounselResult: PreCounselingProfileSummary[] | null,
  suggestionsResult: SuggestionPost[] | null,
): TeacherDashboardSummary {
  return {
    unreadCount: unreadResult?.count ?? 0,
    waitingCount: postsResult?.filter((post) => post.status === 'WAITING').length ?? 0,
    preCounselPendingCount: preCounselResult?.filter((item) => !item.completed).length ?? 0,
    suggestion: buildSuggestionSummary(suggestionsResult, suggestionsResult !== null),
    isLoading: false,
    error: null,
  };
}

export function useTeacherDashboard(enabled: boolean, refreshToken = 0) {
  const [data, setData] = useState<TeacherDashboardData>(initialState);

  const reloadSummary = useCallback(async () => {
    setData((prev) => ({
      ...prev,
      summary: { ...prev.summary, isLoading: true, error: null },
    }));

    try {
      const [unreadResult, postsResult, preCounselResult, suggestionsResult] = await Promise.all([
        getTeacherUnreadCount().catch(() => null),
        getTeacherCounselingPosts().catch(() => null),
        getTeacherPreCounselingProfiles().catch(() => null),
        getTeacherSuggestions().catch(() => null),
      ]);

      setData({
        summary: buildSummaryFromLists(
          unreadResult,
          postsResult,
          preCounselResult,
          suggestionsResult,
        ),
        counselingPosts: postsResult,
        preCounselSummaries: preCounselResult,
        suggestions: suggestionsResult,
        listsLoaded: true,
      });
    } catch (error) {
      setData({
        summary: {
          ...initialSummary,
          isLoading: false,
          error: resolveErrorMessage(error, '요약 정보를 불러오지 못했습니다.'),
          suggestion: {
            count: '-',
            hint: '불러오기 실패',
            highlight: false,
          },
        },
        counselingPosts: null,
        preCounselSummaries: null,
        suggestions: null,
        listsLoaded: false,
      });
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    reloadSummary();
  }, [enabled, refreshToken, reloadSummary]);

  return { ...data, summary: data.summary, reloadSummary };
}
