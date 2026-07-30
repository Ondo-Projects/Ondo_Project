export function scrollToTeacherSection(sectionId: string) {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }
  return value.replace('T', ' ').slice(0, 16);
}

export function formatTeacherDisplay(name: string | null | undefined, username: string): string {
  if (name?.trim()) {
    return name.trim();
  }
  return username;
}

export function formatShortDate(value: string | null | undefined): string {
  if (!value) {
    return '-';
  }
  const parts = value.split('-');
  if (parts.length !== 3) {
    return value;
  }
  return `${Number(parts[1])}/${Number(parts[2])}`;
}

export function formatWeekday(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
}

export function displayFieldValue(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed || '-';
}
