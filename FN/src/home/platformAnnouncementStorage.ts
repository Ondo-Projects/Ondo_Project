const LAST_SEEN_KEY = 'ondo.platform-announcements.lastSeenAt';

export function readLastSeenAt(): string | null {
  try {
    return localStorage.getItem(LAST_SEEN_KEY);
  } catch {
    return null;
  }
}

export function writeLastSeenAt(value: string): void {
  try {
    localStorage.setItem(LAST_SEEN_KEY, value);
  } catch {
    // ignore quota / private mode
  }
}

export function countUnreadAnnouncements(
  items: { createdAt: string }[],
  lastSeenAt: string | null,
): number {
  if (items.length === 0) {
    return 0;
  }
  if (!lastSeenAt) {
    return items.length;
  }
  return items.filter((item) => item.createdAt > lastSeenAt).length;
}

export function markAnnouncementsSeen(items: { createdAt: string }[]): void {
  if (items.length === 0) {
    writeLastSeenAt(new Date().toISOString());
    return;
  }

  const latest = items.reduce(
    (max, item) => (item.createdAt > max ? item.createdAt : max),
    items[0].createdAt,
  );
  writeLastSeenAt(latest);
}
