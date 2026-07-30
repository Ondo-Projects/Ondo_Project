import './brand.css';

const ONDO_LOGO_SRC = '/ondo-logo.png';

type BrandMarkSize = 'default' | 'auth';

interface BrandMarkProps {
  size?: BrandMarkSize;
}

export default function BrandMark({ size = 'default' }: BrandMarkProps) {
  const wrapClassName =
    size === 'auth' ? 'brand-mark-wrap brand-mark-wrap--auth' : 'brand-mark-wrap';

  return (
    <span className={wrapClassName} aria-hidden="true">
      <img
        className="brand-mark"
        src={ONDO_LOGO_SRC}
        alt=""
        width={120}
        height={120}
        decoding="async"
      />
    </span>
  );
}
