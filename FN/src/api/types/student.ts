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
