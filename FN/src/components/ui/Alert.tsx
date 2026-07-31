import type { HTMLAttributes, ReactNode } from 'react';

export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}

const ALERT_VARIANT_CLASS: Record<AlertVariant, string> = {
  success: 'ui-alert--success',
  error: 'ui-alert--error',
  warning: 'ui-alert--warning',
  info: 'ui-alert--info',
};

const DEFAULT_ALERT_ICON: Record<AlertVariant, string> = {
  success: '✓',
  error: '!',
  warning: '!',
  info: 'i',
};

function alertRole(variant: AlertVariant): 'alert' | 'status' {
  return variant === 'error' || variant === 'warning' ? 'alert' : 'status';
}

function alertClassName({
  variant = 'info',
  className = '',
}: Pick<AlertProps, 'variant' | 'className'>) {
  return ['ui-alert', ALERT_VARIANT_CLASS[variant], className].filter(Boolean).join(' ');
}

export default function Alert({
  variant = 'info',
  icon,
  action,
  className,
  children,
  role,
  ...rest
}: AlertProps) {
  const resolvedRole = role ?? alertRole(variant);
  const resolvedIcon = icon ?? DEFAULT_ALERT_ICON[variant];

  return (
    <div className={alertClassName({ variant, className })} role={resolvedRole} {...rest}>
      <div className="ui-alert__content">
        <span className="ui-alert__icon" aria-hidden="true">
          {resolvedIcon}
        </span>
        <div className="ui-alert__body">{children}</div>
      </div>
      {action ? <div className="ui-alert__action">{action}</div> : null}
    </div>
  );
}
