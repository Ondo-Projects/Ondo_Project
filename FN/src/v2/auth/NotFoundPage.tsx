import { Link } from 'react-router-dom';
import { usePageTitle } from '../../hooks/usePageTitle';
import { PATHS } from '../../routes/paths';
import { AuthShell } from './AuthShell';

export default function NotFoundPage() {
  usePageTitle('페이지를 찾을 수 없어요 | 온도');
  return (
    <AuthShell
      title="페이지를 찾을 수 없어요"
      description="주소가 바뀌었거나 없는 페이지예요. 주소를 다시 확인해 주세요."
    >
      <Link
        to={PATHS.ROOT}
        className="inline-flex h-10 items-center rounded-md bg-blue-700 px-4 text-sm font-medium text-white hover:bg-blue-800"
      >
        처음 화면으로
      </Link>
    </AuthShell>
  );
}
