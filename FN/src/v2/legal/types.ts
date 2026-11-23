/** 약관·방침 문서 공통 구조 */

export interface LegalTable {
  head: string[];
  rows: string[][];
}

/** 문단: 문장 하나, 문장 + 하위 항목, 또는 문장 + 표 */
export type Clause = string | { text: string; items: string[] } | { text: string; table: LegalTable };

export interface Article {
  no: number;
  title: string;
  clauses: Clause[];
}

/** title 이 없으면 장 제목 없이 조항만 나열합니다 (목차는 조항 제목으로 만듦) */
export interface Chapter {
  title?: string;
  articles: Article[];
}

export interface LegalDoc {
  title: string;
  effectiveDate: string;
  summary: string[];
  chapters: Chapter[];
  addenda: string[];
}
