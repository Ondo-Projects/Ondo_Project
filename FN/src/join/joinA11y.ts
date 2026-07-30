import type { SignUpRole } from '../api/types/signup';
import type { JoinFieldErrors, JoinFieldKey } from './joinValidation';

interface FocusTarget {
  key: JoinFieldKey;
  getElementId: (role: SignUpRole) => string;
}

const FOCUS_TARGETS: FocusTarget[] = [
  { key: 'school', getElementId: () => 'schoolKeyword' },
  { key: 'name', getElementId: () => 'name' },
  { key: 'birthDate', getElementId: () => 'birthDate' },
  {
    key: 'email',
    getElementId: (role) => (role === 'TEACHER' ? 'teacherEmail' : 'studentEmail'),
  },
  {
    key: 'emailVerification',
    getElementId: (role) => (role === 'TEACHER' ? 'teacherEmail' : 'studentEmail'),
  },
  { key: 'guardianName', getElementId: () => 'guardianName' },
  { key: 'guardianPhone', getElementId: () => 'guardianPhone' },
  { key: 'guardianRelation', getElementId: () => 'guardianRelation' },
  { key: 'agreeGuardianChildPrivacy', getElementId: () => 'agreeGuardianChildPrivacy' },
  { key: 'agreeGuardianChildSensitive', getElementId: () => 'agreeGuardianChildSensitive' },
  { key: 'agreeGuardianIdentity', getElementId: () => 'agreeGuardianIdentity' },
  { key: 'smsVerification', getElementId: () => 'smsVerificationCode' },
  { key: 'username', getElementId: () => 'username' },
  { key: 'password', getElementId: () => 'password' },
  { key: 'passwordConfirm', getElementId: () => 'passwordConfirm' },
  { key: 'agreeService', getElementId: () => 'agreeService' },
  { key: 'agreePrivacy', getElementId: () => 'agreePrivacy' },
  { key: 'agreeSensitive', getElementId: () => 'agreeSensitive' },
];

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function getJoinErrorSummary(errors: JoinFieldErrors): string | null {
  const count = Object.keys(errors).length;
  if (count === 0) {
    return null;
  }

  return `아직 확인이 필요한 항목이 ${count}개 있어요. 아래 안내를 따라 입력해 주세요.`;
}

export function scrollToFirstJoinError(errors: JoinFieldErrors, role: SignUpRole): void {
  for (const target of FOCUS_TARGETS) {
    if (!errors[target.key]) {
      continue;
    }

    const elementId = target.getElementId(role);
    const element = document.getElementById(elementId);

    if (!element) {
      continue;
    }

    element.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'center',
    });

    if (typeof element.focus === 'function') {
      element.focus({ preventScroll: true });
    }

    return;
  }
}

export function getSchoolResultId(index: number): string {
  return `school-result-${index}`;
}
