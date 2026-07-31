import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';

interface FieldControlProps {
  id?: string;
  className?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

export interface FieldProps {
  id: string;
  label: string;
  helper?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

function enhanceControl(
  child: ReactElement<FieldControlProps>,
  id: string,
  describedBy: string | undefined,
  hasError: boolean,
): ReactElement<FieldControlProps> {
  return cloneElement(child, {
    id: child.props.id ?? id,
    'aria-invalid': hasError ? true : undefined,
    'aria-describedby': describedBy,
    className: [child.props.className, hasError ? 'ui-control--error' : '']
      .filter(Boolean)
      .join(' '),
  });
}

export default function Field({
  id,
  label,
  helper,
  error,
  required = false,
  className,
  children,
}: FieldProps) {
  const errorId = error ? `${id}-error` : undefined;
  const helperId = helper ? `${id}-helper` : undefined;
  const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;
  const labelText = required ? `${label} (필수)` : label;

  let control = children;
  if (isValidElement<FieldControlProps>(children)) {
    control = enhanceControl(children, id, describedBy, Boolean(error));
  }

  return (
    <div className={['ui-field', className].filter(Boolean).join(' ')}>
      <label className="ui-field__label" htmlFor={id}>
        {labelText}
      </label>
      {control}
      {helper ? (
        <p className="ui-field__helper" id={helperId}>
          {helper}
        </p>
      ) : null}
      {error ? (
        <p className="ui-field__error" id={errorId} role="alert">
          <span className="ui-field__error-icon" aria-hidden="true">
            !
          </span>
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
