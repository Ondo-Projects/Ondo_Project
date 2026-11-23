import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Bell,
  CalendarDays,
  ClipboardList,
  FileLock2,
  KeyRound,
  MessagesSquare,
  NotebookPen,
  ScrollText,
  ShieldCheck,
  SmilePlus,
  type LucideIcon,
} from 'lucide-react';
import { Badge, StatStrip, TBody, THead, Table, Td, Th, Tr, cn } from '../ds';
import { usePageTitle } from '../hooks/usePageTitle';
import { PATHS } from '../routes/paths';

/**
 * 로그인하지 않은 방문자가 처음 보는 화면 (/)
 * 대상: 도입을 결정하는 교사·학교 (학생은 "학생으로 시작하기")
 * 문구 규칙: 실제로 있는 기능만, 근거 없는 수치 금지 — FN/DOCS/DESIGN/ui-v2-guide.md
 */

interface FeatureItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

const TEACHER_FEATURES: FeatureItem[] = [
  {
    icon: MessagesSquare,
    title: '상담 답변 관리',
    description: '진로·교우관계·학업·가정 등으로 나뉜 상담을 대기·확정·완료로 나눠 보고, 바로 답변합니다.',
  },
  {
    icon: BarChart3,
    title: '학급 기분 요약',
    description: '학생들이 남긴 하루 기분 기록을 주간 분포와 참여 인원으로 확인합니다.',
  },
  {
    icon: NotebookPen,
    title: '사전상담 프로필',
    description: '상담 전에 학생이 작성한 장래 희망, 관심사, 고민을 미리 읽고 상담을 준비합니다.',
  },
  {
    icon: KeyRound,
    title: '초대코드로 학급 연결',
    description: '초대코드를 나눠 주면 학생이 담임으로 연결되고, 상담과 학급 공지가 이어집니다.',
  },
];

const STUDENT_FEATURES: FeatureItem[] = [
  {
    icon: ClipboardList,
    title: '상담 신청',
    description: '유형을 고르고 고민을 적으면 담임 선생님에게 전달되고, 답변이 오면 바로 확인합니다.',
  },
  {
    icon: SmilePlus,
    title: '오늘의 기분 기록',
    description: '하루 한 번 기분을 남기면 지난 기록을 주간 단위로 돌아볼 수 있습니다.',
  },
  {
    icon: CalendarDays,
    title: '급식·시간표·학사일정',
    description: 'NEIS 정보를 불러와 오늘의 급식과 시간표, 다가오는 학교 일정을 한 화면에 보여 줍니다.',
  },
  {
    icon: Bell,
    title: '학급 공지와 운영 건의',
    description: '담임 선생님의 공지를 받고, 서비스에 바라는 점은 운영팀에 건의할 수 있습니다.',
  },
];

const TRUST_ITEMS: FeatureItem[] = [
  {
    icon: ShieldCheck,
    title: '교사는 학교 이메일로 확인',
    description: '교사 가입은 교육청·학교 도메인 이메일 인증을 거친 계정만 가능합니다.',
  },
  {
    icon: FileLock2,
    title: '연락처 암호화 저장',
    description: '사전상담에 적은 학생·보호자 연락처는 AES-256으로 암호화해 저장합니다.',
  },
  {
    icon: ScrollText,
    title: '열람 기록 관리',
    description: '상담 글과 사전상담 프로필을 누가 언제 열람했는지 기록으로 남깁니다.',
  },
];

