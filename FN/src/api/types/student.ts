export interface StudentNotice {
  id: number;
  title: string;
  content: string;
  teacherUsername: string;
  teacherName: string;
  createdAt: string;
}

export interface StudentAssignment {
  teacherUsername: string;
  teacherName: string;
  schoolName: string;
  assignedAt: string;
}

export interface StudentClassProfile {
  grade: number | null;
  classNumber: number | null;
  completed: boolean;
  message?: string | null;
}

export interface StudentClassProfileUpdateRequest {
  grade: number | null;
  classNumber: number | null;
}

export interface StudentAssignmentRegisterRequest {
  inviteCode: string;
}

export type MoodLevelCode = 'SUNNY' | 'FAIR' | 'CLOUDY' | 'RAINY' | 'STORMY';

export interface MoodLevel {
  code: MoodLevelCode;
  label: string;
  emoji: string;
}

export interface MoodTodayResponse {
  recorded?: boolean;
  moodLevel?: MoodLevel;
  recordedDate?: string | null;
  updatedAt?: string | null;
}

export interface MoodRecordResponse {
  moodLevel: MoodLevel;
  recordedDate: string;
  updatedAt: string;
}

export interface PreCounselingProfile {
  completed: boolean;
  studentUsername: string;
  studentName?: string | null;
  birthDate?: string | null;
  studentPhone?: string | null;
  parentPhone?: string | null;
  mbti?: string | null;
  futureHope?: string | null;
  favoriteWords?: string | null;
  personalityStrength?: string | null;
  personalityWeakness?: string | null;
  hobbiesSpecialtiesInterests?: string | null;
  happiestMoment?: string | null;
  stressfulMoment?: string | null;
  stressReliefMethod?: string | null;
  memorableSchoolMoment?: string | null;
  desiredFriendType?: string | null;
  desiredClassRole?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface PreCounselingProfileSaveRequest {
  studentPhone: string;
  parentPhone: string;
  mbti?: string;
  futureHope: string;
  favoriteWords: string;
  personalityStrength: string;
  personalityWeakness: string;
  hobbiesSpecialtiesInterests: string;
  happiestMoment: string;
  stressfulMoment: string;
  stressReliefMethod: string;
  memorableSchoolMoment: string;
  desiredFriendType: string;
  desiredClassRole: string;
}

export interface PreCounselingProfileSaveResponse {
  message: string;
  profile: PreCounselingProfile;
}
