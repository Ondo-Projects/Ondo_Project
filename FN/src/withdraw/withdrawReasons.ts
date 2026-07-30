import type { UserRole } from '../api/types/auth';
import type { StudentWithdrawReason, TeacherWithdrawReason, WithdrawReason } from '../api/types/withdraw';

export interface WithdrawReasonOption {
  value: WithdrawReason;
  label: string;
}

const STUDENT_WITHDRAW_REASONS: WithdrawReasonOption[] = [
  { value: 'GOAL_ACHIEVED', label: '상담 목적을 달성했어요.' },
  { value: 'NO_LONGER_NEEDED', label: '더 이상 상담이 필요하지 않아요.' },
  { value: 'GRADUATED_OR_TRANSFERRED', label: '졸업·전학 등으로 학교를 떠나요.' },
  { value: 'PRIVACY_CONCERN', label: '상담 기록·개인정보 보관이 걱정돼요.' },
  { value: 'SERVICE_INCONVENIENT', label: '웹 이용이 불편하거나 잘 쓰지 않아요.' },
  { value: 'OTHER', label: '기타' },
];

const TEACHER_WITHDRAW_REASONS: WithdrawReasonOption[] = [
  { value: 'TRANSFERRED_OR_RETIRED', label: '전보·전근·퇴직 등으로 더 이상 이용하지 않아요.' },
  { value: 'SCHOOL_NOT_USING', label: '학교에서 이 서비스를 쓰지 않아요.' },
  { value: 'WORKFLOW_MISMATCH', label: '학교 상담 업무 방식과 맞지 않아요.' },
  { value: 'PRIVACY_OR_RECORD_CONCERN', label: '상담 기록·개인정보 관리가 부담돼요.' },
  { value: 'SERVICE_INCONVENIENT', label: '기능이 불편하거나 자주 쓰지 않아요.' },
  { value: 'OTHER', label: '기타' },
];

export function getWithdrawReasonOptions(role: UserRole): WithdrawReasonOption[] {
  if (role === 'STUDENT') {
    return STUDENT_WITHDRAW_REASONS;
  }
  if (role === 'TEACHER') {
    return TEACHER_WITHDRAW_REASONS;
  }
  return [];
}

export function isStudentWithdrawReason(value: WithdrawReason): value is StudentWithdrawReason {
  return STUDENT_WITHDRAW_REASONS.some((option) => option.value === value);
}

export function isTeacherWithdrawReason(value: WithdrawReason): value is TeacherWithdrawReason {
  return TEACHER_WITHDRAW_REASONS.some((option) => option.value === value);
}
