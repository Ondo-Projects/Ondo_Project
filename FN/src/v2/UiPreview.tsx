import { useState } from 'react';
import {
  Bell,
  ChevronLeft,
  Download,
  KeyRound,
  LogOut,
  Megaphone,
  PenLine,
  School,
  Search,
  UserRound,
  UserX,
  Users,
} from 'lucide-react';
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Input,
  ListGroup,
  ListRow,
  PageTitle,
  Panel,
  Select,
  StatStrip,
  TBody,
  THead,
  Table,
  Tabs,
  Td,
  Textarea,
  Th,
  Toggle,
  Tr,
} from '../ds';

/**
 * 새 디자인 시스템 견본 화면 — 개발 모드에서만 /ui-preview 로 열립니다.
 * 실제 데이터가 아닌 예시 값입니다.
 */

type CounselTab = 'all' | 'waiting' | 'answered';

const COUNSEL_ROWS = [
  { id: 1, student: '이서준', number: 7, type: '진로', title: '이과·문과 선택 상담 요청', status: 'waiting', date: '11.23 08:41' },
  { id: 2, student: '김하린', number: 3, type: '교우관계', title: '모둠 활동 중 갈등이 있어요', status: 'waiting', date: '11.22 21:10' },
  { id: 3, student: '박도윤', number: 12, type: '학업', title: '수학 성적이 계속 떨어져요', status: 'answered', date: '11.22 16:05' },
  { id: 4, student: '최지아', number: 19, type: '가정', title: '집중이 잘 안 됩니다', status: 'answered', date: '11.21 19:32' },
  { id: 5, student: '정우진', number: 22, type: '진로', title: '동아리 변경 가능할까요', status: 'waiting', date: '11.21 13:18' },
] as const;

const MOOD_ROWS = [
  { label: '좋아요', count: 14 },
  { label: '보통이에요', count: 9 },
  { label: '힘들어요', count: 3 },
  { label: '기록 안 함', count: 2 },
];

