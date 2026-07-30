export type StudentWithdrawReason =
  | 'GOAL_ACHIEVED'
  | 'NO_LONGER_NEEDED'
  | 'GRADUATED_OR_TRANSFERRED'
  | 'PRIVACY_CONCERN'
  | 'SERVICE_INCONVENIENT'
  | 'OTHER';

export type TeacherWithdrawReason =
  | 'TRANSFERRED_OR_RETIRED'
  | 'SCHOOL_NOT_USING'
  | 'WORKFLOW_MISMATCH'
  | 'PRIVACY_OR_RECORD_CONCERN'
  | 'SERVICE_INCONVENIENT'
  | 'OTHER';

export type WithdrawReason = StudentWithdrawReason | TeacherWithdrawReason;

export interface AccountWithdrawRequest {
  password: string;
  agreed: boolean;
  reason?: WithdrawReason;
  reasonDetail?: string;
}

export interface MessageResponse {
  message: string;
}
