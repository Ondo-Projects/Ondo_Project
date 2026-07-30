# Issue #17-6 — React `/teacher` QA 체크리스트

React 교사 홈(`FN/src/teacher/`) 수동 QA용입니다.  
Thymeleaf `teacher.html` QA는 BN 문서를 참고합니다.

## 사전 조건

| 항목 | 확인 |
|------|------|
| BN 실행 | `cd BN && .\gradlew.bat bootRun` → `http://localhost:8081` |
| FN 실행 | `cd FN && npm run dev` → `http://localhost:5173` |
| 선행 이슈 | `#17-2` auth, `#17-5` `/student` merge(또는 동일 패턴) |
| 빌드 | `cd FN && npm run build` 성공 |
| 계정 | 교사(TEACHER) 계정 + 담당 학생(선택) |

## 뷰포트 (모바일)

Chrome DevTools 디바이스 툴바(Ctrl+Shift+M):

| 프리셋 | 해상도 |
|--------|--------|
| iPhone SE | 375 × 667 |
| iPhone 12 | 390 × 844 |
| Galaxy S20 | 360 × 800 |

**합격 기준:** 가로 스크롤 없음, 터치 영역 ≥ 44px, 주요 콘텐츠 잘림 없음

---

## 공통 UI / A11y

| # | 항목 | SE | 12 | S20 | 비고 |
|---|------|:--:|:--:|:---:|------|
| C1 | `/teacher` 가로 스크롤 없음 | ☐ | ☐ | ☐ | |
| C2 | 퀵액션·CTA·필터 칩 ≥ 44px | ☐ | ☐ | ☐ | |
| C3 | 성공/오류 메시지 `role="alert"` / `role="status"` | ☐ | ☐ | ☐ | |
| C4 | `:focus-visible` 링 표시 | ☐ | ☐ | ☐ | |
| C5 | `tokens.css` 기반 카드·버튼 스타일 적용 | ☐ | ☐ | ☐ | |

---

## 내비게이션 / 앵커 (#17-6 step 5)

| # | 시나리오 | DOM id | Pass |
|---|----------|--------|:----:|
| N1 | `/home` → 「교사 홈 전체 보기」→ `/teacher` | — | ☐ |
| N2 | `/home` 퀵링크 **상담** → `/teacher#postList` 스크롤 | `postList` | ☐ |
| N3 | `/home` 퀵링크 **마음** → `/teacher#moodSummaryList` | `moodSummaryList` | ☐ |
| N4 | `/home` 퀵링크 **사전카드** → `/teacher#preCounselSummaryList` | `preCounselSummaryList` | ☐ |
| N5 | `/teacher` 퀵액션 → `#notificationSettingsCard` | `notificationSettingsCard` | ☐ |
| N6 | `/teacher` 퀵액션 → `#noticeList` | `noticeList` | ☐ |
| N7 | `/teacher` 퀵액션 → `#section-suggestion` | `section-suggestion` | ☐ |
| N8 | 오늘 요약 **운영 건의** 카드 → `#section-suggestion` | `section-suggestion` | ☐ |

**앵커 상수:** `FN/src/teacher/constants.ts` → `TEACHER_SECTIONS` (BN `teacher.html` id와 동일)

---

## 섹션별 기능 (E2E)

| # | 섹션 | 시나리오 | Pass |
|---|------|----------|:----:|
| S1 | SMS 알림 | 번호·수신 동의 저장 → ready 상태 | ☐ |
| S2 | 오늘 확인 | 미확인/대기/사전카드/건의 요약 숫자 표시 | ☐ |
| S3 | 초대 코드 | 조회·복사·재발급 | ☐ |
| S4 | 상담 목록 | 필터(전체/대기/확정/완료/취소) | ☐ |
| S5 | 상담 상세 | 열람 → 미확인 감소, 상태 변경, 답변 등록 | ☐ |
| S6 | 마음 날씨 | 오늘 목록 / 주간(7일) 탭·분포·학생별 기록 | ☐ |
| S7 | 사전 상담 | 학생 목록 → 미작성 안내 / 작성완료 상세 열람 | ☐ |
| S8 | 알림판 | 알림 등록 → 목록 → 삭제 확인 | ☐ |
| S9 | 운영 건의 | 등록·목록·상세·OPEN 수정/삭제·관리자 답변 | ☐ |

---

## 모바일 UX

| # | 항목 | SE | 12 | S20 |
|---|------|:--:|:--:|:---:|
| M1 | 헤더·액션 버튼 wrap | ☐ | ☐ | ☐ |
| M2 | 상담 목록 터치 → 상세, 900px↓ 상세로 스크롤 | ☐ | ☐ | ☐ |
| M3 | 사전카드 선택 → 900px↓ `#preCounselDetailPanel` 스크롤 | ☐ | ☐ | ☐ |
| M4 | 주간 마음 7일 그리드 가로 스크롤 | ☐ | ☐ | ☐ |
| M5 | 상담 2열 레이아웃(900px↑) / 1열(모바일) | ☐ | ☐ | ☐ |

---

## 완료 조건 (#17-6)

- [ ] BN `teacher.html`과 **동일 섹션·앵커 ID** (`TEACHER_SECTIONS`)
- [ ] `/home` 교사 퀵링크 3종(N2–N4) Pass
- [ ] 위 E2E·내비게이션 체크리스트 Pass
- [ ] `npm run build` 성공
- [ ] BN API 변경 없음 (FN만 수정)

**1차 제외 (BN 전용):** 학교 변경 UI (`schoolChangeCard`)
