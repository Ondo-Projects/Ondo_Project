import { createContext, useContext, type ReactNode } from 'react';
import type { SignUpRole } from '../api/types/signup';
import { useJoinFormState, type UseJoinFormResult } from './useJoinForm';

const JoinFormContext = createContext<UseJoinFormResult | null>(null);

interface JoinFormProviderProps {
  children: ReactNode;
  /** 처음 선택된 가입 유형 (랜딩의 "교사로 시작하기" 등에서 ?role= 로 전달) */
  initialRole?: SignUpRole;
}

export function JoinFormProvider({ children, initialRole }: JoinFormProviderProps) {
  const value = useJoinFormState(initialRole);

  return <JoinFormContext.Provider value={value}>{children}</JoinFormContext.Provider>;
}

export function useJoinForm(): UseJoinFormResult {
  const context = useContext(JoinFormContext);

  if (!context) {
    throw new Error('useJoinForm must be used within JoinFormProvider');
  }

  return context;
}

export type { UseJoinFormResult, JoinFormActions, JoinFormComputed } from './useJoinForm';
export type { JoinFormState, JoinFieldErrors, JoinFieldKey } from './joinValidation';
