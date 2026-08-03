import type { GuardianRelation, School, SignUpRequest, SignUpRole } from '../api/types/signup';
import { isUnder14, parseBirthDate } from './agePolicy';
import { isAllowedTeacherEmailDomain } from './teacherEmailDomains';

export type JoinFieldKey =
  | 'role'
  | 'school'
  | 'name'
  | 'birthDate'
  | 'username'
  | 'password'
  | 'passwordConfirm'
  | 'email'
  | 'guardianName'
  | 'guardianPhone'
  | 'guardianRelation'
  | 'agreeService'
  | 'agreePrivacy'
  | 'agreeSensitive'
  | 'agreeGuardianChildPrivacy'
  | 'agreeGuardianChildSensitive'
  | 'agreeGuardianIdentity'
  | 'emailVerification'
  | 'smsVerification';

export type JoinFieldErrors = Partial<Record<JoinFieldKey, string>>;

export interface JoinFormState {
  role: SignUpRole;
  selectedSchool: School | null;
  name: string;
  birthDate: string;
  username: string;
  password: string;
  passwordConfirm: string;
  email: string;
  guardianName: string;
  guardianPhone: string;
  guardianRelation: GuardianRelation | '';
  agreeService: boolean;
  agreePrivacy: boolean;
  agreeSensitive: boolean;
  agreeGuardianChildPrivacy: boolean;
  agreeGuardianChildSensitive: boolean;
  agreeGuardianIdentity: boolean;
  emailVerified: boolean;
  smsVerified: boolean;
  usernameChecked: boolean;
  usernameAvailable: boolean | null;
}

export interface JoinValidationResult {
  valid: boolean;
  errors: JoinFieldErrors;
}

const LETTER_PATTERN = /[A-Za-z]/;
const DIGIT_PATTERN = /[0-9]/;
const SPECIAL_PATTERN = /[!@#$%^&*(),.?":{}|[\]\-_=+;'/`~\\]/;

export function createInitialJoinFormState(role: SignUpRole = 'STUDENT'): JoinFormState {
  return {
    role,
    selectedSchool: null,
    name: '',
    birthDate: '',
    username: '',
    password: '',
    passwordConfirm: '',
    email: '',
    guardianName: '',
    guardianPhone: '',
    guardianRelation: '',
    agreeService: false,
    agreePrivacy: false,
    agreeSensitive: false,
    agreeGuardianChildPrivacy: false,
    agreeGuardianChildSensitive: false,
    agreeGuardianIdentity: false,
    emailVerified: false,
    smsVerified: false,
    usernameChecked: false,
    usernameAvailable: null,
  };
}

export function createRoleSpecificReset(): Partial<JoinFormState> {
  return {
    birthDate: '',
    email: '',
    guardianName: '',
    guardianPhone: '',
    guardianRelation: '',
    agreeGuardianChildPrivacy: false,
    agreeGuardianChildSensitive: false,
    agreeGuardianIdentity: false,
    emailVerified: false,
    smsVerified: false,
  };
}

export function validatePassword(password: string, username: string): string | null {
  if (!password.trim()) {
    return '비밀번호를 입력해 주세요.';
  }
  if (password.length < 8 || password.length > 100) {
    return '비밀번호는 8자 이상 100자 이하로 입력해 주세요.';
  }
  if (password.includes(' ')) {
    return '비밀번호에 공백은 사용할 수 없어요.';
  }
  if (!LETTER_PATTERN.test(password)) {
    return '비밀번호에 영문자를 1자 이상 넣어 주세요.';
  }
  if (!DIGIT_PATTERN.test(password)) {
    return '비밀번호에 숫자를 1자 이상 넣어 주세요.';
  }
  if (!SPECIAL_PATTERN.test(password)) {
    return '비밀번호에 특수문자를 1자 이상 넣어 주세요.';
  }
  if (username.trim() && password.toLowerCase() === username.trim().toLowerCase()) {
    return '비밀번호는 아이디와 같게 설정할 수 없어요.';
  }
  return null;
}

export function validateTeacherEmail(email: string): string | null {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return '교사 이메일을 입력해 주세요.';
  }

  const atIndex = normalized.lastIndexOf('@');
  if (atIndex <= 0 || atIndex === normalized.length - 1) {
    return '이메일 아이디(@ 앞)와 교육청 도메인을 입력해 주세요.';
  }

  const localPart = normalized.slice(0, atIndex);
  const domain = normalized.slice(atIndex + 1);

  if (!/^[a-z0-9+_.-]+$/.test(localPart)) {
    return '이메일 아이디는 영문, 숫자, . _ - 만 사용할 수 있어요.';
  }

  if (!isAllowedTeacherEmailDomain(domain)) {
    return '시·도교육청 공직 메일 도메인을 선택해 주세요.';
  }

  return null;
}

