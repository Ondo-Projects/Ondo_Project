import { createContext, useContext, type ReactNode } from 'react';
import { useJoinFormState, type UseJoinFormResult } from './useJoinForm';

const JoinFormContext = createContext<UseJoinFormResult | null>(null);

interface JoinFormProviderProps {
  children: ReactNode;
}

export function JoinFormProvider({ children }: JoinFormProviderProps) {
  const value = useJoinFormState();

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