export default function UiPreview() {
  const [tab, setTab] = useState<CounselTab>('all');
  const [answerAlert, setAnswerAlert] = useState(true);
  const [noticeAlert, setNoticeAlert] = useState(false);

  const rows = COUNSEL_ROWS.filter((row) => tab === 'all' || row.status === tab);
  const moodTotal = MOOD_ROWS.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="ondo-ui min-h-screen bg-gray-50/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500">온도 디자인 시스템</p>
            <h1 className="text-lg font-semibold tracking-tight">컴포넌트 견본</h1>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge>기본</Badge>
            <Badge tone="solid">강조</Badge>
            <Badge tone="warning" dot>답변 대기</Badge>
            <Badge tone="success" dot>답변 완료</Badge>
            <Badge tone="danger" dot>확인 필요</Badge>
          </div>
        </header>

        {/* ① 교사 대시보드 (고밀도) */}
        <section className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6">
          <PageTitle
            title="상담 관리"
            description="온도중학교 3학년 2반 · 학생 28명"
            actions={
              <>
                <Button size="sm" icon={<Download size={16} aria-hidden />}>
                  내보내기
                </Button>
                <Button size="sm" variant="primary" icon={<Megaphone size={16} aria-hidden />}>
                  학급 공지 작성
                </Button>
              </>
            }
          />

          <StatStrip
            items={[
              { label: '답변 대기 상담', value: 3, hint: '오늘 접수 1건' },
              { label: '이번 주 기분 기록', value: '26/28', hint: '참여율 93%' },
              { label: '확인 안 한 건의', value: 2 },
              { label: '사전상담 작성', value: '19명', hint: '미작성 9명' },
            ]}
          />

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="flex min-w-0 flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Tabs<CounselTab>
                  value={tab}
                  onChange={setTab}
                  items={[
                    { value: 'all', label: '전체', count: COUNSEL_ROWS.length },
                    { value: 'waiting', label: '답변 대기', count: 3 },
                    { value: 'answered', label: '답변 완료', count: 2 },
                  ]}
                  className="flex-1"
                />
                <div className="relative w-56">
                  <Search size={16} className="absolute top-1/2 left-2.5 -translate-y-1/2 text-gray-400" aria-hidden />
                  <Input placeholder="학생 이름·제목 검색" className="h-8 pl-8 text-[13px]" />
                </div>
              </div>

              <Table
                footer={
                  <>
                    <span>총 {rows.length}건</span>
                    <span>최근 14일</span>
                  </>
                }
              >
                <THead>
                  <tr>
                    <Th>학생</Th>
                    <Th>유형</Th>
                    <Th>제목</Th>
                    <Th>상태</Th>
                    <Th align="right">접수</Th>
                  </tr>
                </THead>
                <TBody>
                  {rows.map((row) => (
                    <Tr key={row.id} interactive>
                      <Td className="whitespace-nowrap">
                        {row.student}
                        <span className="ml-1.5 text-gray-400 tabular-nums">{row.number}번</span>
                      </Td>
                      <Td muted>{row.type}</Td>
                      <Td className="max-w-80 truncate">{row.title}</Td>
                      <Td>
                        {row.status === 'waiting' ? (
                          <Badge tone="warning" dot>답변 대기</Badge>
                        ) : (
                          <Badge tone="success" dot>답변 완료</Badge>
                        )}
                      </Td>
                      <Td muted numeric className="whitespace-nowrap">{row.date}</Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </div>

            <div className="flex flex-col gap-4">
              <Panel title="이번 주 기분 기록" description={`응답 ${moodTotal}명`} flush>
                <ul className="divide-y divide-gray-100">
                  {MOOD_ROWS.map((row) => (
                    <li key={row.label} className="flex items-center gap-3 px-4 py-2.5 text-[13px]">
                      <span className="w-20 shrink-0 text-gray-700">{row.label}</span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <span
                          className="block h-full rounded-full bg-slate-900"
                          style={{ width: `${Math.round((row.count / moodTotal) * 100)}%` }}
                        />
                      </span>
                      <span className="w-6 shrink-0 text-right text-gray-900 tabular-nums">{row.count}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
              <Panel title="학급 공지" actions={<Button size="sm" variant="ghost">전체 보기</Button>} flush>
                <EmptyState title="이번 주 등록한 공지가 없어요" description="중요한 일정은 학급 공지로 알려 주세요." />
              </Panel>
            </div>
          </div>
        </section>

        {/* 입력 폼 */}
        <section className="grid gap-4 lg:grid-cols-2">
          <Panel title="학급 공지 작성" description="학급 학생 모두에게 보입니다">
            <form className="flex flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
              <Field label="제목" required>
                <Input placeholder="예: 12월 2일 체육복 지참" />
              </Field>
              <Field label="공개 대상" hint="선택한 학생만 볼 수 있어요">
                <Select defaultValue="all">
                  <option value="all">3학년 2반 전체</option>
                  <option value="some">일부 학생</option>
                </Select>
              </Field>
              <Field label="내용" error="내용을 입력해 주세요.">
                <Textarea placeholder="학생들에게 전할 내용을 적어 주세요." />
              </Field>
              <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
                <Button variant="ghost">취소</Button>
                <Button variant="primary" type="submit" icon={<PenLine size={16} aria-hidden />}>
                  등록
                </Button>
              </div>
            </form>
          </Panel>

          <Panel title="버튼">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                <Button variant="primary">저장</Button>
                <Button>취소</Button>
                <Button variant="ghost">더 보기</Button>
                <Button variant="danger">상담 삭제</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="primary">답변 등록</Button>
                <Button size="sm" icon={<Users size={16} aria-hidden />}>학생 초대</Button>
                <Button size="sm" loading>저장 중</Button>
                <Button size="sm" disabled>사용 불가</Button>
              </div>
            </div>
          </Panel>
        </section>

        {/* ③ 모바일 설정 (그룹 리스트) */}
        <section className="flex flex-col items-start gap-3">
          <p className="text-xs font-medium text-gray-500">모바일 설정 화면 (375px)</p>
          <div className="w-[375px] overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
            <div className="flex h-12 items-center gap-1 border-b border-gray-200 bg-white px-2">
              <Button variant="ghost" size="sm" aria-label="뒤로" className="px-1.5">
                <ChevronLeft size={18} aria-hidden />
              </Button>
              <h2 className="text-[15px] font-semibold">설정</h2>
            </div>
            <div className="flex flex-col gap-6 px-4 py-5">
              <ListGroup title="내 정보">
                <ListRow icon={<UserRound size={18} aria-hidden />} label="이서준" description="student_seojun" onClick={() => {}} />
                <ListRow icon={<School size={18} aria-hidden />} label="학교" value="온도중학교" onClick={() => {}} />
                <ListRow label="학년·반·번호" value="3학년 2반 7번" onClick={() => {}} />
              </ListGroup>

              <ListGroup title="알림" footer="알림은 이 기기에서만 적용돼요.">
                <ListRow
                  icon={<Bell size={18} aria-hidden />}
                  label="상담 답변 알림"
                  trailing={<Toggle checked={answerAlert} onChange={setAnswerAlert} label="상담 답변 알림" />}
                />
                <ListRow
                  label="학급 공지 알림"
                  trailing={<Toggle checked={noticeAlert} onChange={setNoticeAlert} label="학급 공지 알림" />}
                />
              </ListGroup>

              <ListGroup title="앱">
                <ListRow label="시작 화면" value="내 홈" onClick={() => {}} />
                <ListRow label="담임 선생님" value="김온도" trailing={<Badge tone="success">연결됨</Badge>} />
              </ListGroup>

              <ListGroup title="계정">
                <ListRow icon={<KeyRound size={18} aria-hidden />} label="비밀번호 변경" onClick={() => {}} />
                <ListRow icon={<LogOut size={18} aria-hidden />} label="로그아웃" onClick={() => {}} />
                <ListRow icon={<UserX size={18} aria-hidden />} label="회원 탈퇴" destructive onClick={() => {}} />
              </ListGroup>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
