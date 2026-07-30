# Issue #17-4 — React `/join` QA 체크리스트

React 회원가입 UI(`FN/src/join/`) 수동 QA용입니다.  
Thymeleaf `join.html` QA는 `BN/docs/issue-8-mobile-ux-qa-checklist.md`를 참고합니다.

## 사전 조건

| 항목 | 확인 |
|------|------|
| BN 실행 | `./gradlew bootRun` → `http://localhost:8081` |
| FN 실행 | `cd FN && npm run dev` → `http://localhost:5173` |
| 선행 이슈 | `#17-3` `POST /api/auth/signup` merge |
| 빌드 | `cd FN && npm run build` 성공 |

## 뷰포트 (모바일)

Chrome DevTools 디바이스 툴바(Ctrl+Shift+M)로 확인:

| 프리셋 | 해상도 |
|--------|--------|
| iPhone SE | 375 × 667 |
| iPhone 12 | 390 × 844 |
| Galaxy S20 | 360 × 800 |

**합격 기준:** 가로 스크롤 없음, 터치 영역 ≥ 44px(CTA 48px), 주요 콘텐츠 잘림 없음

---

## 공통 UI / A11y

| # | 항목 | SE | 12 | S20 | 비고 |
|---|------|:--:|:--:|:---:|------|
| C1 | `/join` 가로 스크롤 없음 | ☐ | ☐ | ☐ | |
| C2 | 가입하기·인증 버튼 높이 ≥ 48px | ☐ | ☐ | ☐ | |
| C3 | 라벨 `(필수)` 표기, 에러에 아이콘+텍스트 | ☐ | ☐ | ☐ | 색만으로 상태 구분 X |
| C4 | Tab 키로 폼 이동, `:focus-visible` 링 표시 | ☐ | ☐ | ☐ | |
| C5 | 검증 실패 시 상단 요약 + 첫 오류 필드 포커스 | ☐ | ☐ | ☐ | |
| C6 | 스킵 링크 → `#join-form-main` 이동 | ☐ | ☐ | ☐ | |

---

## `/join` — 학교·폼 (J 시리즈 대응)

| # | 항목 | SE | 12 | S20 |
|---|------|:--:|:--:|:---:|
| J1 | 학교 filter chip 줄바꿈, 44px+ 터치 | ☐ | ☐ | ☐ |
| J2 | 검색 결과 항목 min-height 56px, 선택됨 | ☐ | ☐ | ☐ |
| J3 | 검색 드롭다운 세로 스크롤 OK | ☐ | ☐ | ☐ |
| J4 | 약관 `<details>` 펼치기/접기 동작 | ☐ | ☐ | ☐ |
| J5 | 약관 체크박스 행 터치 영역 충분 | ☐ | ☐ | ☐ |
| J6 | 하단 필드 focus 시 가려지지 않음 | ☐ | ☐ | ☐ |
| J7 | 인증번호 발송/확인 버튼 wrap | ☐ | ☐ | ☐ |

---

## E2E — 교사 (TEACHER)

| # | 시나리오 | Pass |
|---|----------|:----:|
| T1 | 역할 **교사** → 학교 검색·선택 | ☐ |
| T2 | 성명 입력 | ☐ |
| T3 | `@korea.kr` 이메일 인증 (발송→확인) | ☐ |
| T4 | 아이디 중복 확인 → 사용 가능 | ☐ |
| T5 | 비밀번호 규칙 충족 + 확인 일치 | ☐ |
| T6 | 필수 약관 3개 동의 | ☐ |
| T7 | **가입하기** → `/login` 이동 + 성공 메시지 + 아이디 자동 입력 | ☐ |
| T8 | 로그인 → `/home` (교사) | ☐ |

---

## E2E — 학생 14세 이상 (STUDENT)

| # | 시나리오 | Pass |
|---|----------|:----:|
| S1 | 역할 **학생** → 학교 선택 | ☐ |
| S2 | 생년월일 **14세 이상** → 법정대리인 섹션 **숨김** | ☐ |
| S3 | 학생 이메일 인증 완료 | ☐ |
| S4 | 가입 성공 → `/login` | ☐ |

---

## E2E — 학생 14세 미만 (STUDENT + Guardian)

| # | 시나리오 | Pass |
|---|----------|:----:|
| G1 | 생년월일 **만 14세 미만** → 법정대리인 섹션 **표시** | ☐ |
| G2 | 보호자 정보 + 필수 동의 3개 | ☐ |
| G3 | SMS 발송 → 인증 → `smsVerified` | ☐ |
| G4 | 가입 성공 → `/login` | ☐ |

---

## 오류 케이스

| # | 시나리오 | 기대 결과 | Pass |
|---|----------|-----------|:----:|
| E1 | 학교 미선택 후 가입 | 클라이언트 에러 + 학교 필드 포커스 | ☐ |
| E2 | 이메일 미인증 후 가입 | 이메일 인증 안내 | ☐ |
| E3 | 아이디 중복 | 서버/클라이언트 에러 메시지 | ☐ |
| E4 | 비밀번호 불일치 | 확인 필드 에러 | ☐ |
| E5 | 14세 미만 SMS 미인증 | SMS 인증 안내 | ☐ |
| E6 | 역할 전환 STUDENT↔TEACHER | 역할 전용 필드·인증 상태 초기화 | ☐ |

---

## 완료 기준 (Definition of Done)

- [ ] 위 E2E 3종(교사 / 학생 14+ / 학생 14-) Pass
- [ ] 오류 케이스 E1~E6 Pass
- [ ] 모바일 3뷰포트 C·J 항목 Pass
- [ ] `npm run build` 성공
- [ ] **BN 코드 변경 없음** (FN-only PR)

---

## PR 체크 (#17-4 · 8단계)

- [ ] 브랜치: `feature/react-signup` → base `develop`
- [ ] 커밋 메시지: `feat(FN): Issue #17-4 React 회원가입 UI`
- [ ] PR 제목: `[FEAT] Issue #17-4 — React 회원가입 UI (/join)`
- [ ] PR 본문: `Closes #<이슈번호>`, 테스트 요약, 스크린샷(모바일·데스크톱)
- [ ] `BN/build.gradle` 등 무관 변경 **제외**

### PR 본문 템플릿

```markdown
## Summary
- React `/join` 회원가입 UI (학생·교사)
- BN REST API + `POST /api/auth/signup` 연동
- 가입 성공 → `/login` (성공 메시지 + 아이디 prefill)

## Test plan
- [ ] TEACHER E2E (T1~T8)
- [ ] STUDENT 14+ (S1~S4)
- [ ] STUDENT under 14 (G1~G4)
- [ ] Error cases E1~E6
- [ ] `npm run build`

## Screenshots
- Desktop /join
- Mobile /join (375px)
- Login success banner after signup
```
