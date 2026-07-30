# 온도(Ondo) — React Frontend (FN)

Issue **#17-1** React scaffold. UI 기준: `DOCS/DESIGN/2026_UIUX_디자인가이드.md`, `DOCS/DESIGN/tokens.css`

## 요구 사항

- Node.js 20+
- BN(Spring Boot) `http://localhost:8081` — API 프록시 확인용

## 실행

```bash
cd FN
npm install
npm run dev
```

- React: http://localhost:5173
- `/api/*` 요청은 Vite proxy → `http://localhost:8081`

## 빌드

```bash
npm run build
npm run preview
```

빌드 결과: `FN/dist/`

## 폴더 구조

```
FN/
├── DOCS/DESIGN/          # UI/UX 가이드, tokens.css
├── src/
│   ├── api/              # fetch client, auth.api (골격)
│   ├── routes/           # React Router
│   ├── pages/            # placeholder 페이지
│   ├── components/       # ProductTile, layout
│   └── styles/           # global.css
├── vite.config.ts        # /api → 8081 proxy
└── package.json
```

## 환경 변수

`.env.example` 참고. 개발 시 proxy 사용이므로 `VITE_API_BASE`는 비워 둡니다.

## 다음 단계

| Issue | 내용 |
|-------|------|
| ~~#17-2~~ | ~~로그인, JWT, AuthProvider, 역할 라우팅~~ ✅ |
| #17-3 | BN 가입 REST API |
| #17-4 | React 회원가입 UI |
| #17-5~6 | 학생·교사 화면 이전 |

## 인증 (#17-2)

- `AuthProvider` + `useAuth()` — 세션 복구 (`/api/auth/me`), 로그인·로그아웃
- `RequireAuth` / `GuestRoute` — 역할별 보호 라우트
- 401 시 `/api/auth/refresh` 자동 재시도 (`api/client.ts`)
- 로그인 후 리다이렉트: STUDENT/TEACHER → `/home`, ADMIN → `/admin` (Thymeleaf와 동일)

## 배포 (예정)

React `build` → `BN/src/main/resources/static` 서빙 (JAR 단일 배포)
