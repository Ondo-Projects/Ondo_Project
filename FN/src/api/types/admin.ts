import type { UserRole } from './auth';
import type { SuggestionCategory, SuggestionStatus } from './suggestion';

export interface AdminPageResponse<T> {
  items: T[];
  totalElements: number;
  page: number;
  size: number;
}

export interface AdminDashboardResponse {
  totalUsers: number;
  studentCount: number;
  teacherCount: number;
  adminCount: number;
  totalSchools: number;
  neisMappedSchools: number;
  totalCounselingPosts: number;
  counselingPostsToday: number;
  counselingAccessLogsToday: number;
  preCounselAccessLogsToday: number;
}

export interface AdminSystemStatusResponse {
  neisDevMode: boolean;
  neisApiKeyConfigured: boolean;
  weatherDevMode: boolean;
  weatherApiKeyConfigured: boolean;
  encryptionDevMode: boolean;
  encryptionKeyConfigured: boolean;
}

export interface AdminStatisticsResponse {
  counselingByStatus: Record<string, number>;
  moodByLevelLast7Days: Record<string, number>;
}

export interface AdminUserSummary {
  username: string;
  name: string;
  role: UserRole;
  schoolCode: string;
  schoolName: string;
  schoolRegion: string;
  active: boolean;
}

export interface AdminUserStatusRequest {
  active: boolean;
}

export interface AdminUserSchoolChangeRequest {
  schoolCode: string;
}

export interface AdminSchoolSummary {
  schoolCode: string;
  schoolName: string;
  region: string;
  schoolType: string;
  neisMapped: boolean;
  neisOfficeCode: string;
  neisSchoolCode: string;
}

export interface AdminSchoolSyncResponse {
  syncedCount: number;
  message: string;
}

export interface AdminNeisSyncResponse {
  processedCount: number;
  successCount: number;
  failedCount: number;
  message: string;
}

export interface AdminActivityLog {
  id: number;
  adminUsername: string;
  action: string;
  targetUsername: string | null;
  detail: string | null;
  createdAt: string;
}

export interface AdminCounselingAccessLog {
  id: number;
  counselingPostId: number;
  counselingTitle: string;
  studentUsername: string;
  studentName: string;
  teacherUsername: string;
  teacherName: string;
  accessedAt: string;
}

export interface AdminPreCounselAccessLog {
  id: number;
  studentUsername: string;
  studentName: string;
  teacherUsername: string;
  teacherName: string;
  accessedAt: string;
}

export interface AdminSuggestionSummary {
  id: number;
  category: SuggestionCategory;
  title: string;
  status: SuggestionStatus;
  authorUsername: string;
  authorName: string;
  authorRole: UserRole;
  createdAt: string;
  hasAdminReply: boolean;
}

export interface AdminSuggestionReplyRequest {
  reply: string;
}

export interface AdminSuggestionStatusRequest {
  status: SuggestionStatus;
}

export interface AdminUserSearchParams {
  role?: UserRole | '';
  keyword?: string;
  schoolCode?: string;
  page?: number;
  size?: number;
}

export interface AdminSchoolSearchParams {
  keyword?: string;
  mapped?: boolean | '';
  page?: number;
  size?: number;
}

export interface AdminSuggestionSearchParams {
  status?: SuggestionStatus | '';
  category?: SuggestionCategory | '';
  role?: UserRole | '';
  keyword?: string;
  page?: number;
  size?: number;
}
