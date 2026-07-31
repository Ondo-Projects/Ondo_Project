import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '../auth/AuthProvider';
import { usePlatformAnnouncementsState } from './usePlatformAnnouncements';
import {
  countUnreadAnnouncements,
  markAnnouncementsSeen,
  readLastSeenAt,
  writeLastSeenAt,
} from './platformAnnouncementStorage';

interface PlatformAnnouncementContextValue {
  isPanelOpen: boolean;
  unreadCount: number;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  markPanelSeen: () => void;
}

const PlatformAnnouncementContext = createContext<PlatformAnnouncementContextValue | null>(null);

export function PlatformAnnouncementProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const announcementState = usePlatformAnnouncementsState(isAuthenticated);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(() => readLastSeenAt());

  const unreadCount = useMemo(
    () => countUnreadAnnouncements(announcementState.items, lastSeenAt),
    [announcementState.items, lastSeenAt],
  );

  const markPanelSeen = useCallback(() => {
    if (announcementState.items.length === 0) {
      return;
    }
    markAnnouncementsSeen(announcementState.items);
    setLastSeenAt(readLastSeenAt());
  }, [announcementState.items]);

  const openPanel = useCallback(() => {
    setIsPanelOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setIsPanelOpen(false);
  }, []);

  const togglePanel = useCallback(() => {
    setIsPanelOpen((open) => !open);
  }, []);

  useEffect(() => {
    if (!isPanelOpen || announcementState.isLoading) {
      return;
    }
    if (announcementState.items.length === 0) {
      writeLastSeenAt(new Date().toISOString().slice(0, 19));
      setLastSeenAt(readLastSeenAt());
      return;
    }
    markPanelSeen();
  }, [announcementState.isLoading, announcementState.items.length, isPanelOpen, markPanelSeen]);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsPanelOpen(false);
    }
  }, [isAuthenticated]);

  const panelValue = useMemo(
    () => ({
      isPanelOpen,
      unreadCount,
      openPanel,
      closePanel,
      togglePanel,
      markPanelSeen,
    }),
    [closePanel, isPanelOpen, markPanelSeen, openPanel, togglePanel, unreadCount],
  );

  return (
    <PlatformAnnouncementContext.Provider value={panelValue}>
      <PlatformAnnouncementDataContext.Provider value={announcementState}>
        {children}
      </PlatformAnnouncementDataContext.Provider>
    </PlatformAnnouncementContext.Provider>
  );
}

type AnnouncementState = ReturnType<typeof usePlatformAnnouncementsState>;

const PlatformAnnouncementDataContext = createContext<AnnouncementState | null>(null);

export function usePlatformAnnouncementPanel(): PlatformAnnouncementContextValue {
  const context = useContext(PlatformAnnouncementContext);
  if (!context) {
    throw new Error('usePlatformAnnouncementPanel must be used within PlatformAnnouncementProvider.');
  }
  return context;
}

export function usePlatformAnnouncementData(): AnnouncementState {
  const context = useContext(PlatformAnnouncementDataContext);
  if (!context) {
    throw new Error('usePlatformAnnouncementData must be used within PlatformAnnouncementProvider.');
  }
  return context;
}
