import type { ReactNode } from 'react';

interface JoinFieldProps {
  id: string;
  label: string;
  helper?: string;
  error?: string;
  children: ReactNode;
}

export default function JoinField({ id, label, helper, error, children }: JoinFieldProps) {
  const errorId = error ? `${id}-error` : undefined;
  const helperId = helper ? `${id}-helper` : undefined;
  const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="join-field">
      <label className="join-field__label" htmlFor={id}>
        {label}
      </label>
      <div aria-describedby={describedBy}>{children}</div>
      {helper ? (
        <p className="join-field__helper" id={helperId}>
          {helper}
        </p>
      ) : null}
      {error ? (
        <p className="join-field__error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
