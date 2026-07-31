import { useEffect, useState, type ChangeEvent, type TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  showCount?: boolean;
}

function textareaClassName({
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
    'ui-textarea',
    error ? 'ui-control--error' : '',
    readOnly ? 'ui-control--readonly' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

function getTextLength(value: TextareaProps['value'], defaultValue: TextareaProps['defaultValue']) {
  if (typeof value === 'string') {
    return value.length;
  }
  if (typeof defaultValue === 'string') {
    return defaultValue.length;
  }
  return 0;
}

export default function Textarea({
  error = false,
  readOnly = false,
  className,
  rows = 4,
  showCount = false,
  maxLength,
  value,
  defaultValue,
  onChange,
  id,
  ...rest
}: TextareaProps) {
  const classes = textareaClassName({ error, readOnly, className });
  const [count, setCount] = useState(() => getTextLength(value, defaultValue));

  useEffect(() => {
    setCount(getTextLength(value, defaultValue));
  }, [value, defaultValue]);

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    if (showCount && maxLength != null) {
      setCount(event.target.value.length);
    }
    onChange?.(event);
  }

  const textarea = (
    <textarea
      id={id}
      className={classes}
      rows={rows}
      readOnly={readOnly}
      maxLength={maxLength}
      value={value}
      defaultValue={defaultValue}
      onChange={handleChange}
      {...rest}
    />
  );

  if (!showCount || maxLength == null) {
    return textarea;
  }

  return (
    <div className="ui-textarea-wrap">
      {textarea}
      <p className="ui-textarea__count" aria-live="polite">
        {count}/{maxLength}
      </p>
    </div>
  );
}
