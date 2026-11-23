import { useId, type ReactElement, type ReactNode, cloneElement, isValidElement } from 'react';
import { cn } from './cn';

export interface FieldProps {
  label: string;
  /** 입력 아래 도움말 */
  hint?: ReactNode;
  /** 오류 메시지 — 있으면 hint 대신 표시하고 입력에 aria-invalid 를 붙임 */
  error?: string | null;
  required?: boolean;
  className?: string;
  /** Input / Select / Textarea 하나 */
  children: ReactElement<{ id?: string; invalid?: boolean; 'aria-describedby'?: string }>;
}

export function Field({ label, hint, error, required, className, children }: FieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const hasMessage = Boolean(error || hint);

  const control = isValidElement(children)
    ? cloneElement(children, {
        id: children.props.id ?? id,
        invalid: Boolean(error) || children.props.invalid,
        'aria-describedby': hasMessage ? messageId : undefined,
      })
    : children;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={children.props.id ?? id} className="text-[13px] font-medium text-gray-700">
        {label}
        {required ? <span className="ml-0.5 text-red-600" aria-hidden>*</span> : null}
      </label>
      {control}
      {hasMessage ? (
        <p id={messageId} className={cn('text-xs', error ? 'text-red-600' : 'text-gray-500')}>
          {error || hint}
        </p>
      ) : null}
    </div>
  );
}
