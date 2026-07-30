import {
  useCallback,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { checkUsername } from '../api/username.api';
import { signUp } from '../api/signup.api';
import type { GuardianRelation, SignUpResponse, SignUpRole } from '../api/types/signup';
import type { School } from '../api/types/signup';
import { isUnder14 } from './agePolicy';
import { mapSignupError } from './joinErrors';
import {
  buildSignUpRequest,
  createInitialJoinFormState,
  createRoleSpecificReset,
  validateJoinForm,
  type JoinFieldErrors,
  type JoinFormState,
  type JoinValidationResult,
} from './joinValidation';

export interface JoinFormComputed {
  isUnder14: boolean;
  requiresGuardian: boolean;
  canShowGuardianSection: boolean;
}

export interface JoinFormActions {
  setRole: (role: SignUpRole) => void;
  setSelectedSchool: (school: School | null) => void;
  setName: (name: string) => void;
  setBirthDate: (birthDate: string) => void;
  setUsername: (username: string) => void;
  setPassword: (password: string) => void;
  setPasswordConfirm: (passwordConfirm: string) => void;
  setEmail: (email: string) => void;
  setGuardianName: (guardianName: string) => void;
  setGuardianPhone: (guardianPhone: string) => void;
  setGuardianRelation: (guardianRelation: GuardianRelation | '') => void;
  setAgreeService: (value: boolean) => void;
  setAgreePrivacy: (value: boolean) => void;
  setAgreeSensitive: (value: boolean) => void;
  setAgreeGuardianChildPrivacy: (value: boolean) => void;
  setAgreeGuardianChildSensitive: (value: boolean) => void;
  setAgreeGuardianIdentity: (value: boolean) => void;
  setEmailVerified: (verified: boolean) => void;
  setSmsVerified: (verified: boolean) => void;
  resetUsernameCheck: () => void;
  clearFieldErrors: () => void;
  clearSubmitError: () => void;
  validateClient: () => JoinValidationResult;
  runUsernameCheck: () => Promise<boolean>;
  submitSignup: () => Promise<SignUpResponse>;
  patchState: Dispatch<SetStateAction<JoinFormState>>;
}

export interface UseJoinFormResult {
  state: JoinFormState;
  fieldErrors: JoinFieldErrors;
  submitError: string | null;
  isSubmitting: boolean;
  isCheckingUsername: boolean;
  computed: JoinFormComputed;
  actions: JoinFormActions;
}

function mergeFieldErrors(
  current: JoinFieldErrors,
  next: JoinFieldErrors,
): JoinFieldErrors {
  return { ...current, ...next };
}

export function useJoinFormState(): UseJoinFormResult {
  const [state, setState] = useState<JoinFormState>(() => createInitialJoinFormState());
  const [fieldErrors, setFieldErrors] = useState<JoinFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  const computed = useMemo<JoinFormComputed>(() => {
    const under14 = state.role === 'STUDENT' && isUnder14(state.birthDate);

    return {
      isUnder14: under14,
      requiresGuardian: under14,
      canShowGuardianSection: under14,
    };
  }, [state.role, state.birthDate]);

  const setRole = useCallback((role: SignUpRole) => {
    setState((prev) => ({
      ...prev,
      role,
      ...createRoleSpecificReset(),
      usernameChecked: false,
      usernameAvailable: null,
    }));
    setFieldErrors({});
    setSubmitError(null);
  }, []);

  const setSelectedSchool = useCallback((school: School | null) => {
    setState((prev) => ({ ...prev, selectedSchool: school }));
    setFieldErrors((prev) => ({ ...prev, school: undefined }));
  }, []);

  const setEmail = useCallback((email: string) => {
    setState((prev) => ({
      ...prev,
      email,
      emailVerified: false,
    }));
    setFieldErrors((prev) => ({
      ...prev,
      email: undefined,
      emailVerification: undefined,
    }));
  }, []);

  const setBirthDate = useCallback((birthDate: string) => {
    setState((prev) => ({
      ...prev,
      birthDate,
      smsVerified: false,
      guardianName: '',
      guardianPhone: '',
      guardianRelation: '',
      agreeGuardianChildPrivacy: false,
      agreeGuardianChildSensitive: false,
      agreeGuardianIdentity: false,
    }));
    setFieldErrors((prev) => ({
      ...prev,
      birthDate: undefined,
      smsVerification: undefined,
      guardianName: undefined,
      guardianPhone: undefined,
      guardianRelation: undefined,
      agreeGuardianChildPrivacy: undefined,
      agreeGuardianChildSensitive: undefined,
      agreeGuardianIdentity: undefined,
    }));
  }, []);

  const setUsername = useCallback((username: string) => {
    setState((prev) => ({
      ...prev,
      username,
      usernameChecked: false,
      usernameAvailable: null,
    }));
    setFieldErrors((prev) => ({ ...prev, username: undefined }));
  }, []);

  const resetUsernameCheck = useCallback(() => {
    setState((prev) => ({
      ...prev,
      usernameChecked: false,
      usernameAvailable: null,
    }));
  }, []);

  const validateClient = useCallback((): JoinValidationResult => {
    const result = validateJoinForm(state);
    setFieldErrors(result.errors);
    return result;
  }, [state]);

  const runUsernameCheck = useCallback(async () => {
    const username = state.username.trim();
    if (username.length < 4) {
      setFieldErrors((prev) =>
        mergeFieldErrors(prev, { username: '아이디는 4~50자로 입력해 주세요.' }),
      );
      return false;
    }

    setIsCheckingUsername(true);
    try {
      const response = await checkUsername(username);
      setState((prev) => ({
        ...prev,
        usernameChecked: true,
        usernameAvailable: response.available,
      }));
      setFieldErrors((prev) =>
        mergeFieldErrors(prev, {
          username: response.available ? undefined : response.message,
        }),
      );
      return response.available;
    } catch (error) {
      setFieldErrors((prev) =>
        mergeFieldErrors(prev, {
          username: mapSignupError(error),
        }),
      );
      return false;
    } finally {
      setIsCheckingUsername(false);
    }
  }, [state.username]);

  const submitSignup = useCallback(async () => {
    setSubmitError(null);

    const validation = validateJoinForm(state);
    setFieldErrors(validation.errors);
    if (!validation.valid) {
      throw new Error('validation_failed');
    }

    if (!state.usernameChecked || state.usernameAvailable !== true) {
      const available = await runUsernameCheck();
      if (!available) {
        throw new Error('username_unavailable');
      }
    }

    setIsSubmitting(true);
    try {
      const response = await signUp(buildSignUpRequest(state));
      return response;
    } catch (error) {
      const message = mapSignupError(error);
      setSubmitError(message);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [state, runUsernameCheck]);

  const patchField = useCallback(
    <K extends keyof JoinFormState>(key: K, value: JoinFormState[K]) => {
      setState((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const actions = useMemo<JoinFormActions>(
    () => ({
      setRole,
      setSelectedSchool,
      setName: (name) => {
        patchField('name', name);
        setFieldErrors((prev) => ({ ...prev, name: undefined }));
      },
      setBirthDate,
      setUsername,
      setPassword: (password) => {
        patchField('password', password);
        setFieldErrors((prev) => ({ ...prev, password: undefined, passwordConfirm: undefined }));
      },
      setPasswordConfirm: (passwordConfirm) => {
        patchField('passwordConfirm', passwordConfirm);
        setFieldErrors((prev) => ({ ...prev, passwordConfirm: undefined }));
      },
      setEmail,
      setGuardianName: (guardianName) => {
        patchField('guardianName', guardianName);
        setFieldErrors((prev) => ({ ...prev, guardianName: undefined }));
      },
      setGuardianPhone: (guardianPhone) => {
        patchField('guardianPhone', guardianPhone);
        setFieldErrors((prev) => ({ ...prev, guardianPhone: undefined }));
        setState((prev) => ({ ...prev, smsVerified: false }));
      },
      setGuardianRelation: (guardianRelation) => {
        patchField('guardianRelation', guardianRelation);
        setFieldErrors((prev) => ({ ...prev, guardianRelation: undefined }));
      },
      setAgreeService: (value) => {
        patchField('agreeService', value);
        setFieldErrors((prev) => ({ ...prev, agreeService: undefined }));
      },
      setAgreePrivacy: (value) => {
        patchField('agreePrivacy', value);
        setFieldErrors((prev) => ({ ...prev, agreePrivacy: undefined }));
      },
      setAgreeSensitive: (value) => {
        patchField('agreeSensitive', value);
        setFieldErrors((prev) => ({ ...prev, agreeSensitive: undefined }));
      },
      setAgreeGuardianChildPrivacy: (value) => {
        patchField('agreeGuardianChildPrivacy', value);
        setFieldErrors((prev) => ({ ...prev, agreeGuardianChildPrivacy: undefined }));
      },
      setAgreeGuardianChildSensitive: (value) => {
        patchField('agreeGuardianChildSensitive', value);
        setFieldErrors((prev) => ({ ...prev, agreeGuardianChildSensitive: undefined }));
      },
      setAgreeGuardianIdentity: (value) => {
        patchField('agreeGuardianIdentity', value);
        setFieldErrors((prev) => ({ ...prev, agreeGuardianIdentity: undefined }));
      },
      setEmailVerified: (verified) => {
        patchField('emailVerified', verified);
        setFieldErrors((prev) => ({ ...prev, emailVerification: undefined }));
      },
      setSmsVerified: (verified) => {
        patchField('smsVerified', verified);
        setFieldErrors((prev) => ({ ...prev, smsVerification: undefined }));
      },
      resetUsernameCheck,
      clearFieldErrors: () => setFieldErrors({}),
      clearSubmitError: () => setSubmitError(null),
      validateClient,
      runUsernameCheck,
      submitSignup,
      patchState: setState,
    }),
    [
      patchField,
      runUsernameCheck,
      setBirthDate,
      setEmail,
      setRole,
      setSelectedSchool,
      setUsername,
      submitSignup,
      validateClient,
      resetUsernameCheck,
    ],
  );

  return {
    state,
    fieldErrors,
    submitError,
    isSubmitting,
    isCheckingUsername,
    computed,
    actions,
  };
}
