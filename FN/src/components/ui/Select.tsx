import type { SelectHTMLAttributes } from 'react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

function selectClassName({
  error = false,
  className = '',
}: {
  error?: boolean;
  className?: string;
}) {
  return [
    'ui-control',
    'ui-select',
    error ? 'ui-control--error' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

export default function Select({ error = false, className, children, ...rest }: SelectProps) {
  return (
    <select className={selectClassName({ error, className })} {...rest}>
      {children}
    </select>
  );
}
