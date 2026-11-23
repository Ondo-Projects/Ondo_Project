import { type KeyboardEvent, useEffect, useId, useState } from 'react';
import { School as SchoolIcon, Search, X } from 'lucide-react';
import { searchSchools } from '../../api/school.api';
import type { School, SchoolTypeFilter } from '../../api/types/signup';
import { Button, Input, cn } from '../../ds';
import { SCHOOL_TYPE_FILTERS } from '../../join/constants';
import { getSchoolResultId } from '../../join/joinA11y';
import { mapVerificationError } from '../../join/joinErrors';
import { useJoinForm } from '../../join/JoinFormProvider';

function schoolTypeLabel(type: string): string {
  if (type.includes('고')) return '고등학교';
  if (type.includes('중')) return '중학교';
  return type;
}

/** 학교 검색 (두 글자부터 자동 검색, 화살표·Enter 로 고르기) */
export function SchoolPicker() {
  const listboxId = useId();
  const { state, fieldErrors, actions } = useJoinForm();
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState<SchoolTypeFilter>('');
  const [results, setResults] = useState<School[]>([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const error = fieldErrors.school;

  useEffect(() => {
    if (state.selectedSchool) return;
    const trimmed = keyword.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setMessage(trimmed ? '두 글자 이상 입력해 주세요.' : null);
      setOpen(Boolean(trimmed));
      setActive(-1);
      return;
    }
    const timer = window.setTimeout(async () => {
      setSearching(true);
      setMessage(null);
      try {
        const schools = await searchSchools(trimmed, type || undefined);
        setResults(schools);
        setOpen(true);
        setActive(schools.length > 0 ? 0 : -1);
        setMessage(schools.length === 0 ? '검색 결과가 없어요. 학교 이름을 다시 확인해 주세요.' : null);
      } catch (err) {
        setResults([]);
        setActive(-1);
        setOpen(true);
        setMessage(mapVerificationError(err, '학교를 검색하지 못했어요. 잠시 후 다시 시도해 주세요.'));
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [keyword, type, state.selectedSchool]);

  function select(school: School) {
    actions.setSelectedSchool(school);
    setKeyword('');
    setResults([]);
    setOpen(false);
    setMessage(null);
    setActive(-1);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!open || results.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((prev) => (prev + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
    } else if (event.key === 'Enter' && active >= 0) {
      event.preventDefault();
      select(results[active]);
    }
  }

  if (state.selectedSchool) {
    return (
      <div
        className="flex items-center justify-between gap-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2.5"
        role="status"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <SchoolIcon size={18} className="shrink-0 text-blue-700" aria-hidden />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">{state.selectedSchool.schoolName}</p>
            <p className="text-xs text-gray-600">
              {schoolTypeLabel(state.selectedSchool.schoolType)} · {state.selectedSchool.region}
            </p>
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={() => actions.setSelectedSchool(null)}>
          다시 고르기
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="schoolKeyword" className="text-[13px] font-medium text-gray-700">
        학교 이름
        <span className="ml-0.5 text-red-600" aria-hidden>
          *
        </span>
      </label>
      <div className="relative">
        <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" aria-hidden />
        <Input
          id="schoolKeyword"
          role="combobox"
          className="pr-9 pl-9"
          placeholder="개포중, 경기고처럼 입력"
          autoComplete="off"
          value={keyword}
          invalid={Boolean(error)}
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? getSchoolResultId(active) : undefined}
          onChange={(event) => setKeyword(event.target.value)}
          onFocus={() => {
            if (keyword.trim().length >= 2 || message) setOpen(true);
          }}
          onKeyDown={onKeyDown}
        />
        {keyword ? (
          <button
            type="button"
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-700"
            aria-label="검색어 지우기"
            onClick={() => setKeyword('')}
          >
            <X size={16} aria-hidden />
          </button>
        ) : null}
      </div>

      <div className="flex gap-1.5" role="group" aria-label="학교 종류">
        {SCHOOL_TYPE_FILTERS.map((filter) => (
          <button
            key={filter.value || 'all'}
            type="button"
            aria-pressed={type === filter.value}
            onClick={() => setType(filter.value)}
            className={cn(
              'h-7 rounded-md border px-2.5 text-xs font-medium transition-colors duration-150',
              type === filter.value
                ? 'border-blue-600 bg-blue-50 text-blue-800'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50',
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label="학교 검색 결과"
          className="max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-white"
        >
          {searching ? (
            <p className="px-3 py-2.5 text-[13px] text-gray-500" role="status">
              찾는 중…
            </p>
          ) : message ? (
            <p className="px-3 py-2.5 text-[13px] text-gray-500" role="status">
              {message}
            </p>
          ) : (
            results.map((school, index) => (
              <button
                key={school.schoolCode}
                id={getSchoolResultId(index)}
                type="button"
                role="option"
                aria-selected={index === active}
                onMouseEnter={() => setActive(index)}
                onClick={() => select(school)}
                className={cn(
                  'flex w-full items-center justify-between gap-3 border-b border-gray-100 px-3 py-2 text-left last:border-b-0',
                  index === active && 'bg-gray-50',
                )}
              >
                <span className="text-sm text-gray-900">{school.schoolName}</span>
                <span className="shrink-0 text-xs text-gray-500">
                  {schoolTypeLabel(school.schoolType)} · {school.region}
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}

      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : (
        <p className="text-xs text-gray-500">전국 중·고등학교에서 찾아요.</p>
      )}
    </div>
  );
}
