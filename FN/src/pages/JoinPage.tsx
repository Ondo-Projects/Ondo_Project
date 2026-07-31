import { JoinFormProvider } from '../join/JoinFormProvider';
import JoinForm from '../join/JoinForm';

export default function JoinPage() {
  return (
    <JoinFormProvider>
      <JoinForm />
    </JoinFormProvider>
  );
}
