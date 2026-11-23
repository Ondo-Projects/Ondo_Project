# 온도 UI v2 디자인 규칙

새 화면은 `src/ds`(디자인 시스템 컴포넌트)와 Tailwind CSS로 만듭니다. 기존 화면(CSS 파일 기반)은 단계적으로 옮깁니다.

견본 화면: `npm run dev` → http://localhost:5173/ui-preview (개발 모드에서만 열림)

## 1. 화면별 방향

| 화면 | 방향 |
|------|------|
| 교사 대시보드, 관리자 콘솔 | 고밀도 실무형 — 표(Table)와 구역 나누기(Panel, StatStrip) 중심 |
| 첫 화면(랜딩), 로그인·회원가입 | 절제된 미니멀 — 좌측 정렬 글 + 우측 실제 화면 |
| 학생 홈, 마이페이지·설정 (모바일) | 네이티브 설정 앱 — `bg-gray-100` 위 흰색 그룹 리스트(ListGroup) |

## 2. 금지 규칙

- 보라·청록·분홍 그라데이션, 메시 그라데이션, 빛 번짐(glow), 흐린 원형 장식 금지
- 그림자(`shadow-*`) 금지 → `border border-gray-200` 1px 선으로 구분
- 모서리는 `rounded-md`(버튼·입력) / `rounded-lg`(구역·표)까지만
- 제목·카드 제목에 이모지 금지
- 마우스를 올렸을 때 떠오르거나 튀는 애니메이션 금지 → `transition-colors duration-150` 수준의 은은한 변화만
- 화면 전체를 카드로 덮지 않기 → 표, 구역 나누기, 세로선 구분 사용

## 3. 색

| 용도 | 클래스 |
|------|--------|
| 배경 | `bg-white`, `bg-gray-50/50`(대시보드 바탕), `bg-gray-100`(모바일 설정 바탕) |
| 글자 | `text-gray-900`(본문), `text-gray-500`(보조), `text-gray-400`(셰브론·비활성) |
| 선 | `border-gray-200`, 리스트 행 구분 `divide-gray-100` |
| 포인트 (하나만) | `blue-700` (#1D4ED8, hover `blue-800`) — 주요 버튼, 선택된 탭, 링크, 작은 제목(eyebrow), 기능 아이콘. 토글 켜짐·그래프·포커스는 `blue-600`. 넓은 면은 `blue-50` 한 구역까지만 |
| 상태 (배지·오류에만) | `Badge tone="warning"`(대기) / `"success"`(완료) / `"danger"`(오류·확인 필요) |

## 4. 글자

- 기본 14px(`text-sm`), 표 13px(`text-[13px]`), 보조 12px(`text-xs`), 배지 11px
- 페이지 제목 `text-xl font-semibold tracking-tight`, 랜딩 H1 은 `tracking-tight font-semibold`
- 숫자는 `tabular-nums` (표·지표 자리 맞춤)

## 5. 아이콘

- `lucide-react`만 사용, 크기 16px(버튼·표) / 18px(리스트 행)
- 꼭 필요한 곳에만 — 모든 행·제목에 아이콘을 붙이지 않음
- 장식 아이콘에는 `aria-hidden`

## 6. 문구

- 실제 서비스 라벨로: "답변 대기 상담", "이번 주 기분 기록", "학급 공지 작성"
- 모호한 문구("혁신적인 상담 경험") 대신 구체적으로: "상담 신청부터 담임 답변까지 한 화면에서"
- 근거 없는 숫자(만족도 98% 등) 쓰지 않기

## 7. 컴포넌트 (`import { ... } from '../ds'`)

| 컴포넌트 | 용도 |
|----------|------|
| `Button` | `variant`: primary(포인트) / secondary(기본) / ghost / danger, `size`: sm(32px) / md(36px), `icon`, `loading` |
| `Input`, `Textarea`, `Select` | 높이 36px, 포커스 시 테두리 blue-600 |
| `Field` | 라벨 + 입력 + 도움말/오류 (aria 자동 연결) |
| `Badge` | 상태 표시, `dot` 으로 작은 점. `tone`: neutral / solid / info(진행 중) / success / warning / danger |
| `Table`, `THead`, `TBody`, `Tr`, `Th`, `Td` | 행 높이 40px, `footer` 로 "총 N건" 줄 |
| `Panel` | 1px 테두리 구역, 제목·설명·우측 버튼, `flush` 로 여백 없이 |
| `PageTitle` | 페이지 제목 줄 |
| `StatStrip` | 핵심 지표를 세로선으로 나눈 한 줄 |
| `Tabs` | 밑줄형 탭, 건수 표시 |
| `EmptyState`, `Skeleton` | 빈 상태, 로딩 |
| `ListGroup`, `ListRow` | 모바일 설정 그룹 리스트, 셰브론·값·토글 |
| `Toggle` | 32×18 작은 스위치 |
| `Notice` | 한 줄 결과·오류 메시지 (`tone`: info / success / danger, `onClose`) |
| `ConsoleShell` (`src/v2/shell`) | 교사·관리자 화면 틀: 상단 바 + 왼쪽 메뉴(모바일은 가로 탭) + 본문 |

## 8. 기존 화면과 함께 쓰는 동안의 규칙

- 새 화면의 가장 바깥 요소에 반드시 `className="ondo-ui ..."` 를 붙입니다. (글꼴·초기화가 이 안에서만 적용됨)
- 새 화면 파일은 `src/v2`, 새 공통 컴포넌트는 `src/ds` 에 둡니다. Tailwind 는 이 두 폴더만 읽습니다.
- 기존 `tokens.css` 와 이름이 겹치는 변수(`--radius-md` 등)는 `ds.css` 에서 `.ondo-ui` 안에서만 되돌려 놓았습니다. 기존 화면을 모두 옮긴 뒤 `tokens.css` 와 함께 정리합니다.
