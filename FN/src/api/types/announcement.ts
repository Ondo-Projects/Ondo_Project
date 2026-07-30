export type AnnouncementAudience = 'ALL' | 'STUDENT' | 'TEACHER';

export interface Announcement {
  id: number;
  title: string;
  content: string;
  audience: AnnouncementAudience;
  adminUsername: string;
  adminName: string;
  createdAt: string;
}

export interface AnnouncementCreateRequest {
  title: string;
  content: string;
  audience: AnnouncementAudience;
}
