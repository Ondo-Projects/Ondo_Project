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
