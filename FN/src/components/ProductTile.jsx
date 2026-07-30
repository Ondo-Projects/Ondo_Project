import './ProductTile.css';

const BADGE_VARIANTS = {
  student: 'product-tile__badge--student',
  teacher: 'product-tile__badge--teacher',
  admin: 'product-tile__badge--admin',
  pending: 'product-tile__badge--pending',
  inProgress: 'product-tile__badge--in-progress',
  completed: 'product-tile__badge--completed',
  default: 'product-tile__badge--default',
};

const SIZE_VARIANTS = {
  default: '',
  wide: 'product-tile--wide',
  tall: 'product-tile--tall',
  large: 'product-tile--large',
};

const DENSITY_VARIANTS = {
  default: '',
  compact: 'product-tile--compact',
};

function joinClassNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function ProductTileBadge({ badge }) {
  if (!badge?.label) {
    return null;
  }

  const variantClass = BADGE_VARIANTS[badge.variant] ?? BADGE_VARIANTS.default;

  return (
    <span className={joinClassNames('product-tile__badge', variantClass)}>
      {badge.icon ? <span aria-hidden="true">{badge.icon}</span> : null}
      <span>{badge.label}</span>
    </span>
  );
}

function ProductTileActions({ actions, onActionClick }) {
  if (!actions?.length) {
    return null;
  }

  return (
    <div className="product-tile__actions">
      {actions.map((action) => {
        const buttonClass = joinClassNames(
          'product-tile__btn',
          action.variant === 'secondary'
            ? 'product-tile__btn--secondary'
            : action.variant === 'ghost'
              ? 'product-tile__btn--ghost'
              : 'product-tile__btn--primary',
        );

        const handleClick = (event) => {
          event.stopPropagation();
          action.onClick?.(event);
          onActionClick?.(action, event);
        };

        if (action.href) {
          return (
            <a
              key={action.label}
              className={buttonClass}
              href={action.href}
              onClick={handleClick}
              aria-label={action.ariaLabel ?? action.label}
            >
              {action.label}
            </a>
          );
        }

        return (
          <button
            key={action.label}
            type="button"
            className={buttonClass}
            onClick={handleClick}
            aria-label={action.ariaLabel ?? action.label}
          >
            {action.label}
          </button>
        );
      })}
    </div>
  );
}

function ProductTileSkeleton({ size, density, className }) {
  return (
    <article
      className={joinClassNames(
        'product-tile',
        'product-tile--skeleton',
        SIZE_VARIANTS[size] ?? SIZE_VARIANTS.default,
        DENSITY_VARIANTS[density] ?? DENSITY_VARIANTS.default,
        className,
      )}
      aria-hidden="true"
    >
      <span className="product-tile__skeleton-line product-tile__skeleton-line--title" />
      <span className="product-tile__skeleton-line product-tile__skeleton-line--body" />
      <span className="product-tile__skeleton-line product-tile__skeleton-line--body-short" />
    </article>
  );
}

/**
 * Bento Grid용 기능/서비스 타일.
 * 2026 UI/UX 디자인 가이드 — 카드(5.2), 뱃지(5.5), 버튼(5.1), 스켈레톤(5.7) 기준.
 *
 * @param {Object} props
 * @param {string} props.title - 카드 제목 (h2, 20px)
 * @param {string} [props.description] - 본문 설명 (15px)
 * @param {string} [props.meta] - 보조 텍스트 (13px, 날짜·요약 등)
 * @param {React.ReactNode} [props.icon] - 아이콘 또는 이모지
 * @param {{ label: string, variant?: keyof typeof BADGE_VARIANTS, icon?: React.ReactNode }} [props.badge]
 * @param {Array<{ label: string, href?: string, onClick?: Function, variant?: 'primary'|'secondary'|'ghost', ariaLabel?: string }>} [props.actions]
 * @param {'default'|'wide'|'tall'|'large'} [props.size] - Bento span
 * @param {'default'|'compact'} [props.density] - 관리자·밀집 UI용
 * @param {boolean} [props.loading] - 스켈레톤 표시
 * @param {string} [props.href] - 타일 전체 링크
 * @param {Function} [props.onClick] - 타일 클릭
 * @param {Function} [props.onActionClick] - 액션 버튼 공통 핸들러
 * @param {React.ReactNode} [props.children] - 추가 콘텐츠
 * @param {string} [props.className]
 * @param {string} [props.ariaLabel]
 */
export default function ProductTile({
  title,
  description,
  meta,
  icon,
  badge,
  actions,
  size = 'default',
  density = 'default',
  loading = false,
  href,
  onClick,
  onActionClick,
  children,
  className,
  ariaLabel,
}) {
  if (loading) {
    return <ProductTileSkeleton size={size} density={density} className={className} />;
  }

  const isInteractive = Boolean(href || onClick);
  const tileClassName = joinClassNames(
    'product-tile',
    SIZE_VARIANTS[size] ?? SIZE_VARIANTS.default,
    DENSITY_VARIANTS[density] ?? DENSITY_VARIANTS.default,
    isInteractive && 'product-tile--interactive',
    className,
  );

  const content = (
    <>
      <div className="product-tile__header">
        <div className="product-tile__leading">
          {icon ? (
            <span className="product-tile__icon" aria-hidden="true">
              {icon}
            </span>
          ) : null}
          <div className="product-tile__text">
            <h2 className="product-tile__title">{title}</h2>
            {description ? <p className="product-tile__description">{description}</p> : null}
            {meta ? <p className="product-tile__meta">{meta}</p> : null}
          </div>
        </div>
        <ProductTileBadge badge={badge} />
      </div>

      {children ? <div className="product-tile__content">{children}</div> : null}

      <ProductTileActions actions={actions} onActionClick={onActionClick} />
    </>
  );

  if (href) {
    return (
      <a
        className={tileClassName}
        href={href}
        onClick={onClick}
        aria-label={ariaLabel ?? title}
      >
        {content}
      </a>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        className={joinClassNames(tileClassName, 'product-tile--button')}
        onClick={onClick}
        aria-label={ariaLabel ?? title}
      >
        {content}
      </button>
    );
  }

  return (
    <article className={tileClassName} aria-label={ariaLabel ?? title}>
      {content}
    </article>
  );
}

export { BADGE_VARIANTS, SIZE_VARIANTS };
