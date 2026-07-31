import { apiClient } from './client';
import type { School, SchoolTypeFilter } from './types/signup';

export function searchSchools(keyword: string, schoolType?: SchoolTypeFilter) {
  const params = new URLSearchParams({ keyword: keyword.trim() });

  if (schoolType) {
    params.set('schoolType', schoolType);
  }

  return apiClient<School[]>(`/api/schools/search?${params.toString()}`, {
    auth: false,
  });
}
