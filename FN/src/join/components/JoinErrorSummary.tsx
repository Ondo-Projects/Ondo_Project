import type { JoinFieldErrors } from '../joinValidation';
import { getJoinErrorSummary } from '../joinA11y';

interface JoinErrorSummaryProps {
  errors: JoinFieldErrors;
  visible: boolean;
}

export default function JoinErrorSummary({ errors, visible }: JoinErrorSummaryProps) {
  const message = getJoinErrorSummary(errors);

  if (!visible || !message) {
    return null;
  }

  return (
    <div className="join-error-summary" role="alert" aria-live="polite">
      <span className="join-error-summary__icon" aria-hidden="true">
        !
      </span>
      <p className="join-error-summary__text">{message}</p>
    </div>
  );
}
