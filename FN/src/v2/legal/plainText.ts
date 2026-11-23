import type { Clause, LegalDoc } from './types';

const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];

function clauseToText(clause: Clause): string {
  if (typeof clause === 'string') return clause;
  if ('table' in clause) {
    const rows = clause.table.rows.map((row) => `  - ${row.join(' / ')}`);
    return [clause.text, ...rows].join('\n');
  }
  return [clause.text, ...clause.items.map((item, index) => `  ${index + 1}. ${item}`)].join('\n');
}

/** 가입 화면의 접이식 약관 상자처럼 글자만 보여 줄 곳에 쓰는 평문 변환 */
export function legalDocToText(doc: LegalDoc): string {
  const parts: string[] = [`[${doc.title}] 시행일 ${doc.effectiveDate}`];
  for (const chapter of doc.chapters) {
    if (chapter.title) parts.push(`\n${chapter.title}`);
    for (const article of chapter.articles) {
      const numbered = article.clauses.length > 1;
      const body = article.clauses
        .map((clause, index) => (numbered ? `${CIRCLED[index]} ` : '') + clauseToText(clause))
        .join('\n');
      parts.push(`\n제${article.no}조 (${article.title})\n${body}`);
    }
  }
  parts.push(`\n부칙\n${doc.addenda.join('\n')}`);
  return parts.join('\n');
}
