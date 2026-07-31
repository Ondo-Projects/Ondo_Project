import { type FormEvent, useCallback, useState } from 'react';

import {
  changeAdminUserSchool,
  searchAdminUsers,
  updateAdminUserStatus,
} from '../../api/admin.api';
import type { AdminPageResponse, AdminUserSummary } from '../../api/types/admin';
import type { UserRole } from '../../api/types/auth';
import { ApiError } from '../../api/types/api-error';
import { Badge, Btn, Field, Input } from '../../components/ui';
import { PAGE_SIZE, USER_ROLE_FILTER_OPTIONS } from '../constants';
import { getRoleBadgeVariant, getRoleLabel, resolveErrorMessage } from '../adminUtils';
import AdminFilterChips from './AdminFilterChips';
import AdminPager from './AdminPager';
import AdminSectionCard from './AdminSectionCard';

interface SectionUserSearchProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onDataChange: () => void;
}

export default function SectionUserSearch({
  onSuccess,
  onError,
  onDataChange,
}: SectionUserSearchProps) {
  const [keyword, setKeyword] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState<AdminPageResponse<AdminUserSummary> | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUserSummary | null>(null);
  const [manageSchoolCode, setManageSchoolCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const loadUsers = useCallback(
    async (nextPage = page) => {
      setIsSearching(true);
      try {
        const response = await searchAdminUsers({
          keyword: keyword.trim() || undefined,
          schoolCode: schoolCode.trim() || undefined,
          role: roleFilter,
          page: nextPage,
          size: PAGE_SIZE,
        });
        setPageData(response);
        setPage(nextPage);
      } catch (error) {
        onError(
          error instanceof ApiError
            ? error.message
            : resolveErrorMessage(error, '회원 검색에 실패했습니다.'),
        );
      } finally {
        setIsSearching(false);
      }
    },
    [keyword, schoolCode, roleFilter, page, onError],
  );

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    setSelectedUser(null);
    void loadUsers(0);
  }

  function selectUser(user: AdminUserSummary) {
    setSelectedUser(user);
    setManageSchoolCode(user.schoolCode || '');
  }

  async function handleStatusChange(active: boolean) {
    if (!selectedUser) {
      return;
    }
    setIsUpdating(true);
    try {
      const updated = await updateAdminUserStatus(selectedUser.username, { active });
      setSelectedUser(updated);
      onSuccess(active ? '회원을 활성화했습니다.' : '회원을 비활성화했습니다.');
      onDataChange();
      await loadUsers(page);
    } catch (error) {
      onError(
        error instanceof ApiError
          ? error.message
          : resolveErrorMessage(error, '회원 상태 변경에 실패했습니다.'),
      );
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleSchoolChange() {
    if (!selectedUser) {
      return;
    }
    const nextSchoolCode = manageSchoolCode.trim();
    if (!nextSchoolCode) {
      onError('변경할 학교 코드를 입력해 주세요.');
      return;
    }
    setIsUpdating(true);
    try {
      const updated = await changeAdminUserSchool(selectedUser.username, {
        schoolCode: nextSchoolCode,
      });
      setSelectedUser(updated);
      setManageSchoolCode(updated.schoolCode || '');
      onSuccess('회원 학교를 변경했습니다.');
      onDataChange();
      await loadUsers(page);
    } catch (error) {
      onError(
        error instanceof ApiError
          ? error.message
          : resolveErrorMessage(error, '학교 변경에 실패했습니다.'),
      );
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <AdminSectionCard title="1. 회원 조회">
      <form className="admin-search-fields" onSubmit={handleSearch}>
        <Field id="admin-user-keyword" label="아이디·이름">
          <Input
            type="text"
            value={keyword}
            placeholder="검색어"
            onChange={(event) => setKeyword(event.target.value)}
          />
        </Field>
        <Field id="admin-user-school-code" label="학교 코드">
          <Input
            type="text"
            value={schoolCode}
            placeholder="선택"
            onChange={(event) => setSchoolCode(event.target.value)}
          />
        </Field>
      </form>

      <AdminFilterChips
        ariaLabel="회원 역할 필터"
        options={USER_ROLE_FILTER_OPTIONS}
        value={roleFilter}
        onChange={(value) => setRoleFilter(value)}
      />

      <div className="admin-search-actions">
        <Btn
          type="button"
          variant="primary"
          size="student"
          disabled={isSearching}
          onClick={() => void loadUsers(0)}
        >
          검색
        </Btn>
      </div>

      {selectedUser ? (
        <div className="admin-management-box">
          <p className="admin-helper admin-helper--flush">
            선택한 회원:{' '}
            <strong>
              {selectedUser.name || selectedUser.username} ({selectedUser.username}) ·{' '}
              {getRoleLabel(selectedUser.role)}
            </strong>
          </p>
          <div className="admin-inline-actions">
            <Input
              type="text"
              value={manageSchoolCode}
              placeholder="변경할 학교 코드"
              aria-label="변경할 학교 코드"
              onChange={(event) => setManageSchoolCode(event.target.value)}
            />
            <Btn
              type="button"
              variant="secondary"
              size="student"
              disabled={isUpdating}
              onClick={() => void handleSchoolChange()}
            >
              학교 변경
            </Btn>
            <Btn
              type="button"
              variant="danger"
              size="student"
              disabled={isUpdating || !selectedUser.active}
              onClick={() => void handleStatusChange(false)}
            >
              비활성화
            </Btn>
            <Btn
              type="button"
              variant="primary"
              size="student"
              disabled={isUpdating || selectedUser.active}
              onClick={() => void handleStatusChange(true)}
            >
              활성화
            </Btn>
          </div>
        </div>
      ) : null}

      {!pageData ? (
        <p className="admin-status">검색 버튼을 눌러 회원 목록을 조회하세요.</p>
      ) : pageData.items.length === 0 ? (
        <p className="admin-status">검색 결과가 없습니다.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>아이디</th>
                <th>이름</th>
                <th>역할</th>
                <th>상태</th>
                <th>학교</th>
                <th>지역</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pageData.items.map((user) => (
                <tr key={user.username}>
                  <td data-label="아이디">{user.username}</td>
                  <td data-label="이름">{user.name || '-'}</td>
                  <td data-label="역할">
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </td>
                  <td data-label="상태">
                    <Badge variant={user.active ? 'completed' : 'neutral'}>
                      {user.active ? '활성' : '비활성'}
                    </Badge>
                  </td>
                  <td data-label="학교">{user.schoolName}</td>
                  <td data-label="지역">{user.schoolRegion || '-'}</td>
                  <td className="admin-table__actions">
                    <Btn type="button" variant="ghost" size="student" onClick={() => selectUser(user)}>
                      관리
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminPager pageData={pageData} onPageChange={(nextPage) => void loadUsers(nextPage)} />
    </AdminSectionCard>
  );
}
