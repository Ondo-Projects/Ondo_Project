export type AnnouncementAudience = 'ALL' | 'STUDENT' | 'TEACHER';

export type AnnouncementStatus = 'PUBLISHED' | 'ARCHIVED';

export const ANNOUNCEMENT_AUDIENCE_LABELS: Record<AnnouncementAudience, string> = {
  ALL: '전체',
  STUDENT: '학생',
  TEACHER: '교사',
};

export interface AnnouncementSummary {
  id: number;
  title: string;
  contentPreview: string;
  audience: AnnouncementAudience;
  adminUsername: string;
  adminName: string;
  pinned: boolean;
  status: AnnouncementStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementDetail extends AnnouncementSummary {
  content: string;
}

/** @deprecated Use AnnouncementDetail for full records or AnnouncementSummary for lists. */
export type Announcement = AnnouncementDetail;

export interface AnnouncementPageResponse {
  items: AnnouncementSummary[];
  totalElements: number;
  page: number;
  size: number;
}

export interface AnnouncementCreateRequest {
  title: string;
  content: string;
  audience: AnnouncementAudience;
}

export interface AnnouncementUpdateRequest {
  title?: string;
  content?: string;
  audience?: AnnouncementAudience;
  pinned?: boolean;
  status?: AnnouncementStatus;
}
