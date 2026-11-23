import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from './cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** 왼쪽 아이콘 (lucide-react, 16px 권장) */
  icon?: ReactNode;
  loading?: boolean;
}

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-blue-700 text-white border border-blue-700 hover:bg-blue-800 hover:border-blue-800',
  secondary: 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50',
  ghost: 'bg-transparent text-gray-700 border border-transparent hover:bg-gray-100',
  danger: 'bg-white text-red-700 border border-gray-200 hover:bg-red-50 hover:border-red-200',
};

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-8 px-2.5 gap-1.5 text-[13px]',
  md: 'h-9 px-3.5 gap-2 text-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', icon, loading = false, disabled, className, children, type, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md font-medium whitespace-nowrap',
        'transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50',
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 size={16} className="animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
});
