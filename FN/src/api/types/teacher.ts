import type { CounselingStatus } from './counseling';
import type { MoodLevel, PreCounselingProfile } from './student';
import type {
  PreCounselingProfileSummary,
  ProfileSchoolResponse,
} from './home';
import type {
  SuggestionCreateRequest,
  SuggestionPost,
  SuggestionUpdateRequest,
} from './suggestion';

export type { ProfileSchoolResponse, PreCounselingProfileSummary };

export interface InviteCodeResponse {
  code: string;
  createdAt: string;
}

export interface TeacherNotificationSettings {
  phone?: string | null;
  smsNotifyEnabled: boolean;
  ready: boolean;
  message?: string | null;
}

export interface TeacherNotificationSettingsUpdateRequest {
  phone: string;
  smsNotifyEnabled: boolean;
}

export interface TeacherNotice {
  id: number;
  title: string;
  content: string;
  teacherUsername: string;
  teacherName: string;
  createdAt: string;
}

export interface TeacherNoticeCreateRequest {
  title: string;
  content: string;
}

export interface TeacherNoticeDeleteResponse {
  message: string;
}

export interface StudentMoodSummary {
  studentUsername: string;
  studentName: string;
  moodLevel: MoodLevel | null;
  recordedDate: string;
}

export interface MoodCountItem {
  code: string;
  label: string;
  emoji: string;
  count: number;
}

export interface StudentWeeklyMoodSummary {
  studentUsername: string;
  studentName: string;
  recordCount: number;
  dailyRecords: Array<{
    date: string;
    moodLevel: MoodLevel | null;
  }>;
}

export interface TeacherWeeklyMoodResponse {
  startDate: string;
  endDate: string;
  totalRecords: number;
  moodCounts: MoodCountItem[];
  students: StudentWeeklyMoodSummary[];
}

export type TeacherPreCounselingProfile = PreCounselingProfile;

export interface CounselingStatusUpdateRequest {
  status: CounselingStatus;
}

export interface CounselingReplyRequest {
  reply: string;
}

export type TeacherSuggestionPost = SuggestionPost;
export type TeacherSuggestionCreateRequest = SuggestionCreateRequest;
export type TeacherSuggestionUpdateRequest = SuggestionUpdateRequest;

/** 담임이 먼저 살펴보면 좋을 이유 (위기 신호 알림) */
export type AttentionReasonCode = 'STORMY_TODAY' | 'LOW_MOOD_REPEATED' | 'SCHOOL_VIOLENCE_OPEN';

export interface AttentionReason {
  code: AttentionReasonCode;
  message: string;
  /** SCHOOL_VIOLENCE_OPEN 일 때 해당 상담 글 번호 */
  counselingPostId: number | null;
}

/** BN StudentAttentionResponseDTO */
export interface StudentAttention {
  studentUsername: string;
  studentName: string | null;
  urgent: boolean;
  reasons: AttentionReason[];
}
