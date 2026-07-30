import { useEffect, useState } from 'react';
import { searchSchools } from '../../api/school.api';
import type { School, SchoolTypeFilter } from '../../api/types/signup';
import { mapVerificationError } from '../joinErrors';
import { SCHOOL_TYPE_FILTERS } from '../constants';
import { useJoinForm } from '../JoinFormProvider';
import JoinField from './JoinField';
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
  const { state, fieldErrors, actions } = useJoinForm();
  const [keyword, setKeyword] = useState('');
  const [schoolTypeFilter, setSchoolTypeFilter] = useState<SchoolTypeFilter>('');
  const [results, setResults] = useState<School[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (state.selectedSchool) {
      return;
    }

    const trimmed = keyword.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearchMessage(trimmed.length === 0 ? null : '두 글자 이상 입력해 주세요.');
      setIsOpen(trimmed.length > 0);
      return;
    }

    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      setSearchMessage(null);

      try {
        const schools = await searchSchools(trimmed, schoolTypeFilter || undefined);
        setResults(schools);
        setIsOpen(true);
        setSearchMessage(
          schools.length === 0 ? '검색 결과가 없어요. 학교명을 다시 확인해 주세요.' : null,
        );
      } catch (error) {
        setResults([]);
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
  }

  function handleClearSearch() {
    setKeyword('');
    setResults([]);
    setSearchMessage(null);
    setIsOpen(false);
  }

  function handleChangeSchool() {
    actions.setSelectedSchool(null);
    setKeyword('');
    setResults([]);
    setSearchMessage(null);
    setIsOpen(false);
  }

  return (
    <JoinSection title="2. 학교 검색">
      <p className="join-field__helper">전국 중·고등학교를 검색해 선택해 주세요.</p>

      {!state.selectedSchool ? (
        <JoinField
          id="schoolKeyword"
          label="학교명"
          error={fieldErrors.school}
        >
          <div className="join-search-box">
            <div className="join-search-input-wrap">
              <span className="join-search-icon" aria-hidden="true">
                🔍
              </span>
              <input
                id="schoolKeyword"
                className={`join-field__input${fieldErrors.school ? ' join-field__input--error' : ''}`}
                type="text"
                value={keyword}
                placeholder="예: 개포중, 경기고, 부산중..."
                autoComplete="off"
                onChange={(event) => setKeyword(event.target.value)}
                onFocus={() => {
                  if (keyword.trim().length >= 2 || searchMessage) {
                    setIsOpen(true);
                  }
                }}
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
                  onClick={() => setSchoolTypeFilter(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {isOpen ? (
              <div className="join-search-results" role="listbox" aria-label="학교 검색 결과">
                {isSearching ? (
                  <p className="join-search-status">검색 중…</p>
                ) : searchMessage ? (
                  <p className="join-search-status">{searchMessage}</p>
                ) : (
                  results.map((school) => {
                    const badge = getSchoolTypeBadge(school.schoolType);

                    return (
                      <button
                        key={school.schoolCode}
                        type="button"
                        className="join-search-result-item"
                        role="option"
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
        </JoinField>
      ) : (
        <div className="join-selected-school">
          <div className="join-selected-school__header">
            <div>
              <p className="join-selected-school__name">{state.selectedSchool.schoolName}</p>
              <p className="join-selected-school__meta">
                {state.selectedSchool.schoolType} · {state.selectedSchool.region}
              </p>
            </div>
            <button type="button" className="join-btn join-btn--ghost" onClick={handleChangeSchool}>
              다시 선택
            </button>
          </div>
        </div>
      )}
    </JoinSection>
  );
}
