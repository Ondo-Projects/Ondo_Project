import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useId,
  useRef,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from 'react';
import { createPortal } from 'react-dom';

export type DrawerSize = 'default' | 'wide';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  size?: DrawerSize;
  children: ReactNode;
}

interface DrawerContextValue {
  onClose: () => void;
  titleId: string;
}

const DrawerContext = createContext<DrawerContextValue | null>(null);

function useDrawerContext() {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error('Drawer compound components must be used within Drawer.');
  }
  return context;
}

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => element.getAttribute('aria-hidden') !== 'true');
}

export function DrawerHeader({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={['ui-drawer__header', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </div>
  );
}

export function DrawerTitle({
  id,
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLHeadingElement>) {
  const { titleId } = useDrawerContext();
  return (
    <h2
      id={id ?? titleId}
      className={['ui-drawer__title', className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </h2>
  );
}

export function DrawerBody({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={['ui-drawer__body', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </div>
  );
}

export const DrawerClose = forwardRef(function DrawerClose(
  {
    className,
    children = '닫기',
    type = 'button',
    ...rest
  }: HTMLAttributes<HTMLButtonElement> & { type?: 'button' },
  ref: Ref<HTMLButtonElement>,
) {
  const { onClose } = useDrawerContext();

  return (
    <button
      ref={ref}
      type={type}
      className={['ui-drawer__close', className].filter(Boolean).join(' ')}
      data-drawer-autofocus="true"
      onClick={onClose}
      {...rest}
    >
      {children}
    </button>
  );
});

export default function Drawer({ isOpen, onClose, size = 'default', children }: DrawerProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    const autoFocusTarget =
      panel.querySelector<HTMLElement>('[data-drawer-autofocus="true"]') ??
      getFocusableElements(panel)[0];
    autoFocusTarget?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key === 'Tab' && panel) {
        const focusable = getFocusableElements(panel);
        if (focusable.length === 0) {
          event.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;

        if (event.shiftKey && active === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <DrawerContext.Provider value={{ onClose, titleId }}>
      <div
        className={['ui-drawer', size === 'wide' ? 'ui-drawer--wide' : ''].filter(Boolean).join(' ')}
        role="presentation"
      >
        <button
          type="button"
          className="ui-drawer__backdrop"
          aria-label="닫기"
          onClick={onClose}
        />

        <aside
          ref={panelRef}
          className="ui-drawer__panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          {children}
        </aside>
      </div>
    </DrawerContext.Provider>,
    document.body,
  );
}
