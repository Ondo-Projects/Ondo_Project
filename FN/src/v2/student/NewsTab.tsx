import { useEffect, useState } from 'react';
import type { StudentNotice } from '../../api/types/student';
import { usePlatformAnnouncementData, usePlatformAnnouncementPanel } from '../../home/PlatformAnnouncementProvider';
import { Button, EmptyState, Skeleton, Tabs } from '../../ds';
import { formatCompactDateTime } from '../common';
import { AnnouncementList } from '../shell/announcements';
import { Block, StatusText } from './ui';

type NewsView = 'class' | 'ondo';

interface NewsTabProps {
  hasAssignment: boolean;
  notices: StudentNotice[] | null;
  noticesError: string | null;
  loaded: boolean;
  go: (hash: string) => void;
}

export default function NewsTab({ hasAssignment, notices, noticesError, loaded, go }: NewsTabProps) {
  const [view, setView] = useState<NewsView>('class');
  const { markPanelSeen } = usePlatformAnnouncementPanel();
  const { isLoading } = usePlatformAnnouncementData();

  // 온도 공지를 열어 보면 종 알림의 '새 공지' 표시를 지웁니다.
  useEffect(() => {
    if (view === 'ondo' && !isLoading) markPanelSeen();
  }, [isLoading, markPanelSeen, view]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="px-1 pt-1 text-xl font-semibold tracking-tight text-gray-900">소식</h1>
      <Tabs
        items={[
          { value: 'class', label: '선생님 공지', count: notices?.length },
          { value: 'ondo', label: '온도 공지' },
        ]}
        value={view}
        onChange={setView}
        className="px-1"
      />

      {view === 'ondo' ? (
        <Block flush>
          <AnnouncementList emptyText="아직 온도 공지가 없어요." />
        </Block>
      ) : !hasAssignment ? (
        <Block>
          <p className="text-sm text-gray-900">담임 선생님과 연결하면 학급 공지를 받을 수 있어요.</p>
          <Button size="sm" className="mt-3" onClick={() => go('#me/teacher')}>
            초대 코드 입력
          </Button>
        </Block>
      ) : noticesError ? (
        <Block>
          <StatusText tone="warn">{noticesError}</StatusText>
        </Block>
      ) : !loaded || !notices ? (
        <Block>
          <Skeleton className="h-16 w-full" />
        </Block>
      ) : notices.length === 0 ? (
        <Block flush>
          <EmptyState title="아직 선생님 공지가 없어요" />
        </Block>
      ) : (
        <div className="flex flex-col gap-3">
          {notices.map((notice) => (
            <article key={notice.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="text-[15px] font-semibold text-gray-900">{notice.title}</h2>
              <p className="mt-0.5 text-xs text-gray-500 tabular-nums">
                {notice.teacherName || notice.teacherUsername} 선생님 · {formatCompactDateTime(notice.createdAt)}
              </p>
              <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-gray-800">{notice.content}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
