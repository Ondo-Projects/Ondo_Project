import { useCallback, useEffect, useState } from 'react';

import { getCommonAnnouncement, getCommonAnnouncements } from '../api/home.api';
import type { AnnouncementDetail, AnnouncementSummary } from '../api/types/announcement';
import { ApiError } from '../api/types/api-error';

const PAGE_SIZE = 10;

function resolveErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }
  if (error instanceof Error) {
    return error.message || fallback;
  }
  return fallback;
}

export function usePlatformAnnouncementsState(enabled: boolean) {
  const [items, setItems] = useState<AnnouncementSummary[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<AnnouncementDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const loadInitial = useCallback(async () => {
    if (!enabled) {
      setItems([]);
      setTotalElements(0);
      setPage(0);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await getCommonAnnouncements(0, PAGE_SIZE);
      setItems(response.items);
      setTotalElements(response.totalElements);
      setPage(0);
    } catch (loadError) {
      setItems([]);
      setTotalElements(0);
      setError(resolveErrorMessage(loadError, '플랫폼 공지를 불러오지 못했습니다.'));
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const loadMore = useCallback(async () => {
    if (!enabled || isLoadingMore || items.length >= totalElements) {
      return;
    }

    const nextPage = page + 1;
    setIsLoadingMore(true);

    try {
      const response = await getCommonAnnouncements(nextPage, PAGE_SIZE);
      setItems((current) => [...current, ...response.items]);
      setTotalElements(response.totalElements);
      setPage(nextPage);
    } catch (loadError) {
      setError(resolveErrorMessage(loadError, '추가 공지를 불러오지 못했습니다.'));
    } finally {
      setIsLoadingMore(false);
    }
  }, [enabled, isLoadingMore, items.length, page, totalElements]);

  const openDetail = useCallback(async (id: number) => {
    setSelectedId(id);
    setDetail(null);
    setDetailError(null);
    setIsDetailLoading(true);

    try {
      const response = await getCommonAnnouncement(id);
      setDetail(response);
    } catch (loadError) {
      setDetailError(resolveErrorMessage(loadError, '공지 상세를 불러오지 못했습니다.'));
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  const closeDetail = useCallback(() => {
    setSelectedId(null);
    setDetail(null);
    setDetailError(null);
    setIsDetailLoading(false);
  }, []);

  const hasMore = items.length < totalElements;

  return {
    items,
    totalElements,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    selectedId,
    detail,
    isDetailLoading,
    detailError,
    loadMore,
    openDetail,
    closeDetail,
    reload: loadInitial,
  };
}

/** @deprecated Use usePlatformAnnouncementData from PlatformAnnouncementProvider */
export function usePlatformAnnouncements() {
  return usePlatformAnnouncementsState(true);
}
