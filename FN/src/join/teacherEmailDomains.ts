export interface TeacherEmailDomainOption {
  region: string;
  office: string;
  domain: string;
}

/** 교사 가입 허용 이메일 도메인 — BN TeacherEmailDomains 와 동일 */
export const TEACHER_EMAIL_DOMAIN_OPTIONS: TeacherEmailDomainOption[] = [
  { region: '서울', office: '서울특별시교육청', domain: 'sen.go.kr' },
  { region: '부산', office: '부산광역시교육청', domain: 'pen.go.kr' },
  { region: '대구', office: '대구광역시교육청', domain: 'dge.go.kr' },
  { region: '인천', office: '인천광역시교육청', domain: 'ice.go.kr' },
  { region: '광주', office: '광주광역시교육청', domain: 'gen.go.kr' },
  { region: '대전', office: '대전광역시교육청', domain: 'dje.go.kr' },
  { region: '울산', office: '울산광역시교육청', domain: 'use.go.kr' },
  { region: '세종', office: '세종특별자치시교육청', domain: 'sje.go.kr' },
  { region: '경기', office: '경기도교육청', domain: 'goe.go.kr' },
  { region: '강원', office: '강원특별자치도교육청', domain: 'kwe.go.kr' },
  { region: '충북', office: '충청북도교육청', domain: 'cbe.go.kr' },
  { region: '충남', office: '충청남도교육청', domain: 'cne.go.kr' },
  { region: '전북', office: '전북특별자치도교육청', domain: 'jbe.go.kr' },
  { region: '전남', office: '전라남도교육청', domain: 'jne.go.kr' },
  { region: '경북', office: '경상북도교육청', domain: 'gbe.kr' },
  { region: '경남', office: '경상남도교육청', domain: 'gne.go.kr' },
  { region: '제주', office: '제주특별자치도교육청', domain: 'jje.go.kr' },
  { region: '교육부', office: '교육부', domain: 'korea.kr' },
];

export const TEACHER_EMAIL_DOMAINS = TEACHER_EMAIL_DOMAIN_OPTIONS.map((option) => option.domain);

export function isAllowedTeacherEmailDomain(domain: string): boolean {
  return TEACHER_EMAIL_DOMAINS.includes(domain.trim().toLowerCase());
}

export function buildTeacherEmail(localPart: string, domain: string): string {
  const trimmedLocal = localPart.trim().toLowerCase();
  const trimmedDomain = domain.trim().toLowerCase();
  if (!trimmedLocal || !trimmedDomain) {
    return '';
  }
  return `${trimmedLocal}@${trimmedDomain}`;
}

export function parseTeacherEmail(email: string): { localPart: string; domain: string } | null {
  const normalized = email.trim().toLowerCase();
  const atIndex = normalized.lastIndexOf('@');
  if (atIndex <= 0 || atIndex === normalized.length - 1) {
    return null;
  }

  const localPart = normalized.slice(0, atIndex);
  const domain = normalized.slice(atIndex + 1);
  if (!isAllowedTeacherEmailDomain(domain)) {
    return null;
  }

  return { localPart, domain };
}

export function formatTeacherDomainLabel(option: TeacherEmailDomainOption): string {
  return `${option.region} · ${option.office} (@${option.domain})`;
}
