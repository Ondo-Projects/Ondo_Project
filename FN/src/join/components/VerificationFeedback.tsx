import { Alert } from '../../components/ui';

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
    return <Alert variant="success">{successMessage}</Alert>;
  }

  if (errorMessage) {
    return <Alert variant="error">{errorMessage}</Alert>;
  }

  return null;
}
