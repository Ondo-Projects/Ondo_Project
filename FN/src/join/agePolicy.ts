/**
 * BN AgePolicy.isUnder14 와 동일 — 만 14세 미만이면 true
 */
export function isUnder14(birthDate: string): boolean {
  if (!birthDate) {
    return false;
  }

  const parsed = parseBirthDate(birthDate);
  if (!parsed) {
    return false;
  }

  const today = new Date();
  let age = today.getFullYear() - parsed.getFullYear();
  const monthDiff = today.getMonth() - parsed.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsed.getDate())) {
    age -= 1;
  }

  return age < 14;
}

export function parseBirthDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  if (date > new Date()) {
    return null;
  }

  return date;
}

export function formatBirthDateInput(value: string): string {
  return value.trim();
}
