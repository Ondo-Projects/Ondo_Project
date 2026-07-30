# 온도(Ondo) — React Frontend (FN)

Issue **#17-1** React scaffold · **#17-2** auth · **#17-4** join UI  
UI 기준: `DOCS/DESIGN/2026_UIUX_디자인가이드.md`, `DOCS/DESIGN/tokens.css`

## 요구 사항

- Node.js 20+
- BN(Spring Boot) `http://localhost:8081` — API 프록시·회원가입 테스트용

## 실행

```bash
cd FN
npm install
npm run dev
```

- React: http://localhost:5173
- `/api/*` 요청은 Vite proxy → `http://localhost:8081`

회원가입 QA: `DOCS/QA/issue-17-4-join-qa-checklist.md`

## 빌드

```bash
npm run build
npm run preview
```

빌드 결과: `FN/dist/`

## 폴더 구조

```
FN/
├── DOCS/
│   ├── DESIGN/           # UI/UX 가이드, tokens.css
│   └── QA/               # 화면별 QA 체크리스트
├── src/
│   ├── api/              # fetch client, auth, signup, school, email, sms
│   ├── auth/             # AuthProvider, GuestRoute, RequireAuth
│   ├── join/             # 회원가입 (#17-4)
│   │   ├── components/   # RoleSection, SchoolSearch, EmailVerification, …
│   │   ├── JoinForm.tsx
│   │   └── useJoinForm.ts
│   ├── routes/
│   ├── pages/
│   └── components/       # ProductTile, layout
├── vite.config.ts
└── package.json
```

## 환경 변수

`.env.example` 참고. 개발 시 proxy 사용이므로 `VITE_API_BASE`는 비워 둡니다.

## Issue 진행 상태

| Issue | 내용 | 상태 |
|-------|------|------|
| #17-1 | Vite + React scaffold | ✅ |
| #17-2 | 로그인, JWT, 역할 라우팅 | ✅ |
| #17-3 | BN `POST /api/auth/signup` | ✅ (BN) |
| #17-4 | React `/join` 회원가입 UI | ✅ (FN) |
| #17-5~6 | 학생·교사 화면 이전 | 예정 |

## 인증 (#17-2)

- `AuthProvider` + `useAuth()` — 세션 복구 (`/api/auth/me`), 로그인·로그아웃
- `RequireAuth` / `GuestRoute` — 역할별 보호 라우트
- 401 시 `/api/auth/refresh` 자동 재시도 (`api/client.ts`)
- 로그인 후: STUDENT/TEACHER → `/home`, ADMIN → `/admin`

## 회원가입 (#17-4)

- URL: `/join` (`GuestRoute` — 로그인 상태면 홈으로)
- 플로우: Thymeleaf `join.html`과 동일 (학교 → 프로필 → 인증 → 계정 → 약관)
- API: `/api/schools/search`, `/api/auth/username/check`, email/sms verify, `/api/auth/signup`
- 성공: `/login` + 성공 메시지 + 아이디 자동 입력
- QA: `DOCS/QA/issue-17-4-join-qa-checklist.md`

## 배포 (예정)

React `build` → `BN/src/main/resources/static` 서빙 (JAR 단일 배포)
