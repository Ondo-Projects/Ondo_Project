import { Phone } from 'lucide-react';
import { cn } from '../../ds';

const LINES = [
  { number: '109', label: '자살예방 상담', note: '24시간' },
  { number: '1388', label: '청소년 상담', note: '24시간 · 문자 #1388' },
  { number: '117', label: '학교폭력 신고·상담', note: '24시간' },
];

/**
 * 힘들 때 바로 연락할 수 있는 곳 — 기분 '우울·힘듦'을 고르거나 마음·학교폭력 상담을 쓸 때 보여 줍니다.
 * 온도는 답변이 늦을 수 있으므로, 급할 때는 바로 이곳에 연락하도록 안내합니다.
 */
export default function HelpLines({
  title,
  description,
  first,
  className,
}: {
  title: string;
  description?: string;
  /** 맨 앞에 보여 줄 번호 (예: 학교폭력 상담이면 '117') */
  first?: string;
  className?: string;
}) {
  const lines = first ? [...LINES].sort((a, b) => Number(b.number === first) - Number(a.number === first)) : LINES;
  return (
    <div role="note" className={cn('rounded-lg border border-blue-200 bg-blue-50 p-4', className)}>
      <p className="text-sm font-semibold text-blue-900">{title}</p>
      {description ? <p className="mt-1 text-[13px] leading-relaxed text-blue-900/80">{description}</p> : null}
      <ul className="mt-3 grid gap-2 sm:grid-cols-3">
        {lines.map((line) => (
          <li key={line.number}>
            <a
              href={`tel:${line.number}`}
              className="flex items-center gap-2.5 rounded-md border border-blue-200 bg-white px-3 py-2.5 hover:bg-blue-100/40"
            >
              <Phone size={16} className="shrink-0 text-blue-700" aria-hidden />
              <span className="min-w-0">
                <span className="block text-[15px] font-semibold text-gray-900">
                  {line.number} <span className="text-[13px] font-medium text-gray-700">{line.label}</span>
                </span>
                <span className="block text-xs text-gray-500">{line.note}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-2.5 text-xs text-blue-900/80">지금 위험하다면 112(경찰)·119(구급)에 바로 전화하세요.</p>
    </div>
  );
}
