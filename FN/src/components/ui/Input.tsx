import type { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

function inputClassName({
  error = false,
  readOnly = false,
  className = '',
}: {
  error?: boolean;
  readOnly?: boolean;
  className?: string;
}) {
  return [
    'ui-control',
    'ui-input',
    error ? 'ui-control--error' : '',
    readOnly ? 'ui-control--readonly' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

export default function Input({
  error = false,
  readOnly = false,
  className,
  ...rest
}: InputProps) {
  return (
    <input
      className={inputClassName({ error, readOnly, className })}
      readOnly={readOnly}
      {...rest}
    />
  );
}
