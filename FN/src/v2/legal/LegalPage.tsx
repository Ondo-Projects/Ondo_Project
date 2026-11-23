import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { PATHS } from '../../routes/paths';
import SiteFooter from '../SiteFooter';
import type { Article, Chapter, Clause, LegalDoc, LegalTable } from './types';

const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];

interface TocEntry {
  id: string;
  label: string;
}

/** 이용약관·개인정보처리방침 공통 화면 */
export default function LegalPage({ doc }: { doc: LegalDoc }) {
  usePageTitle(doc.title);
  // 다른 화면 아래쪽에서 넘어와도 맨 위부터 보이게
  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0);
  }, [doc]);

  const hasChapterTitles = doc.chapters.some((chapter) => chapter.title);
  const toc: TocEntry[] = hasChapterTitles
    ? doc.chapters.map((chapter, index) => ({ id: `chapter-${index + 1}`, label: chapter.title ?? '' }))
    : doc.chapters.flatMap((chapter) =>
        chapter.articles.map((article) => ({ id: `article-${article.no}`, label: `${article.no}. ${article.title}` })),
      );
  toc.push({ id: 'legal-addenda', label: '부칙' });

  return (
    <div className="ondo-ui flex min-h-screen flex-col bg-white text-gray-900">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link to={PATHS.ROOT} className="flex items-center gap-2" aria-label="온도 처음 화면">
            <img src="/ondo-mark.svg" alt="" width={24} height={24} className="h-6 w-6" />
            <span className="text-[15px] font-semibold tracking-tight">온도</span>
          </Link>
          <Link
            to={PATHS.LOGIN}
            className="inline-flex h-8 items-center rounded-md px-3 text-[13px] font-medium text-gray-900 hover:bg-gray-100"
          >
            로그인
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="mx-auto max-w-6xl px-6 py-12">
            <p className="text-[13px] font-semibold text-blue-700">약관 및 정책</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{doc.title}</h1>
            <p className="mt-2 text-sm text-gray-600">시행일 {doc.effectiveDate}</p>
            <nav className="mt-6 flex gap-1" aria-label="약관 및 정책 문서">
              <DocTab to={PATHS.TERMS} label="이용약관" current={doc.title === '이용약관'} />
              <DocTab to={PATHS.PRIVACY} label="개인정보처리방침" current={doc.title === '개인정보처리방침'} />
            </nav>
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <nav className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto" aria-label={`${doc.title} 목차`}>
              <p className="text-xs font-semibold text-gray-500">목차</p>
              <TocList entries={toc} />
            </nav>
          </aside>

          <article className="max-w-3xl min-w-0">
            <details className="mb-8 rounded-lg border border-gray-200 lg:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
                목차
                <ChevronDown size={16} className="text-gray-400" aria-hidden />
              </summary>
              <div className="border-t border-gray-200 px-4 pb-3">
                <TocList entries={toc} />
              </div>
            </details>

            <section aria-labelledby="legal-summary" className="rounded-lg border border-blue-200 bg-blue-50 p-6">
              <h2 id="legal-summary" className="text-base font-semibold text-blue-900">
                한눈에 보기
              </h2>
              <p className="mt-1 text-[13px] text-blue-900/80">
                중요한 내용을 쉬운 말로 줄였습니다. 정확한 내용은 아래 조항을 따릅니다.
              </p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {doc.summary.map((line) => (
                  <li key={line} className="flex gap-2.5 text-[15px] leading-relaxed text-gray-800">
                    <span aria-hidden className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-blue-700" />
                    {line}
                  </li>
                ))}
              </ul>
            </section>

            {doc.chapters.map((chapter, index) => (
              <ChapterSection key={chapter.title ?? index} chapter={chapter} index={index} />
            ))}

            <section aria-labelledby="legal-addenda" className="mt-12 border-t border-gray-200 pt-8">
              <h2 id="legal-addenda" className="scroll-mt-20 text-lg font-semibold">
                부칙
              </h2>
              {doc.addenda.map((line) => (
                <p key={line} className="mt-3 text-[15px] leading-relaxed text-gray-700">
                  {line}
                </p>
              ))}
            </section>
          </article>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function DocTab({ to, label, current }: { to: string; label: string; current: boolean }) {
  return (
    <Link
      to={to}
      aria-current={current ? 'page' : undefined}
      className={
        current
          ? 'inline-flex h-8 items-center rounded-md bg-gray-900 px-3 text-[13px] font-medium text-white'
          : 'inline-flex h-8 items-center rounded-md border border-gray-300 bg-white px-3 text-[13px] font-medium text-gray-700 hover:bg-gray-100'
      }
    >
      {label}
    </Link>
  );
}

function TocList({ entries }: { entries: TocEntry[] }) {
  return (
    <ol className="mt-3 flex flex-col gap-0.5">
      {entries.map((entry) => (
        <li key={entry.id}>
          <a href={`#${entry.id}`} className="block py-1.5 text-[13px] text-gray-700 hover:text-blue-700">
            {entry.label}
          </a>
        </li>
      ))}
    </ol>
  );
}

function ChapterSection({ chapter, index }: { chapter: Chapter; index: number }) {
  if (!chapter.title) {
    return (
      <div className="mt-4">
        {chapter.articles.map((article) => (
          <ArticleBlock key={article.no} article={article} />
        ))}
      </div>
    );
  }
  const id = `chapter-${index + 1}`;
  return (
    <section id={id} className="mt-12 scroll-mt-20" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="border-b border-gray-900 pb-3 text-xl font-semibold tracking-tight">
        {chapter.title}
      </h2>
      {chapter.articles.map((article) => (
        <ArticleBlock key={article.no} article={article} />
      ))}
    </section>
  );
}

function ArticleBlock({ article }: { article: Article }) {
  const numbered = article.clauses.length > 1;
  return (
    <section id={`article-${article.no}`} className="mt-8 scroll-mt-20">
      <h3 className="text-base font-semibold">
        제{article.no}조 ({article.title})
      </h3>
      <ol className="mt-3 flex flex-col gap-3">
        {article.clauses.map((clause, index) => (
          <li key={index} className="flex gap-2 text-[15px] leading-7 text-gray-700">
            {numbered ? <span className="shrink-0 text-gray-900">{CIRCLED[index]}</span> : null}
            <ClauseBody clause={clause} />
          </li>
        ))}
      </ol>
    </section>
  );
}

function ClauseBody({ clause }: { clause: Clause }) {
  if (typeof clause === 'string') return <p>{clause}</p>;
  if ('table' in clause) {
    return (
      <div className="min-w-0 flex-1">
        <p>{clause.text}</p>
        <LegalTableView table={clause.table} />
      </div>
    );
  }
  return (
    <div>
      <p>{clause.text}</p>
      <ol className="mt-2 flex flex-col gap-1.5">
        {clause.items.map((item, index) => (
          <li key={item} className="flex gap-2">
            <span className="w-5 shrink-0 text-right text-gray-500 tabular-nums">{index + 1}.</span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function LegalTableView({ table }: { table: LegalTable }) {
  return (
    <div className="mt-3 overflow-x-auto rounded-lg border border-gray-300">
      <table className="w-full min-w-[480px] border-collapse text-left text-sm leading-6">
        <thead className="bg-gray-100">
          <tr>
            {table.head.map((cell) => (
              <th key={cell} scope="col" className="border-b border-gray-300 px-3 py-2 font-semibold text-gray-900">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr key={row.join('|')} className="border-b border-gray-200 last:border-b-0">
              {row.map((cell, index) => (
                <td
                  key={index}
                  className={
                    index === 0 ? 'px-3 py-2 align-top font-medium text-gray-900' : 'px-3 py-2 align-top text-gray-700'
                  }
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
