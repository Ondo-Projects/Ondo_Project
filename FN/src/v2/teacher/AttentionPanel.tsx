import { useEffect, useState } from 'react';
import { HeartHandshake } from 'lucide-react';
import { getTeacherAttention } from '../../api/teacher.api';
import type { StudentAttention } from '../../api/types/teacher';
import { Badge } from '../../ds';
import { displayName } from './shared';

interface AttentionPanelProps {
  /** 값이 바뀌면 목록을 다시 불러옵니다 */
  refreshKey?: number;
  /** 학교폭력 상담 이유를 누르면 해당 상담을 엽니다 (상담 화면에서만) */
  onOpenCounseling?: (postId: number) => void;
}

/**
 * 먼저 살펴보면 좋을 학생 (위기 신호 알림)
 * 진단이 아니라 담임이 한 번 더 들여다보도록 돕는 안내입니다. 대상이 없으면 아무것도 그리지 않습니다.
 */
export default function AttentionPanel({ refreshKey = 0, onOpenCounseling }: AttentionPanelProps) {
  const [items, setItems] = useState<StudentAttention[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getTeacherAttention()
      .then((data) => !cancelled && setItems(data))
      // 보조 안내이므로 실패해도 화면 전체를 막지 않습니다.
      .catch(() => !cancelled && setItems([]));
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (!items || items.length === 0) return null;

  const urgentCount = items.filter((item) => item.urgent).length;

  return (
    <section aria-labelledby="attention-title" className="rounded-lg border border-gray-300 bg-white">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <HeartHandshake size={18} className="text-red-600" aria-hidden />
          <h2 id="attention-title" className="text-sm font-semibold text-gray-900">
            먼저 살펴보면 좋을 학생 {items.length}명
          </h2>
          {urgentCount > 0 ? <Badge tone="danger">오늘 확인 {urgentCount}</Badge> : null}
        </div>
        <p className="text-xs text-gray-600">기분 기록과 상담 신청으로 고른 안내예요. 진단이 아닙니다.</p>
      </header>
      <ul className="divide-y divide-gray-200">
        {items.map((item) => (
          <li
            key={item.studentUsername}
            className="flex flex-col gap-1.5 px-4 py-3 sm:flex-row sm:items-start sm:gap-4"
          >
            <div className="flex shrink-0 items-center gap-2 sm:w-40">
              <span className="text-sm font-semibold text-gray-900">
                {displayName(item.studentName, item.studentUsername)}
              </span>
              {item.urgent ? <Badge tone="danger">오늘</Badge> : null}
            </div>
            <ul className="flex min-w-0 flex-col gap-1">
              {item.reasons.map((reason, index) => (
                <li
                  key={`${reason.code}-${reason.counselingPostId ?? index}`}
                  className="text-[13px] leading-relaxed text-gray-800"
                >
                  {reason.message}
                  {reason.counselingPostId !== null && onOpenCounseling ? (
                    <button
                      type="button"
                      className="ml-2 font-medium text-blue-700 hover:underline"
                      onClick={() => onOpenCounseling(reason.counselingPostId as number)}
                    >
                      상담 열기
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <p className="border-t border-gray-200 bg-gray-50 px-4 py-2.5 text-xs leading-relaxed text-gray-600">
        학생에게 위험한 상황이 의심되면 학교 위기관리 절차에 따라 보호자·관계 기관과 함께 대응하세요. 긴급하면 112·119,
        학교폭력 117, 자살예방 109.
      </p>
    </section>
  );
}
