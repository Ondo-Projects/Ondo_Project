import { Cloud, CloudLightning, CloudRain, CloudSnow, CloudSun, Sun, Thermometer, type LucideIcon } from 'lucide-react';
import type { MoodLevelCode } from '../../api/types/student';
import { STUDENT_SECTIONS } from '../../student/constants';

export type StudentTab = 'home' | 'school' | 'counsel' | 'news' | 'me';

export interface StudentRoute {
  tab: StudentTab;
  /** 하위 화면 경로 (예: counsel/12/edit → ['12', 'edit']) */
  sub: string[];
}

const TABS: StudentTab[] = ['home', 'school', 'counsel', 'news', 'me'];

/** 예전 학생 홈 주소(#section-…)를 새 화면으로 — 공통 홈·알림 링크가 그대로 동작하도록 */
const LEGACY_HASH: Record<string, string> = {
  [STUDENT_SECTIONS.TODAY]: 'school',
  [STUDENT_SECTIONS.MOOD]: '',
  [STUDENT_SECTIONS.NOTICE]: 'news',
  [STUDENT_SECTIONS.SCHOOL_CALENDAR]: 'school',
  [STUDENT_SECTIONS.TIMETABLE]: 'school',
  [STUDENT_SECTIONS.CLASS_PROFILE]: 'me/class',
  [STUDENT_SECTIONS.ASSIGNMENT]: 'me/teacher',
  [STUDENT_SECTIONS.PRE_COUNSEL]: 'counsel/card',
  [STUDENT_SECTIONS.COUNSEL_CREATE]: 'counsel/new',
  [STUDENT_SECTIONS.COUNSEL_LIST]: 'counsel',
  [STUDENT_SECTIONS.COUNSEL_DETAIL]: 'counsel',
  [STUDENT_SECTIONS.SUGGESTION]: 'me/suggestions',
};

/** 예전 섹션 id → 새 주소 해시 (없으면 그대로) */
export function legacyTargetToHash(target: string): string {
  return target in LEGACY_HASH ? LEGACY_HASH[target] : target;
}

export function parseStudentHash(hash: string): StudentRoute {
  const raw = legacyTargetToHash(decodeURIComponent(hash.replace(/^#/, '')));
  const [first, ...rest] = raw.split('/').filter(Boolean);
  if (first && (TABS as string[]).includes(first)) {
    return { tab: first as StudentTab, sub: rest };
  }
  return { tab: 'home', sub: [] };
}

export function routeToHash(tab: StudentTab, ...sub: Array<string | number>): string {
  const path = [tab === 'home' ? '' : tab, ...sub.map(String)].filter(Boolean).join('/');
  return path ? `#${path}` : '';
}

export const MOOD_CHOICES: Array<{ code: MoodLevelCode; label: string; icon: LucideIcon }> = [
  { code: 'SUNNY', label: '맑음', icon: Sun },
  { code: 'FAIR', label: '보통', icon: CloudSun },
  { code: 'CLOUDY', label: '흐림', icon: Cloud },
  { code: 'RAINY', label: '우울', icon: CloudRain },
  { code: 'STORMY', label: '힘듦', icon: CloudLightning },
];

/** 백엔드 날씨 상태 글자 → 아이콘 (맑음, 구름많음, 흐림, 비, 눈, 빗방울 …) */
export function weatherIcon(condition: string | null | undefined): LucideIcon {
  const text = condition ?? '';
  if (text.includes('눈')) return CloudSnow;
  if (text.includes('비') || text.includes('빗방울')) return CloudRain;
  if (text.includes('구름')) return CloudSun;
  if (text.includes('흐림')) return Cloud;
  if (text.includes('맑음')) return Sun;
  return Thermometer;
}

/** "2026-11-23" → "11월 23일 (월)" */
export function formatKoreanDay(value: string | null | undefined): string {
  if (!value) return '-';
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' }).format(date);
}

export function todayLabel(): string {
  return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date());
}