export default function LandingPage() {
  usePageTitle('온도 — 학교 상담·학교생활 플랫폼');

  return (
    <div className="ondo-ui min-h-screen bg-white">
      <SiteHeader />

      <main>
        {/* Hero — 좌측 글, 우측 실제 화면 */}
        <section className="border-b border-gray-200">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-center lg:py-24">
            <div className="max-w-xl">
              <p className="text-[13px] font-medium text-blue-700">중·고등학교 상담·학교생활 플랫폼</p>
              <h1 className="mt-4 text-4xl leading-[1.15] font-semibold tracking-tight text-gray-900 sm:text-5xl">
                상담 신청부터
                <br />
                <span className="text-blue-700">담임 답변까지,</span>
                <br />
                한 화면에서.
              </h1>
              <p className="mt-6 text-base leading-relaxed text-gray-600">
                학생은 휴대폰으로 상담을 신청하고 하루의 기분을 남깁니다. 담임 선생님은 답변을 기다리는 상담과 학급의
                분위기를 표 하나로 확인합니다.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-2">
                <Link
                  to={`${PATHS.JOIN}?role=TEACHER`}
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-medium text-white transition-colors duration-150 hover:bg-blue-800"
                >
                  교사로 시작하기
                  <ArrowRight size={16} aria-hidden />
                </Link>
                <Link
                  to={`${PATHS.JOIN}?role=STUDENT`}
                  className="inline-flex h-10 items-center rounded-md border border-gray-200 bg-white px-4 text-sm font-medium text-gray-900 transition-colors duration-150 hover:bg-gray-50"
                >
                  학생으로 시작하기
                </Link>
              </div>
              <p className="mt-4 text-[13px] text-gray-500">
                이미 계정이 있나요?{' '}
                <Link to={PATHS.LOGIN} className="font-medium text-blue-700 underline-offset-4 hover:underline">
                  로그인
                </Link>
              </p>
            </div>

            <ProductViewer />
          </div>
        </section>

        {/* 교사·학생 기능 — 에디토리얼 2단 */}
        <FeatureSection
          id="teacher"
          eyebrow="교사"
          title="담임 선생님이 매일 확인하는 것"
          description="학급 학생과의 상담, 학급 분위기, 공지를 한곳에서 관리합니다."
          items={TEACHER_FEATURES}
        />
        <FeatureSection
          id="student"
          eyebrow="학생"
          title="학생이 휴대폰으로 쓰는 것"
          description="로그인 한 번으로 상담과 오늘의 학교생활을 확인합니다."
          items={STUDENT_FEATURES}
          muted
        />

        {/* 신뢰·개인정보 */}
        <section className="border-b border-gray-200">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="max-w-xl">
              <p className="text-[13px] font-medium text-blue-700">개인정보 보호</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
                학생의 이야기를 다루기 때문에, 기본부터 지킵니다.
              </h2>
            </div>
            <dl className="mt-10 grid gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 md:grid-cols-3">
              {TRUST_ITEMS.map((item) => (
                <div key={item.title} className="bg-white p-5">
                  <dt className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <item.icon size={16} className="text-blue-700" aria-hidden />
                    {item.title}
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-gray-600">{item.description}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* 마무리 CTA */}
        <section className="bg-blue-50">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-16 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-gray-900">우리 반에서 바로 시작하세요.</h2>
              <p className="mt-2 text-sm text-gray-600">
                교사로 가입한 뒤 초대코드를 나눠 주면 학생들이 학급으로 연결됩니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to={`${PATHS.JOIN}?role=TEACHER`}
                className="inline-flex h-10 items-center rounded-md bg-blue-700 px-4 text-sm font-medium text-white transition-colors duration-150 hover:bg-blue-800"
              >
                교사로 시작하기
              </Link>
              <Link
                to={PATHS.LOGIN}
                className="inline-flex h-10 items-center rounded-md border border-gray-200 bg-white px-4 text-sm font-medium text-gray-900 transition-colors duration-150 hover:bg-gray-50"
              >
                로그인
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-gray-50/50">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <span>온도 · 중·고등학교 상담·학교생활 플랫폼</span>
          <nav className="flex gap-4" aria-label="바닥글">
            <Link to={PATHS.LOGIN} className="hover:text-gray-900">로그인</Link>
            <Link to={PATHS.JOIN} className="hover:text-gray-900">회원가입</Link>
            <Link to={PATHS.FIND_ID} className="hover:text-gray-900">아이디 찾기</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link to={PATHS.ROOT} className="flex items-center gap-2" aria-label="온도 처음 화면">
          <img src="/ondo-logo.png" alt="" width={24} height={24} className="h-6 w-6" />
          <span className="text-[15px] font-semibold tracking-tight">온도</span>
        </Link>
        <nav className="flex items-center gap-1" aria-label="주 메뉴">
          <a href="#teacher" className="hidden h-8 items-center rounded-md px-3 text-[13px] text-gray-600 hover:text-gray-900 sm:inline-flex">
            교사
          </a>
          <a href="#student" className="hidden h-8 items-center rounded-md px-3 text-[13px] text-gray-600 hover:text-gray-900 sm:inline-flex">
            학생
          </a>
          <Link
            to={PATHS.LOGIN}
            className="inline-flex h-8 items-center rounded-md px-3 text-[13px] font-medium text-gray-900 hover:bg-gray-100"
          >
            로그인
          </Link>
          <Link
            to={PATHS.JOIN}
            className="inline-flex h-8 items-center rounded-md bg-blue-700 px-3 text-[13px] font-medium text-white hover:bg-blue-800"
          >
            회원가입
          </Link>
        </nav>
      </div>
    </header>
  );
}

function FeatureSection({
  id,
  eyebrow,
  title,
  description,
  items,
  muted = false,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  items: FeatureItem[];
  muted?: boolean;
}) {
  return (
    <section id={id} className={cn('scroll-mt-14 border-b border-gray-200', muted && 'bg-gray-50/50')}>
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="max-w-sm">
          <p className="text-[13px] font-medium text-blue-700">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">{title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">{description}</p>
        </div>
        <ul className="divide-y divide-gray-200 border-y border-gray-200">
          {items.map((item) => (
            <li key={item.title} className="grid grid-cols-[20px_minmax(0,1fr)] gap-x-4 py-5 sm:grid-cols-[20px_180px_minmax(0,1fr)]">
              <item.icon size={18} className="mt-0.5 text-blue-700" aria-hidden />
              <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
              <p className="col-start-2 mt-1 text-sm leading-relaxed text-gray-600 sm:col-start-3 sm:mt-0">
                {item.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** 우측 제품 화면 — 실제 컴포넌트로 그린 교사 대시보드 예시 (이미지 아님) */
function ProductViewer() {
  const rows = [
    { student: '이서준', type: '진로', title: '이과·문과 선택 상담 요청', status: 'waiting', date: '08:41' },
    { student: '김하린', type: '교우관계', title: '모둠 활동 중 갈등이 있어요', status: 'waiting', date: '어제' },
    { student: '박도윤', type: '학업', title: '수학 성적이 계속 떨어져요', status: 'confirmed', date: '어제' },
    { student: '최지아', type: '가정', title: '집중이 잘 안 됩니다', status: 'done', date: '11.21' },
  ];

  return (
    <figure className="min-w-0" aria-label="교사 대시보드 화면 예시">
      <div className="pointer-events-none overflow-hidden rounded-lg border border-gray-200 bg-gray-50/50 select-none" aria-hidden>
        <div className="flex h-9 items-center justify-between border-b border-gray-200 bg-white px-3">
          <span className="text-xs font-medium text-gray-900">상담 관리</span>
          <span className="font-mono text-[11px] text-gray-400">ondo.ai.kr/teacher</span>
        </div>
        <div className="flex flex-col gap-3 p-3">
          <StatStrip
            items={[
              { label: '대기 중인 상담', value: 2 },
              { label: '이번 주 기분 기록', value: '26/28' },
              { label: '사전상담 미작성', value: 3 },
            ]}
          />
          <Table>
            <THead>
              <tr>
                <Th>학생</Th>
                <Th className="hidden sm:table-cell">유형</Th>
                <Th>제목</Th>
                <Th>상태</Th>
                <Th align="right">접수</Th>
              </tr>
            </THead>
            <TBody>
              {rows.map((row) => (
                <Tr key={row.student}>
                  <Td className="whitespace-nowrap">{row.student}</Td>
                  <Td muted className="hidden whitespace-nowrap sm:table-cell">{row.type}</Td>
                  <Td className="max-w-32 truncate sm:max-w-44">{row.title}</Td>
                  <Td>
                    {row.status === 'waiting' ? (
                      <Badge tone="warning" dot>대기</Badge>
                    ) : row.status === 'confirmed' ? (
                      <Badge tone="info" dot>확정</Badge>
                    ) : (
                      <Badge tone="success" dot>완료</Badge>
                    )}
                  </Td>
                  <Td muted numeric className="whitespace-nowrap">{row.date}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </div>
      </div>
      <figcaption className="mt-3 text-xs text-gray-500">담임 선생님 화면 — 예시 데이터</figcaption>
    </figure>
  );
}
