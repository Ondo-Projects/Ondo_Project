import { CircleCheck } from 'lucide-react';
import { Button, Input } from '../../ds';

/** 인증번호 받기 → 입력 → 확인 한 줄. 인증이 끝나면 완료 표시만 남깁니다 */
export function VerifyRow({
  codeId,
  code,
  onCodeChange,
  onSend,
  onVerify,
  sending,
  verifying,
  verified,
  sent,
  message,
  error,
  doneText,
}: {
  codeId: string;
  code: string;
  onCodeChange: (code: string) => void;
  onSend: () => void;
  onVerify: () => void;
  sending: boolean;
  verifying: boolean;
  verified: boolean;
  sent: boolean;
  /** 발송 안내 등 */
  message: string | null;
  /** 검증 오류 (폼 제출 시 오류 포함) */
  error?: string | null;
  doneText: string;
}) {
  if (verified) {
    return (
      <p className="flex items-center gap-1.5 text-[13px] font-medium text-emerald-700" role="status">
        <CircleCheck size={16} aria-hidden />
        {doneText}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <Button onClick={onSend} loading={sending} disabled={sending || verifying} className="shrink-0">
          {sent ? '다시 보내기' : '인증번호 받기'}
        </Button>
        <Input
          id={codeId}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="인증번호 6자리"
          aria-label="인증번호 6자리"
          value={code}
          invalid={Boolean(error)}
          onChange={(event) => onCodeChange(event.target.value.replace(/\D/g, ''))}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onVerify();
            }
          }}
        />
        <Button
          variant="primary"
          onClick={onVerify}
          loading={verifying}
          disabled={sending || verifying || code.length !== 6}
          className="shrink-0"
        >
          확인
        </Button>
      </div>
      {error ? (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : message ? (
        <p className="text-xs text-gray-500" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
