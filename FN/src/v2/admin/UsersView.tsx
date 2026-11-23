import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { changeAdminUserSchool, searchAdminUsers, updateAdminUserStatus } from '../../api/admin.api';
import type { AdminPageResponse, AdminUserSummary } from '../../api/types/admin';
import type { UserRole } from '../../api/types/auth';
import { PAGE_SIZE, ROLE_LABELS } from '../../admin/constants';
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  PageTitle,
  Pagination,
  Panel,
  Skeleton,
  TBody,
  THead,
  Table,
  Tabs,
  Td,
  Th,
  Tr,
  cn,
} from '../../ds';
import { type FeedbackHandlers, resolveErrorMessage, scrollToDetailOnNarrow } from '../common';

type RoleFilter = UserRole | 'ALL';
const DETAIL_ID = 'admin-user-detail';

export default function UsersView({ onSuccess, onError }: FeedbackHandlers) {
  const [keyword, setKeyword] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [role, setRole] = useState<RoleFilter>('ALL');
  const [data, setData] = useState<AdminPageResponse<AdminUserSummary> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<AdminUserSummary | null>(null);

  const load = useCallback(
    async (page: number, nextRole: RoleFilter = role) => {
      setIsLoading(true);
      try {
        const result = await searchAdminUsers({
          keyword: keyword.trim() || undefined,
          schoolCode: schoolCode.trim() || undefined,
          role: nextRole === 'ALL' ? '' : nextRole,
          page,
          size: PAGE_SIZE,
        });
        setData(result);
        setSelected((prev) => (prev ? (result.items.find((item) => item.username === prev.username) ?? prev) : prev));
      } catch (error) {
        onError(resolveErrorMessage(error, '회원을 불러오지 못했습니다.'));
      } finally {
        setIsLoading(false);
      }
    },
    [keyword, onError, role, schoolCode],
  );

  // 처음 들어오면 첫 페이지를 바로 보여 줍니다.
  useEffect(() => void load(0), []);

  function submit(event: FormEvent) {
    event.preventDefault();
    setSelected(null);
    void load(0);
  }

  return (
    <div className="flex flex-col gap-5">
      <PageTitle title="회원" description="아이디·이름으로 찾고, 학교를 바꾸거나 계정을 정지합니다." />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="flex min-w-0 flex-col gap-3">
          <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-48 flex-1">
              <Search size={16} className="absolute top-1/2 left-2.5 -translate-y-1/2 text-gray-400" aria-hidden />
              <Input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="아이디 또는 이름"
                aria-label="아이디 또는 이름"
                controlSize="sm"
                className="pl-8"
              />
            </div>
            <div className="w-36 shrink-0">
              <Input
                value={schoolCode}
                onChange={(event) => setSchoolCode(event.target.value)}
                placeholder="학교 코드"
                aria-label="학교 코드"
                controlSize="sm"
              />
            </div>
            <Button type="submit" size="sm" loading={isLoading}>
              검색
            </Button>
          </form>

          <Tabs
            items={[
              { value: 'ALL', label: '전체' },
              { value: 'STUDENT', label: '학생' },
              { value: 'TEACHER', label: '교사' },
              { value: 'ADMIN', label: '관리자' },
            ]}
            value={role}
            onChange={(next) => {
              setRole(next);
              setSelected(null);
              void load(0, next);
            }}
          />

          {!data ? (
            <Skeleton className="h-64 w-full" />
          ) : data.items.length === 0 ? (
            <Panel>
              <EmptyState
                className="py-6"
                title="조건에 맞는 회원이 없습니다"
                description="검색어나 역할을 바꿔 보세요."
              />
            </Panel>
          ) : (
            <Table
              className={cn(isLoading && 'opacity-60')}
              footer={
                <Pagination
                  page={data.page}
                  size={data.size}
                  total={data.totalElements}
                  onChange={(page) => void load(page)}
                  disabled={isLoading}
                />
              }
            >
              <THead>
                <tr>
                  <Th>아이디</Th>
                  <Th>이름</Th>
                  <Th>역할</Th>
                  <Th className="hidden md:table-cell">학교</Th>
                  <Th>상태</Th>
                </tr>
              </THead>
              <TBody>
                {data.items.map((user) => (
                  <Tr
                    key={user.username}
                    interactive
                    tabIndex={0}
                    selected={selected?.username === user.username}
                    onClick={() => {
                      setSelected(user);
                      scrollToDetailOnNarrow(DETAIL_ID);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelected(user);
                      }
                    }}
                  >
                    <Td className="font-mono text-xs whitespace-nowrap">{user.username}</Td>
                    <Td className="whitespace-nowrap">{user.name || '-'}</Td>
                    <Td muted className="whitespace-nowrap">
                      {ROLE_LABELS[user.role] ?? user.role}
                    </Td>
                    <Td muted className="hidden max-w-56 truncate md:table-cell">
                      {user.schoolName || '-'}
                    </Td>
                    <Td>{user.active ? <Badge tone="success">활성</Badge> : <Badge tone="danger">정지</Badge>}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </div>

        <div id={DETAIL_ID} className={cn('scroll-mt-28 lg:sticky lg:top-20', !selected && 'hidden lg:block')}>
          {selected ? (
            <UserDetail
              key={selected.username}
              user={selected}
              onClose={() => setSelected(null)}
              onUpdated={(user, message) => {
                setSelected(user);
                setData((prev) =>
                  prev
                    ? { ...prev, items: prev.items.map((item) => (item.username === user.username ? user : item)) }
                    : prev,
                );
                onSuccess(message);
              }}
              onError={onError}
            />
          ) : (
            <Panel title="회원 정보">
              <EmptyState
                className="px-0 py-4"
                title="회원을 선택하세요"
                description="목록에서 회원을 누르면 관리 메뉴가 열립니다."
              />
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function UserDetail({
  user,
  onClose,
  onUpdated,
  onError,
}: {
  user: AdminUserSummary;
  onClose: () => void;
  onUpdated: (user: AdminUserSummary, message: string) => void;
  onError: (message: string) => void;
}) {
  const [schoolCode, setSchoolCode] = useState(user.schoolCode ?? '');
  const [busy, setBusy] = useState<'school' | 'status' | null>(null);

  async function changeSchool() {
    const code = schoolCode.trim();
    if (!code) {
      onError('바꿀 학교 코드를 입력해 주세요.');
      return;
    }
    if (code === user.schoolCode) {
      onError('지금과 같은 학교 코드입니다.');
      return;
    }
    setBusy('school');
    try {
      const updated = await changeAdminUserSchool(user.username, { schoolCode: code });
      onUpdated(updated, `${user.username} 회원의 학교를 '${updated.schoolName}'(으)로 바꿨습니다.`);
    } catch (error) {
      onError(resolveErrorMessage(error, '학교를 바꾸지 못했습니다.'));
    } finally {
      setBusy(null);
    }
  }

  async function toggleActive() {
    const next = !user.active;
    if (!next && !window.confirm(`${user.username} 계정을 정지할까요? 정지된 회원은 로그인할 수 없습니다.`)) return;
    setBusy('status');
    try {
      const updated = await updateAdminUserStatus(user.username, { active: next });
      onUpdated(
        updated,
        next ? `${user.username} 계정을 다시 활성화했습니다.` : `${user.username} 계정을 정지했습니다.`,
      );
    } catch (error) {
      onError(resolveErrorMessage(error, '계정 상태를 바꾸지 못했습니다.'));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Panel
      title={user.name || user.username}
      description={`${ROLE_LABELS[user.role] ?? user.role} · ${user.username}`}
      actions={
        <Button size="sm" variant="ghost" onClick={onClose}>
          닫기
        </Button>
      }
      flush
    >
      <dl className="grid grid-cols-[72px_minmax(0,1fr)] gap-x-3 gap-y-2 p-4 text-[13px]">
        <dt className="text-gray-500">상태</dt>
        <dd>{user.active ? <Badge tone="success">활성</Badge> : <Badge tone="danger">정지</Badge>}</dd>
        <dt className="text-gray-500">학교</dt>
        <dd className="text-gray-900">{user.schoolName || '-'}</dd>
        <dt className="text-gray-500">학교 코드</dt>
        <dd className="font-mono text-xs text-gray-900">{user.schoolCode || '-'}</dd>
        <dt className="text-gray-500">지역</dt>
        <dd className="text-gray-900">{user.schoolRegion || '-'}</dd>
      </dl>

      <div className="flex flex-col gap-3 border-t border-gray-200 p-4">
        <Field label="학교 바꾸기" hint="학교 메뉴에서 코드를 확인할 수 있습니다. 변경은 관리자 작업 기록에 남습니다.">
          <Input
            value={schoolCode}
            onChange={(event) => setSchoolCode(event.target.value)}
            placeholder="학교 코드"
            className="font-mono"
            disabled={busy !== null}
          />
        </Field>
        <div className="flex justify-end">
          <Button size="sm" loading={busy === 'school'} disabled={busy !== null} onClick={() => void changeSchool()}>
            학교 변경
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-gray-200 p-4">
        <div>
          <p className="text-[13px] font-medium text-gray-900">{user.active ? '계정 정지' : '계정 활성화'}</p>
          <p className="text-xs text-gray-500">
            {user.active ? '로그인을 막습니다. 데이터는 지우지 않습니다.' : '다시 로그인할 수 있게 합니다.'}
          </p>
        </div>
        <Button
          size="sm"
          variant={user.active ? 'danger' : 'primary'}
          loading={busy === 'status'}
          disabled={busy !== null}
          onClick={() => void toggleActive()}
        >
          {user.active ? '정지' : '활성화'}
        </Button>
      </div>
    </Panel>
  );
}
