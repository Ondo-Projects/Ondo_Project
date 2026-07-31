import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

export type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type BtnSize = 'default' | 'student';

type BtnCommonProps = {
  variant?: BtnVariant;
  size?: BtnSize;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
};

export type BtnProps =
  | (BtnCommonProps & { to: string } & Omit<LinkProps, 'className' | 'children' | 'to'>)
  | (BtnCommonProps & { to?: undefined } & ButtonHTMLAttributes<HTMLButtonElement>);

function btnClassName({
  variant = 'primary',
  size = 'default',
  fullWidth = false,
  className = '',
}: Pick<BtnCommonProps, 'variant' | 'size' | 'fullWidth' | 'className'>) {
  return [
    'ui-btn',
    `ui-btn--${variant}`,
    size === 'student' ? 'ui-btn--student' : '',
    fullWidth ? 'ui-btn--full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

export default function Btn(props: BtnProps) {
  const {
    variant = 'primary',
    size = 'default',
    fullWidth = false,
    className,
    children,
  } = props;
  const classes = btnClassName({ variant, size, fullWidth, className });

  if ('to' in props && props.to) {
    const { to, variant: _v, size: _s, fullWidth: _f, className: _c, children: _ch, ...linkRest } =
      props;
    return (
      <Link className={classes} to={to} {...linkRest}>
        {children}
      </Link>
    );
  }

  const {
    variant: _variant,
    size: _size,
    fullWidth: _fullWidth,
    className: _className,
    children: _children,
    type = 'button',
    ...buttonRest
  } = props as BtnCommonProps & ButtonHTMLAttributes<HTMLButtonElement>;

  return (
    <button type={type} className={classes} {...buttonRest}>
      {children}
    </button>
  );
}
