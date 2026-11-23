import { useSearchParams } from 'react-router-dom';
import type { SignUpRole } from '../api/types/signup';
import { JoinFormProvider } from '../join/JoinFormProvider';
import JoinForm from '../join/JoinForm';

function parseRole(value: string | null): SignUpRole | undefined {
  return value === 'TEACHER' || value === 'STUDENT' ? value : undefined;
}

export default function JoinPage() {
  const [searchParams] = useSearchParams();
  const initialRole = parseRole(searchParams.get('role'));

  return (
    <JoinFormProvider initialRole={initialRole}>
      <JoinForm />
    </JoinFormProvider>
  );
}
