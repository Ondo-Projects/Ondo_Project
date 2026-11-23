/** 조건부 class 이름 합치기 (falsy 값은 건너뜀) */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
