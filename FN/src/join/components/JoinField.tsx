import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';

interface FormControlProps {
  id?: string;
  className?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

interface JoinFieldProps {
  id: string;
  label: string;
  helper?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

function enhanceControl(
  child: ReactElement<FormControlProps>,
  id: string,
  describedBy: string | undefined,
  hasError: boolean,
): ReactElement<FormControlProps> {
  const isSelect = child.type === 'select';
  const baseClass = isSelect ? 'join-field__select' : 'join-field__input';

  return cloneElement(child, {
    id: child.props.id ?? id,
    'aria-invalid': hasError ? true : undefined,
    'aria-describedby': describedBy,
    className: [baseClass, child.props.className, hasError ? 'join-field__input--error' : '']
      .filter(Boolean)
      .join(' '),
  });
}

export default function JoinField({
  id,
  label,
  helper,
  error,
  required = false,
  children,
}: JoinFieldProps) {
  const errorId = error ? `${id}-error` : undefined;
  const helperId = helper ? `${id}-helper` : undefined;
  const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;
  const labelText = required ? `${label} (필수)` : label;

  let control = children;
  if (isValidElement<FormControlProps>(children)) {
    control = enhanceControl(children, id, describedBy, Boolean(error));
  }

  return (
    <div className="join-field">
      <label className="join-field__label" htmlFor={id}>
        {labelText}
      </label>
      {control}
      {helper ? (
        <p className="join-field__helper" id={helperId}>
          {helper}
        </p>
      ) : null}
      {error ? (
        <p className="join-field__error" id={errorId} role="alert">
          <span className="join-field__error-icon" aria-hidden="true">
            !
          </span>
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