export function validateStudentEmail(email: string): string | null {
  if (!email.trim()) {
    return '학생 이메일을 입력해 주세요.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return '올바른 이메일 형식인지 확인해 주세요.';
  }
  return null;
}

export function validateJoinForm(state: JoinFormState): JoinValidationResult {
  const errors: JoinFieldErrors = {};

  if (!state.selectedSchool) {
    errors.school = '학교를 선택해 주세요.';
  }

  if (!state.name.trim()) {
    errors.name = state.role === 'TEACHER' ? '교사 성명을 입력해 주세요.' : '성명을 입력해 주세요.';
  }

  const username = state.username.trim();
  if (username.length < 4 || username.length > 50) {
    errors.username = '아이디는 4~50자로 입력해 주세요.';
  } else if (state.usernameAvailable === false) {
    errors.username = '이미 사용 중인 아이디예요. 다른 아이디를 입력해 주세요.';
  }

  const passwordError = validatePassword(state.password, username);
  if (passwordError) {
    errors.password = passwordError;
  }

  if (state.password !== state.passwordConfirm) {
    errors.passwordConfirm = '비밀번호 확인이 일치하지 않아요.';
  }

  if (!state.agreeService) {
    errors.agreeService = '서비스 이용약관에 동의해 주세요.';
  }
  if (!state.agreePrivacy) {
    errors.agreePrivacy = '개인정보 수집 및 이용에 동의해 주세요.';
  }
  if (!state.agreeSensitive) {
    errors.agreeSensitive = '민감정보 관련 필수 약관에 동의해 주세요.';
  }

  if (state.role === 'STUDENT') {
    if (!state.birthDate.trim()) {
      errors.birthDate = '생년월일을 입력해 주세요.';
    } else if (!parseBirthDate(state.birthDate)) {
      errors.birthDate = '올바른 생년월일인지 확인해 주세요.';
    }

    const studentEmailError = validateStudentEmail(state.email);
    if (studentEmailError) {
      errors.email = studentEmailError;
    } else if (!state.emailVerified) {
      errors.emailVerification = '이메일 인증을 완료해 주세요.';
    }

    if (state.birthDate && parseBirthDate(state.birthDate) && isUnder14(state.birthDate)) {
      if (!state.guardianName.trim()) {
        errors.guardianName = '법정대리인 성명을 입력해 주세요.';
      }
      if (!state.guardianPhone.trim()) {
        errors.guardianPhone = '법정대리인 휴대전화번호를 입력해 주세요.';
      }
      if (!state.guardianRelation) {
        errors.guardianRelation = '법정대리인과의 관계를 선택해 주세요.';
      }
      if (!state.agreeGuardianChildPrivacy) {
        errors.agreeGuardianChildPrivacy = '아동 개인정보 수집·이용에 동의해 주세요.';
      }
      if (!state.agreeGuardianChildSensitive) {
        errors.agreeGuardianChildSensitive = '아동 민감정보 수집·이용에 동의해 주세요.';
      }
      if (!state.agreeGuardianIdentity) {
        errors.agreeGuardianIdentity = '법정대리인 본인 확인 및 개인정보 수집에 동의해 주세요.';
      }
      if (!state.smsVerified) {
        errors.smsVerification = '법정대리인 SMS 인증을 완료해 주세요.';
      }
    }
  }

  if (state.role === 'TEACHER') {
    const teacherEmailError = validateTeacherEmail(state.email);
    if (teacherEmailError) {
      errors.email = teacherEmailError;
    } else if (!state.emailVerified) {
      errors.emailVerification = '이메일 인증을 완료해 주세요.';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function buildSignUpRequest(state: JoinFormState): SignUpRequest {
  const under14 = state.role === 'STUDENT' && isUnder14(state.birthDate);

  return {
    role: state.role,
    schoolCode: state.selectedSchool!.schoolCode,
    name: state.name.trim(),
    username: state.username.trim(),
    password: state.password,
    passwordConfirm: state.passwordConfirm,
    email: state.email.trim(),
    birthDate: state.role === 'STUDENT' ? state.birthDate.trim() : undefined,
    guardianName: under14 ? state.guardianName.trim() : undefined,
    guardianPhone: under14 ? state.guardianPhone.trim() : undefined,
    guardianRelation: under14 && state.guardianRelation ? state.guardianRelation : undefined,
    agreeGuardianChildPrivacy: under14 ? state.agreeGuardianChildPrivacy : false,
    agreeGuardianChildSensitive: under14 ? state.agreeGuardianChildSensitive : false,
    agreeGuardianIdentity: under14 ? state.agreeGuardianIdentity : false,
    agreeService: state.agreeService,
    agreePrivacy: state.agreePrivacy,
    agreeSensitive: state.agreeSensitive,
  };
}
