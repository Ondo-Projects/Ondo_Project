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
