# Ondo UI (`FN/src/components/ui`)

공통 UI 레이어. 스타일은 `FN/DOCS/DESIGN/tokens.css` 변수만 사용합니다.

기준 문서: `FN/DOCS/DESIGN/2026_UIUX_디자인가이드.md`

전역 스타일: `FN/src/styles/ui.css` (`main.tsx`에서 import)

## 컴포넌트

| Export | 용도 |
|--------|------|
| `Btn` | primary / secondary / ghost / danger, size `default`(44px) / `student`(48px) |
| `Card` | 섹션 카드, `title`, `helper`, `titleMark`, `compact`, `interactive` |
| `Field` | 라벨 + 도움말 + 에러, `(필수)` 표기 |
| `Input` / `Textarea` / `Select` | 폼 컨트롤 (§5.3) |
| `Badge` | 역할·상태 뱃지 (§2.3, §5.5) |
| `Alert` | success / error / warning / info 피드백 |
| `Drawer` | backdrop, ESC, focus trap, safe area shell |
| `Skeleton` | 로딩 placeholder (§5.7), `SkeletonText` |
| `ToastProvider` / `useToast` | 3초 auto-dismiss 피드백 (§6.4) |

## 사용 예

```tsx
import { Alert, Btn, Card, Field, Input } from '../components/ui';

<Card compact>
  <Alert variant="success">저장했어요.</Alert>
  <form>
    <Field id="username" label="아이디" required>
      <Input name="username" autoComplete="username" />
    </Field>
    <Btn type="submit" variant="primary" size="student" fullWidth>
      로그인
    </Btn>
  </form>
</Card>
```

## 레거시 → UI 매핑 (Phase 1~4에서 점진 교체)

| Legacy class / 패턴 | UI 컴포넌트 |
|---------------------|-------------|
| `student-btn--primary`, `auth-submit`, `admin-btn--primary` | `<Btn variant="primary" size="student">` |
| `student-btn--secondary`, `admin-btn--secondary` | `<Btn variant="secondary">` |
| `student-btn--ghost` | `<Btn variant="ghost">` |
| `student-btn--danger`, `admin-btn--danger` | `<Btn variant="danger">` |
| `student-card`, `auth-card`, `admin-card` | `<Card>` / `<Card compact>` |
| `auth-field`, `student-field`, `join-field` | `<Field>` + `<Input>` 등 |
| `student-message--*`, `auth-message--*`, `admin-message--*` | `<Alert variant="…">` |
| `student-badge--*`, `admin-badge--*` | `<Badge variant="…">` |
| `home-announcement-drawer`, `admin-announcement-drawer` | `<Drawer>` compound API |

## Phase 5 (feature/design-a11y-polish)

- **Dark mode** — `tokens.css` dark 토큰 보강 (surface, semantic, badge, skeleton)
- **Skeleton** — `Skeleton`, `SkeletonText` + `AuthLoading` 카드형 스켈레톤
- **Toast** — `ToastProvider`, `useToast` (App 루트 연결), 관리자 성공 피드백 파일럿
- **CSS** — `#ffffff` → 토큰 치환, home/admin/teacher/page-header dark 보정

## 플랫폼 공지 종 알림 (`feature/platform-announcement-bell`)

- **전역** — 로그인 후 학생/교사/관리자 화면 우측 상단 🔔 (`AppLayout`, 학교 홈 제외)
- **학교 홈** — `SchoolTodayStrip` 「오늘의 학교 정보」 헤더 오른쪽에 🔔
- **패널** — 공지 목록 + `AnnouncementDetailDrawer` 상세
- **읽음** — `localStorage` 기준 미확인 건수 뱃지
- **메타** — `adminName` 대신 `온도` 표기 (DB 이름 깨짐 방지)
- **홈** — 본문 하단 `PlatformAnnouncementBoard` + `SchoolTodayStrip` 헤더 🔔

```tsx
const { showToast } = useToast();
showToast('저장했습니다.', 'success');
```

## Phase 1 (feature/design-auth-layout)

- **Auth** — `FindIdPage`, `ResetPasswordPage`, `WithdrawPage` + `LoginPage` ui 정리
- **Join** — `JoinField` → `Field`, 섹션별 `Input`/`Select`/`Btn`/`Alert`, `JoinForm` → `Card`
- **`auth.css` / `join.css`** — 레거시 field/submit/message/btn 규칙 제거

## Phase 4 (feature/design-home-admin)

- **Admin 전체** — `AdminSectionCard` → `Card`, 섹션별 `Btn` / `Field` / `Input` / `Select` / `Textarea` / `Badge` / `Alert`
- **AdminAnnouncementEditDrawer** — `Drawer` compound API
- **Home** — `HomePage` Alert, role block Card+Btn, 플랫폼 공지 → 전역 종 알림
- **`admin.css` / `home.css`** — 레거시 btn/field/card/message/badge 규칙 제거

## Phase 3 (feature/design-teacher)

- **교사 섹션 전체** — ui 컴포넌트 적용, `teacher.css` 레거시 규칙 제거

## Phase 2 (feature/design-student)

- **전체 학생 섹션** — `Card`, `Field`, `Input`, `Textarea`, `Select`, `Btn`, `Badge`, `Alert`
- **LoginPage** — `Card`, `Field`, `Input`, `Btn`, `Alert`, footer `Btn ghost`
- **`student.css`** — 레거시 btn/field/badge/card/message 규칙 제거, 도메인 전용 스타일만 유지

## Phase 0 파일럿 (적용 완료)

- **Auth:** `LoginPage` — `Card`, `Field`, `Input`, `Btn`, `Alert`
- **Alert:** `StudentHomePage` — 페이지 success/error 메시지
- **Drawer:** `AnnouncementDetailDrawer` — 공지 상세 shell

(Phase 0~5 완료)

## 규칙

- 새 화면·수정 시 가능하면 ui 컴포넌트 사용
- `ui.css`에 hex 하드코딩 금지 — tokens 변수만
- `:focus-visible`, `prefers-reduced-motion`은 tokens/global.css에 위임
- Drawer 내부 콘텐츠 전용 스타일은 도메인 CSS에 두고 shell만 `Drawer` 사용
