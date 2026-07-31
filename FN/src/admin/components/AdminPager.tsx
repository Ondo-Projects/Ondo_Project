import type { AdminPageResponse } from '../../api/types/admin';
import { Btn } from '../../components/ui';

interface AdminPagerProps<T> {
  pageData: AdminPageResponse<T> | null;
  onPageChange: (page: number) => void;
}

export default function AdminPager<T>({ pageData, onPageChange }: AdminPagerProps<T>) {
  if (!pageData || pageData.totalElements === 0) {
    return null;
  }

  const totalPages = Math.max(1, Math.ceil(pageData.totalElements / pageData.size));
  const currentPage = pageData.page + 1;
  const canPrev = pageData.page > 0;
  const canNext = pageData.page + 1 < totalPages;

  return (
    <div className="admin-pager">
      <span className="admin-helper">
        {pageData.totalElements}건 · {currentPage}/{totalPages}페이지
      </span>
      <div className="admin-pager__actions">
        <Btn variant="ghost" disabled={!canPrev} onClick={() => onPageChange(pageData.page - 1)}>
          이전
        </Btn>
        <Btn variant="ghost" disabled={!canNext} onClick={() => onPageChange(pageData.page + 1)}>
          다음
        </Btn>
      </div>
    </div>
  );
}
