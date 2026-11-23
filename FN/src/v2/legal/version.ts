/** '2026-12-01' → '2026년 12월 1일' */
export function formatVersionDate(version: string): string {
  const [year, month, day] = version.split('-').map(Number);
  return `${year}년 ${month}월 ${day}일`;
}
