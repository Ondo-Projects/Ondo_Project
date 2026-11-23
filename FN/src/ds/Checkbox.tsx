import { type ReactNode, useId } from 'react';
import { cn } from './cn';

/** 체크박스 + 글 (약관 동의 등). 오류가 있으면 아래에 빨간 글씨 */
export function Checkbox({
  id,
  checked,
  onChange,
  disabled,
  error,
  className,
  children,
}: {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  error?: string | null;
  className?: string;
  children: ReactNode;
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;
  return (
    <div className={className}>
      <label
        htmlFor={inputId}
        className={cn(
          'flex cursor-pointer items-start gap-2.5 text-[13px] leading-snug text-gray-900',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="mt-px h-4 w-4 shrink-0 rounded border-gray-300 accent-blue-700"
        />
        <span>{children}</span>
      </label>
      {error ? (
        <p id={errorId} className="mt-1 pl-6.5 text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
