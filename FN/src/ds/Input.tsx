import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from './cn';

const CONTROL =
  'w-full rounded-md border bg-white text-sm text-gray-900 placeholder:text-gray-400 ' +
  'transition-colors duration-150 outline-none focus:border-blue-600 ' +
  'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500';

function borderClass(invalid?: boolean) {
  return invalid ? 'border-red-300' : 'border-gray-200';
}

/** sm: 32px (표 위 검색·필터 줄) / md: 36px (폼). 너비는 감싸는 요소로 정합니다 */
export type ControlSize = 'sm' | 'md';
const HEIGHT: Record<ControlSize, string> = { sm: 'h-8 text-[13px]', md: 'h-9' };

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  invalid?: boolean;
  controlSize?: ControlSize;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, controlSize = 'md', className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(CONTROL, borderClass(invalid), HEIGHT[controlSize], 'px-3', className)}
      {...rest}
    />
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid, className, rows = 4, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(CONTROL, borderClass(invalid), 'px-3 py-2 leading-relaxed', className)}
      {...rest}
    />
  );
});

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  invalid?: boolean;
  controlSize?: ControlSize;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { invalid, controlSize = 'md', className, children, ...rest },
  ref,
) {
  return (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(CONTROL, borderClass(invalid), HEIGHT[controlSize], 'pl-3 pr-8', className)}
      {...rest}
    >
      {children}
    </select>
  );
});
