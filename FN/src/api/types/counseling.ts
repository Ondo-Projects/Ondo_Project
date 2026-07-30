export type CounselingType =
  | 'ACADEMIC'
  | 'CAREER'
  | 'EMOTIONAL'
  | 'INTERPERSONAL'
  | 'LIFE'
  | 'FAMILY'
  | 'BEHAVIOR'
  | 'SCHOOL_VIOLENCE'
  | 'OTHER';

export type CounselingStatus = 'WAITING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface CounselingPost {
  id: number;
  title: string;
  content: string;
  desiredDate: string;
  counselingType: CounselingType;
  status: CounselingStatus;
  createdAt: string;
  updatedAt: string;
  studentUsername: string;
  studentName: string;
  teacherUsername: string;
  teacherName: string;
  readByTeacherAt?: string | null;
  teacherReply?: string | null;
  repliedAt?: string | null;
}

export interface CounselingCreateRequest {
  title: string;
  content: string;
  desiredDate: string;
  counselingType: CounselingType;
}

export interface CounselingUpdateRequest {
  title: string;
  content: string;
  desiredDate: string;
  counselingType: CounselingType;
}

export interface CounselingDeleteResponse {
  message: string;
}
