# React 통합 QA 결과 보고 (2026-07-30)

Epic **#17** React 전환 — `develop` 브랜치 기준 1차 통합 QA 결과입니다.  
환경: BN `8081` + FN `5173`, Windows 로컬.

---

## 1. 사전 조건

| 항목 | 결과 | 비고 |
|------|:----:|------|
| `npm run build` | ✅ | 2026-07-30 성공 |
| BN `bootRun` | ✅ | Tomcat 8081 |
| FN `npm run dev` | ✅ | Vite 5173 |
| MySQL / Redis | ✅ | BN 기동 정상 |

---

## 2. 정적 검증 (코드·앵커 Parity)

| 항목 | 결과 |
|------|:----:|
| 학생 `#section-*` ID ↔ BN `student.html` | ✅ |
| 교사 `TEACHER_SECTIONS` ↔ BN `teacher.html` | ✅ |
| 관리자 7개 섹션 컴포넌트 존재 | ✅ |
| `/join` 스킵 링크·`JoinErrorSummary`·`role="alert"` | ✅ |
| `BrandMark` — home/student/teacher/admin/login/join | ✅ |

---

## 3. 브라우저 QA (데스크톱)

### 3.1 로그인 / 로그아웃

| # | 시나리오 | 결과 |
|---|----------|:----:|
| L1 | admin 로그인 → `/admin` | ✅ |
| L2 | student01 로그인 → `/home` | ✅ |
| L3 | 로그아웃 → `/login` | ✅ |
| L4 | 로그인·회원가입 페이지 로고(`BrandMark size=auth`) | ✅ |

**테스트 계정:** `student01` / `password`, admin bootstrap 계정

### 3.2 `/admin` (#17-7)

| # | 시나리오 | 결과 |
|---|----------|:----:|
| A1 | 페이지 로드·7개 섹션 제목 표시 | ✅ |
| A2 | 회원 검색 → 목록(관리 버튼) | ✅ |
| A3 | 운영 현황·통계·로그 영역 렌더 | ✅ |
| A4 | 학교/건의 검색 UI | ⏳ | 수동 클릭 미완 — UI만 확인 |

### 3.3 `/home` + `/student` (#17-5)

| # | 시나리오 | 결과 |
|---|----------|:----:|
| H1 | 학생 `/home` — 인사·날씨·퀵링크 | ✅ |
| H2 | 「학생 홈 전체 보기」→ `/student` | ✅ |
| N1 | `/student` — 12개 섹션·오늘 할 일·퀵액션 | ✅ |
| N2 | 퀵액션 「마음」→ 마음 날씨 섹션 | ✅ |
| S1 | 급식/학사 — TEST001 학교 「연동 준비 중」 | ✅ | NEIS 미연동 학교 — 기대 동작 |
| S2 | 날씨 API 로드 | ✅ |
| S3 | 운영 건의 기존 2건 목록 | ✅ |

### 3.4 `/join` (#17-4)

| # | 시나리오 | 결과 |
|---|----------|:----:|
| J1 | 폼 전체 렌더 (6단계·약관) | ✅ |
| E1 | 빈 제출 → 검증 요약 + 학교 필드 포커스 | ✅ |
| T1~T8 | 교사 E2E 가입 | ⏳ | 이메일 인증 수동 필요 |
| S1~S4 | 학생 14+ E2E | ⏳ | 동일 |
| G1~G4 | 학생 14- E2E | ⏳ | SMS dev-mode 수동 필요 |

### 3.5 `/teacher` (#17-6)

| # | 시나리오 | 결과 |
|---|----------|:----:|
| T-* | 교사 홈 전체 | ⏳ | DB에 `gkgk04111` 등 TEACHER 있으나 **비밀번호 미확인** — browser E2E 보류 |

---

## 4. 모바일 3뷰포트 (SE / 12 / S20)

| 영역 | 결과 |
|------|:----:|
| join / student / teacher / admin / home | ⏳ | DevTools 수동 QA **미실시** — 체크리스트 파일 참고 |

---

## 5. 발견 사항 (이슈 후보)

| 심각도 | 내용 | 제안 |
|--------|------|------|
| 낮음 | `/student` 페이지 `document.title`이 「온도」만 표시 (`usePageTitle` 미적용?) | `StudentHomePage`에 title hook 추가 |
| 정보 | TEST001 학교 급식·학사 「연동 준비 중」 | NEIS 매핑 학교로 재테스트 권장 |
| 정보 | 교사 E2E — 로컬 DB 교사 계정 비밀번호 필요 | QA용 teacher 시드 또는 비밀번호 공유 |

**블로커:** 없음 (배포 통합 전 필수 수정 사항 없음)

---

## 6. 체크리스트 파일

| Issue | 문서 | 1차 QA |
|-------|------|--------|
| #17-4 join | `issue-17-4-join-qa-checklist.md` | 부분 ✅ |
| #17-5 student | `issue-17-5-student-qa-checklist.md` | 부분 ✅ |
| #17-6 teacher | `issue-17-6-teacher-qa-checklist.md` | ⏳ |
| #17-7 admin | `issue-17-7-admin-qa-checklist.md` | **신규** · 부분 ✅ |
| #14 home | `BN/docs/issue-14-common-home-qa-checklist.md` | 부분 ✅ |

---

## 7. Definition of Done (통합 QA)

- [x] `npm run build` 성공
- [x] 앵커 ID Parity (student/teacher)
- [x] admin·student·join 핵심 플로우 smoke test
- [ ] **모바일 3뷰포트** 전 페이지 — **사용자 DevTools 수동**
- [ ] **join E2E 3종** (교사 / 학생14+ / 학생14-)
- [ ] **teacher E2E** 전체
- [ ] **admin A3~A10** 상세 (학교 변경·건의 답변 등)

---

## 8. 다음 액션

1. **모바일 QA** — 위 체크리스트 C·M 항목 DevTools로 1회씩
2. **join E2E** — `ondo.mail.dev-mode=true` / `ondo.solapi.dev-mode=true` 환경에서 T·S·G 시리즈
3. **teacher QA** — `gkgk04111` 등 계정 비밀번호 확인 후 `#17-6` 실행
4. 통합 QA Pass 후 → **#17 배포 통합** (FN build → BN static)
