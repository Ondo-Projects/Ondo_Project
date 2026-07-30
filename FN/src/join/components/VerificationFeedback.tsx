interface VerificationFeedbackProps {
  successMessage?: string | null;
  errorMessage?: string | null;
  showSuccess?: boolean;
}

export default function VerificationFeedback({
  successMessage,
  errorMessage,
  showSuccess = false,
}: VerificationFeedbackProps) {
  if (showSuccess && successMessage) {
    return (
      <p className="join-message join-message--success" role="status">
        <span className="join-message__icon" aria-hidden="true">
          ✓
        </span>
        <span>{successMessage}</span>
      </p>
    );
  }

  if (errorMessage) {
    return (
      <p className="join-message join-message--error" role="alert">
        <span className="join-message__icon" aria-hidden="true">
          !
        </span>
        <span>{errorMessage}</span>
      </p>
    );
  }

  return null;
}
