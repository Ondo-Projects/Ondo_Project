import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode;
  helper?: ReactNode;
  titleMark?: boolean;
  compact?: boolean;
  interactive?: boolean;
  children: ReactNode;
}

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  mark?: boolean;
  children: ReactNode;
}

export interface CardHelperProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

function cardClassName({
  compact = false,
  interactive = false,
  className = '',
}: Pick<CardProps, 'compact' | 'interactive' | 'className'>) {
  return [
    'ui-card',
    compact ? 'ui-card--compact' : '',
    interactive ? 'ui-card--interactive' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

export function CardTitle({ mark = false, className, children, ...rest }: CardTitleProps) {
  return (
    <h2
      className={[
        'ui-card__title',
        mark ? 'ui-card__title--marked' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {mark ? <span className="ui-card__title-mark" aria-hidden="true" /> : null}
      {children}
    </h2>
  );
}

export function CardHelper({ className, children, ...rest }: CardHelperProps) {
  return (
    <p className={['ui-card__helper', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </p>
  );
}

export default function Card({
  title,
  helper,
  titleMark = false,
  compact = false,
  interactive = false,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <section className={cardClassName({ compact, interactive, className })} {...rest}>
      {title ? <CardTitle mark={titleMark}>{title}</CardTitle> : null}
      {helper ? <CardHelper>{helper}</CardHelper> : null}
      <div className="ui-card__body">{children}</div>
    </section>
  );
}
