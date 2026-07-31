import { type KeyboardEvent, useEffect, useId, useState } from 'react';
import { searchSchools } from '../../api/school.api';
import type { School, SchoolTypeFilter } from '../../api/types/signup';
import { Btn, CardHelper, Field, Input } from '../../components/ui';
import { getSchoolResultId } from '../joinA11y';
import { mapVerificationError } from '../joinErrors';
import { SCHOOL_TYPE_FILTERS } from '../constants';
import { useJoinForm } from '../JoinFormProvider';
import JoinSection from './JoinSection';

function getSchoolTypeBadge(schoolType: string) {
  if (schoolType.includes('중')) {
    return { label: '중학교', className: 'join-badge join-badge--middle' };
  }
  if (schoolType.includes('고')) {
    return { label: '고등학교', className: 'join-badge join-badge--high' };
  }
  return { label: schoolType, className: 'join-badge' };
}

export default function SchoolSearchSection() {
  const listboxId = useId();
  const { state, fieldErrors, actions } = useJoinForm();
  const [keyword, setKeyword] = useState('');
  const [schoolTypeFilter, setSchoolTypeFilter] = useState<SchoolTypeFilter>('');
  const [results, setResults] = useState<School[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeResultIndex, setActiveResultIndex] = useState(-1);

  const schoolError = fieldErrors.school;
  const helperId = 'schoolKeyword-helper';

  useEffect(() => {
    if (state.selectedSchool) {
      return;
    }

    const trimmed = keyword.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearchMessage(trimmed.length === 0 ? null : '두 글자 이상 입력해 주세요.');
      setIsOpen(trimmed.length > 0);
      setActiveResultIndex(-1);
      return;
    }

    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      setSearchMessage(null);

      try {
        const schools = await searchSchools(trimmed, schoolTypeFilter || undefined);
        setResults(schools);
        setIsOpen(true);
        setActiveResultIndex(schools.length > 0 ? 0 : -1);
        setSearchMessage(
          schools.length === 0 ? '검색 결과가 없어요. 학교명을 다시 확인해 주세요.' : null,
        );
      } catch (error) {
        setResults([]);
        setActiveResultIndex(-1);
        setSearchMessage(
          mapVerificationError(error, '학교 검색에 실패했어요. 잠시 후 다시 시도해 주세요.'),
        );
        setIsOpen(true);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [keyword, schoolTypeFilter, state.selectedSchool]);

  function handleSelectSchool(school: School) {
    actions.setSelectedSchool(school);
    setKeyword('');
    setResults([]);
    setIsOpen(false);
    setSearchMessage(null);
    setActiveResultIndex(-1);
  }

  function handleClearSearch() {
    setKeyword('');
    setResults([]);
    setSearchMessage(null);
    setIsOpen(false);
    setActiveResultIndex(-1);
  }

  function handleChangeSchool() {
    actions.setSelectedSchool(null);
    setKeyword('');
    setResults([]);
    setSearchMessage(null);
    setIsOpen(false);
    setActiveResultIndex(-1);
  }

  function handleKeywordKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || results.length === 0) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveResultIndex((prev) => (prev + 1) % results.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveResultIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
      return;
    }

    if (event.key === 'Enter' && activeResultIndex >= 0) {
      event.preventDefault();
      handleSelectSchool(results[activeResultIndex]);
      return;
    }

    if (event.key === 'Escape') {
      setIsOpen(false);
      setActiveResultIndex(-1);
    }
  }

  return (
    <JoinSection title="2. 학교 검색">
      <CardHelper id={helperId}>
        전국 중·고등학교를 검색해 선택해 주세요.
      </CardHelper>

      {!state.selectedSchool ? (
        <Field id="schoolKeyword" label="학교명" error={schoolError} required>
          <div className="join-search-box">
            <div className="join-search-input-wrap">
              <span className="join-search-icon" aria-hidden="true">
                🔍
              </span>
              <Input
                id="schoolKeyword"
                type="text"
                role="combobox"
                value={keyword}
                placeholder="예: 개포중, 경기고, 부산중..."
                autoComplete="off"
                error={Boolean(schoolError)}
                aria-invalid={schoolError ? true : undefined}
                aria-expanded={isOpen}
                aria-controls={isOpen ? listboxId : undefined}
                aria-autocomplete="list"
                aria-describedby={helperId}
                aria-activedescendant={
                  activeResultIndex >= 0 ? getSchoolResultId(activeResultIndex) : undefined
                }
                onChange={(event) => setKeyword(event.target.value)}
                onFocus={() => {
                  if (keyword.trim().length >= 2 || searchMessage) {
                    setIsOpen(true);
                  }
                }}
                onKeyDown={handleKeywordKeyDown}
              />
              {keyword ? (
                <button
                  type="button"
                  className="join-search-clear"
                  aria-label="검색어 지우기"
                  onClick={handleClearSearch}
                >
                  ×
                </button>
              ) : null}
            </div>

            <div className="join-filter-chips" role="group" aria-label="학교 유형 필터">
              {SCHOOL_TYPE_FILTERS.map((filter) => (
                <button
                  key={filter.value || 'all'}
                  type="button"
                  className={`join-filter-chip${schoolTypeFilter === filter.value ? ' join-filter-chip--active' : ''}`}
                  aria-pressed={schoolTypeFilter === filter.value}
                  onClick={() => setSchoolTypeFilter(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {isOpen ? (
              <div
                id={listboxId}
                className="join-search-results"
                role="listbox"
                aria-label="학교 검색 결과"
              >
                {isSearching ? (
                  <p className="join-search-status" role="status" aria-live="polite">
                    검색 중…
                  </p>
                ) : searchMessage ? (
                  <p className="join-search-status" role="status">
                    {searchMessage}
                  </p>
                ) : (
                  results.map((school, index) => {
                    const badge = getSchoolTypeBadge(school.schoolType);
                    const isActive = index === activeResultIndex;

                    return (
                      <button
                        key={school.schoolCode}
                        id={getSchoolResultId(index)}
                        type="button"
                        className={`join-search-result-item${isActive ? ' join-search-result-item--active' : ''}`}
                        role="option"
                        aria-selected={isActive}
                        onMouseEnter={() => setActiveResultIndex(index)}
                        onClick={() => handleSelectSchool(school)}
                      >
                        <span className="join-search-result-item__name">{school.schoolName}</span>
                        <span className="join-search-result-item__meta">
                          <span className={badge.className}>{badge.label}</span>
                          <span>{school.region}</span>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            ) : null}
          </div>
        </Field>
      ) : (
        <div className="join-selected-school" role="status" aria-live="polite">
          <div className="join-selected-school__header">
            <div>
              <p className="join-selected-school__name">{state.selectedSchool.schoolName}</p>
              <p className="join-selected-school__meta">
                {state.selectedSchool.schoolType} · {state.selectedSchool.region}
              </p>
            </div>
            <Btn type="button" variant="ghost" onClick={handleChangeSchool}>
              다시 선택
            </Btn>
          </div>
        </div>
      )}
    </JoinSection>
  );
}
