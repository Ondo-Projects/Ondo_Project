import '../../ds/ds.css';

interface AuthLoadingProps {
  message?: string;
}

/** 로그인 확인·화면 준비 중 — 가운데 작은 회전 표시 */
export default function AuthLoading({ message = '불러오는 중…' }: AuthLoadingProps) {
  return (
    <div
      className="ondo-ui flex min-h-screen items-center justify-center bg-gray-50/50"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-3">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-blue-700" aria-hidden />
        <span className="text-[13px] text-gray-500">{message}</span>
      </div>
    </div>
  );
}
