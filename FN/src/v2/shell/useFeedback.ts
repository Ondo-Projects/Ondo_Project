import { useCallback, useEffect, useRef, useState } from 'react';

export type Feedback = { tone: 'success' | 'danger'; message: string } | null;

/** 화면 위쪽 한 줄 결과 메시지 — 성공은 4초 뒤 사라지고, 오류는 닫을 때까지 남습니다 */
export function useFeedback(afterSuccess?: () => void) {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const timerRef = useRef<number | undefined>(undefined);

  const onSuccess = useCallback(
    (message: string) => {
      window.clearTimeout(timerRef.current);
      setFeedback({ tone: 'success', message });
      timerRef.current = window.setTimeout(() => setFeedback(null), 4000);
      afterSuccess?.();
    },
    [afterSuccess],
  );

  const onError = useCallback((message: string) => {
    window.clearTimeout(timerRef.current);
    setFeedback({ tone: 'danger', message });
  }, []);

  const clear = useCallback(() => {
    window.clearTimeout(timerRef.current);
    setFeedback(null);
  }, []);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  return { feedback, onSuccess, onError, clear };
}
