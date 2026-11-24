# 온도 (Ondo)

**학교 상담·학교생활 통합 플랫폼**

[![Live Demo](https://img.shields.io/badge/demo-ondo.ai.kr-blue)](https://ondo.ai.kr)
[![Java](https://img.shields.io/badge/Java-21-orange)]()
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5-green)]()
[![React](https://img.shields.io/badge/React-19-61DAFB)]()
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38BDF8)]()

학생·교사·관리자가 상담, 마음 날씨(기분 기록), 급식·시간표, 공지 등 학교생활 정보를 한곳에서 이용하는 웹 서비스입니다.

**운영 URL:** https://ondo.ai.kr

<!-- 스크린샷: 랜딩 / 학생 홈 / 교사 상담 화면 -->

---

## 목차

1. [프로젝트 소개](#1-프로젝트-소개)
2. [주요 기능](#2-주요-기능)
3. [기술 스택](#3-기술-스택)
4. [시스템 아키텍처](#4-시스템-아키텍처)
5. [저장소 구조](#5-저장소-구조)
6. [시작하기](#6-시작하기)
7. [운영 배포](#7-운영-배포)
8. [개인정보 보호 · 보관 기간](#8-개인정보-보호--보관-기간)
9. [API 개요](#9-api-개요)
10. [개발 이력](#10-개발-이력)
11. [문서](#11-문서)
12. [트러블슈팅](#12-트러블슈팅)
13. [기여 가이드](#13-기여-가이드)
14. [라이선스 · 팀](#14-라이선스--팀)

---

## 1. 프로젝트 소개

온도(Ondo)는 학생이 담임 선생님에게 편하게 상담을 신청하고, 선생님은 학급 학생의 마음 상태와 상담을 한 화면에서 살펴보는 학교 상담 웹 서비스입니다.
처음에는 Spring Boot + Thymeleaf로 만들었고, 지금은 **React SPA + REST API** 구조로 바꿔 EC2에서 운영하고 있습니다.

### 배경 · 목표

| 항목 | 내용 |
|------|------|
| **배경** | Thymeleaf 서버 렌더링 화면을 React 클라이언트 렌더링으로 전환 |
| **목표** | 학생 친화 UI, 역할별 기능 분리, REST API 표준화, 학생 개인정보 보호 |
| **운영** | 단일 도메인(`ondo.ai.kr`)에서 React 화면과 API를 함께 서비스 |

### 주요 성과

- React 19 + Vite 6 + Tailwind CSS 4 프론트, Spring Boot 3.5 백엔드 분리 구조
- 로그인 토큰을 **httpOnly 쿠키**(SameSite=Strict)로 주고받는 JWT 인증
- 이메일·SMS 인증 회원가입, 만 14세 미만 보호자 동의, 약관 동의 버전 기록
- 학생·교사·관리자 역할별 화면 (비로그인 방문자는 랜딩 페이지)
- 위기 신호 알림, 상담 답변 메일 알림, 새 학기 담임 변경
- 휴대전화·사전상담 정보 **AES-256-GCM 암호화 저장**, 탈퇴 회원 개인정보 자동 파기
- NEIS·기상청·Solapi·Naver SMTP 연동
- EC2 + nginx + systemd + Jenkins CI/CD, 배포 전 자동 점검·실패 시 자동 롤백, DB 자동 백업

---

## 2. 주요 기능

### 공통

| 기능 | 설명 |
|------|------|
| 랜딩 페이지 | 비로그인 방문자는 `/`에서 서비스 소개, 로그인 사용자는 역할별 홈으로 이동 |
| 로그인 | JWT access + refresh token (httpOnly 쿠키) |
| 회원가입 | 가입 유형 → 학교 검색 → 이메일 인증 → 보호자 동의(만 14세 미만) → 아이디·비밀번호 → 약관 동의 |
| 교사 인증 | 시·도교육청 도메인 또는 `korea.kr` 메일만 교사 가입 허용 |
| 계정 복구 | 아이디 찾기, 비밀번호 재설정 |
| 회원 탈퇴 | 탈퇴일로부터 5일 이내 개인정보 자동 파기 (매일 04:30 실행, [8장](#8-개인정보-보호--보관-기간) 참고) |
| 온도 공지 | 전체·역할별 공지, 종 버튼 알림 |
| 학교 홈 (`/home`) | 날씨, 2주 학사일정, 온도 공지 (NEIS·기상청) |
| 약관 | 이용약관(`/terms`), 개인정보처리방침(`/privacy`), 가입 시 동의한 약관 버전 기록 |

### 학생

하단 탭 5개 구조입니다.

- **홈:** 오늘 마음 날씨(누르면 바로 저장), 오늘 할 일, 선생님 공지 미리보기, 담임 미연결 안내
- **학교:** 날씨, 오늘 시간표, 급식, 2주 학사일정
- **상담:** 상담 신청·조회·수정·삭제, 사전상담 카드 작성
- **소식:** 선생님 공지, 온도 공지
- **내 정보:** 학년·반, 담임 연결·변경(6자리 초대 코드), 알림 설정, 운영 건의, 로그아웃·탈퇴
- **도움 연락처:** 기분 '우울'·'힘듦'을 고르거나 '정서/심리'·'학교폭력' 상담을 고르면 109·1388·117 안내
- **답변 알림:** 선생님이 처음 답변하면 메일로 알림 (상담 제목·내용은 담지 않음, 끌 수 있음)

### 교사

왼쪽 메뉴 구조입니다 (모바일은 상단 가로 탭).

- **상담:** 핵심 지표, 상태 탭·검색 표, 오른쪽 상세에서 상태 변경·답변
- **위기 신호 알림:** 먼저 살펴보면 좋을 학생 안내 (오늘 '힘듦', 최근 7일 중 3일 이상 '우울'·'힘듦', 끝나지 않은 학교폭력 상담)
- **마음 날씨:** 오늘 분포, 최근 7일 학생별 기록
- **사전상담 카드 · 학급 공지 · 운영 건의**
- **설정:** 초대 코드 발급·재발급, 상담 신청 문자 알림, 우리 반 학생 목록·연결 해제
- **새 학기 학급 정리:** 연결 모두 해제 + 초대 코드 재발급, 지난 담임과의 상담은 보이지 않음

### 관리자

- **운영 현황:** 핵심 지표, 상담 상태·마음 날씨 분포, 서버 설정 상태(운영/개발 모드·API 키)
- **회원·학교 관리:** 계정 정지, CSV 동기화, NEIS 학교 일괄 연결
- **운영 건의 · 온도 공지 관리**
- **감사 기록:** 상담 열람, 사전상담 열람, 관리자 작업 기록
- **운영자 오류 알림:** 처리되지 않은 서버 오류·자동 파기 실패를 메일로 알림 (같은 오류 30분에 1번, 하루 최대 30통)

---

## 3. 기술 스택

### Frontend (FN)

React 19 · TypeScript 5.8 · Vite 6 · React Router 7 · Tailwind CSS 4 · lucide-react

### Backend (BN)

Java 21 · Spring Boot 3.5 · Spring Security · JWT(jjwt) · JPA · Redis · Caffeine Cache · Spring Mail

### Infrastructure

AWS EC2 (Amazon Linux) · nginx · systemd · Docker(Redis) · MySQL · Jenkins · Let's Encrypt

### External API

| API | 용도 |
|-----|------|
| NEIS Open API | 급식, 시간표, 학사일정, 학교 검색 |
| 기상청 단기예보 | 오늘 날씨 |
| Solapi | 보호자 SMS 인증, 상담 신청 문자 알림 |
| Naver SMTP | 이메일 인증, 상담 답변 알림, 운영자 오류 알림 |

---

## 4. 시스템 아키텍처

사용자 → nginx(443) → React 정적 파일 + `/api` 프록시 → Spring Boot(:8081) → MySQL, Redis, 외부 API

```
┌─────────┐     HTTPS      ┌──────────────┐
│  User   │ ─────────────▶ │    nginx     │
└─────────┘                │  / → FN/dist │
                           │  /api → :8081│
                           └──────┬───────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │  Spring Boot (ondo-api)   │
                    │  JWT · JPA · Redis        │
                    └─────────────┬─────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              ▼                   ▼                   ▼
          MySQL              Redis (Docker)      NEIS / 기상청
                                                    Solapi / SMTP
```

- nginx: 80 → 443 리다이렉트, 보안 헤더·CSP(Report-Only)·압축·캐시 설정 (`BN/scripts/nginx-ondo.conf`)
- 홈 화면은 여러 요청을 한 번에 묶은 **집계 API**와 서버 캐시로 로딩 시간을 줄였습니다.

---

## 5. 저장소 구조

```
Ondo_Project/
├── BN/                    # Spring Boot API (Backend)
│   ├── config/            # 설정 예시 (*.example) — 실제 설정은 gitignore
│   ├── docs/              # 홈·모바일 QA 체크리스트
│   ├── scripts/           # 배포·점검·HTTPS·백업 스크립트, systemd, nginx
│   └── src/main/java/com/ondo/
│       ├── domain/        # user, counseling, mood, attention, teacher, student, admin ...
│       └── global/        # security, crypto, alert, cache, error, sms ...
├── FN/                    # React SPA (Frontend)
│   ├── DOCS/              # 디자인 가이드, QA 체크리스트
│   └── src/
│       ├── api/           # REST client & types
│       ├── auth/          # AuthProvider, route guards
│       ├── ds/            # 디자인 시스템 컴포넌트 (UI v2)
│       ├── v2/            # 새 디자인 화면 (landing, auth, join, student, teacher, admin, legal)
│       └── routes/        # 라우트·경로 상수
├── Jenkinsfile            # CI/CD 파이프라인
└── README.md
```

`BN/config/application-*.properties`는 Git에 포함되지 않습니다. `*.example` 파일을 복사해 사용하세요.

---

## 6. 시작하기

### 사전 요구사항

Java 21 · Node.js 20 이상 (22 권장 — 20은 지원 종료) · MySQL · Redis

### Backend (BN)

```bash
cd BN
cp config/application-local.properties.example config/application-local.properties
# JWT, DB, Redis, API 키 등 수정

./gradlew bootRun
# API: http://localhost:8081
```

로컬에서는 메일·SMS·NEIS·날씨를 `dev-mode=true`로 두면 실제로 보내거나 부르지 않고 로그만 남깁니다.

### Frontend (FN)

```bash
cd FN
npm install
npm run dev
# App: http://localhost:5173
# /api/* → http://localhost:8081 (Vite proxy)
```

- 개발 시 `VITE_API_BASE`는 비워 두세요 (상대 경로 `/api` 사용).
- 디자인 시스템 견본: http://localhost:5173/ui-preview (개발 모드에서만 열림)

### 테스트 · 빌드

```bash
cd BN && ./gradlew test        # 백엔드 테스트 (Windows: .\gradlew.bat test)
cd BN && ./gradlew bootJar     # 결과: BN/build/libs/ondo-0.0.1-SNAPSHOT.jar
cd FN && npm run build         # 결과: FN/dist/
```

- 백엔드 테스트 대부분은 **로컬 MySQL·Redis에 실제로 연결**하는 통합 테스트입니다. 테스트 데이터는 끝나면 되돌리지만, 서버가 켜질 때 실행되는 데이터 이전(예: 휴대전화 암호화 이전)은 로컬 DB에 실제로 반영됩니다.
- **운영 DB를 가리키는 설정으로는 절대 테스트를 실행하지 않습니다.** `BN/config/application-local.properties`의 `spring.datasource.url`이 로컬 DB인지 먼저 확인하세요.
- Redis는 Docker로 켭니다: `docker run -d --name ondo-redis -p 6379:6379 redis:7` (이후 `docker start ondo-redis`)

---

## 7. 운영 배포

### 운영 환경

| 항목 | 값 |
|------|-----|
| URL | https://ondo.ai.kr |
| 서버 | AWS EC2 (Amazon Linux) |
| 프로세스 | systemd `ondo-api` |
| 정적 파일 | nginx → `/usr/share/nginx/html` |
| 설정 파일 | `/opt/ondo/config/application-prod.properties` |

**중요:** API는 `/opt/ondo/config/application-prod.properties`만 읽습니다. PC나 repo의 `BN/config/`를 수정해도 자동 반영되지 않습니다.

```bash
sudo cp BN/config/application-prod.properties.example /opt/ondo/config/application-prod.properties
sudo nano /opt/ondo/config/application-prod.properties
sudo chmod 600 /opt/ondo/config/application-prod.properties
```

주요 운영 설정:

| 설정 | 설명 |
|------|------|
| `ondo.encryption.key` | AES-256 암호화 키. `openssl rand -base64 32`로 만들고 서버 밖 안전한 곳에도 보관합니다. **잃어버리면 암호화된 휴대전화·사전상담 정보를 복호화할 수 없습니다.** |
| `ondo.encryption.dev-mode` | 운영은 `false` (코드에 공개된 개발용 키 사용 금지) |
| `ondo.mail.dev-mode` | 운영은 `false` — `true`면 메일을 보내지 않고 로그만 남김 |
| `ondo.alert.email` | 운영자 오류 알림을 받을 메일 (`ondo.alert.cooldown-minutes`, `ondo.alert.daily-limit`로 발송량 조절) |
| `ondo.retention.*` | 자동 파기 설정 (기본: 매일 04:30, 탈퇴 후 3일, 열람 기록 730일, 탈퇴 사유 365일). 바꾸면 개인정보처리방침도 함께 고칩니다. |
| `spring.jpa.hibernate.ddl-auto` | 현재 `update` — 새 칸은 서버가 켜질 때 자동으로 생깁니다. 안정화 후 `validate`로 바꿀 예정입니다. |

### 수동 배포

서버 접속은 EC2 콘솔의 **EC2 Instance Connect**를 씁니다 (보안 그룹 SSH 인바운드에 서울 리전 범위 `13.209.1.56/29` 허용, `0.0.0.0/0`은 열지 않음).

```bash
cd ~/Ondo_Project
git checkout main && git pull origin main

sudo bash BN/scripts/backup-db.sh          # DB 구조·데이터가 바뀌는 배포 전에는 반드시 백업

cd BN && ./gradlew bootJar --no-daemon -x test
cd ../FN && npm ci && VITE_API_BASE= npm run build

cd .. && sudo ./BN/scripts/deploy-ec2.sh
```

- 배포 전에 `ec2-preflight.sh`가 운영 설정·MySQL·Redis·포트를 점검합니다. FAIL이 있으면 아무것도 바꾸지 않고 멈춥니다.
- 이전 JAR·React를 `*.prev`로 보관하고, API가 120초 안에 응답하지 않으면 **자동으로 이전 버전으로 롤백**합니다.
- `Deploy OK` = 성공, `ROLLBACK OK` = 새 버전 실패 후 이전 버전으로 복구됨.
- **롤백은 JAR·화면만 되돌립니다. DB에 생긴 새 칸이나 데이터 이전은 되돌리지 않으므로**, 백업을 먼저 해 둡니다.
- 배포 후 확인: `sudo journalctl -u ondo-api -n 300 --no-pager | grep -E "암호화 이전|ERROR|Started"`

### HTTPS (Let's Encrypt)

```bash
cd ~/Ondo_Project
EMAIL=you@example.com sudo -E bash BN/scripts/setup-https.sh
```

- 인증서 발급(webroot) → `BN/scripts/nginx-ondo.conf`(80→443 리다이렉트 + 443) 적용 → 자동 갱신 타이머·nginx reload 훅 설정까지 한 번에 합니다. 여러 번 실행해도 안전합니다.
- nginx 설정은 **repo의 `nginx-ondo.conf`에서만 수정**합니다. 서버에서 `certbot --nginx`로 직접 고치면 다음 설정 복사 때 덮어써져 HTTPS가 사라집니다.
- EC2에는 Elastic IP를 연결하고, 보안 그룹 인바운드에 80·443을 열어 둡니다.
- 인증서 상태 확인: `sudo certbot certificates`, `systemctl list-timers | grep certbot`

### DB 백업 · 복구

```bash
sudo bash BN/scripts/setup-backup.sh      # 최초 1회: 매일 04:07(KST) 자동 백업 설치 + 즉시 1회 실행
sudo ls -lh /var/backups/ondo             # 백업 목록 (최근 14일 보관, root 만 읽기 가능)
sudo systemctl start ondo-db-backup       # 지금 바로 백업
sudo journalctl -u ondo-db-backup -n 20   # 백업 로그
```

- 백업 파일에는 학생 개인정보가 들어 있습니다. 다운로드·공유하지 말고 서버 밖으로 옮길 때는 암호화된 저장소(S3 등)만 사용합니다.
- 서버 밖 보관(S3): `/opt/ondo/config/backup.env` 에 `ONDO_BACKUP_S3_URI=s3://버킷/ondo-db` 를 넣으면 백업할 때마다 S3 로 복사합니다 (EC2 IAM 역할에 해당 버킷 `s3:PutObject` 권한 필요).
- S3 버킷은 서울 리전, 퍼블릭 액세스 차단, 버전 관리 **끔**, 수명 주기 규칙(접두사 `ondo-db/`, 14일 만료)으로 운영합니다. 개인정보처리방침의 '백업 14일 보관'과 맞춰야 합니다.

**복구** — 반드시 먼저 별도 DB 로 복구해 내용을 확인한 뒤 운영 DB 에 적용합니다. (테이블을 지우고 다시 만들어야 해서 앱 전용 계정 `ondo` 가 아닌 DB 관리자 `root` 로 실행합니다)

```bash
# 1) 복구 확인용 DB 로 풀어 보기
sudo zcat /var/backups/ondo/ondo_DB-YYYYMMDD-HHMM.sql.gz \
  | sed 's/`ondo_DB`/`ondo_restore_check`/g' | mysql -h 127.0.0.1 -u root -p
mysql -h 127.0.0.1 -u root -p -e "SELECT COUNT(*) FROM ondo_restore_check.users;"

# 2) 운영 DB 에 적용 (서비스 중지 → 복구 → 재시작)
sudo systemctl stop ondo-api
sudo zcat /var/backups/ondo/ondo_DB-YYYYMMDD-HHMM.sql.gz | mysql -h 127.0.0.1 -u root -p
sudo systemctl start ondo-api
```

### Jenkins CI/CD

`Jenkinsfile` — Checkout → bootJar → npm build → `sudo /opt/ondo/bin/deploy-ec2.sh`

- Jenkins sudo 권한은 `/opt/ondo/bin/deploy-ec2.sh`(root 소유 사본) 하나만 허용합니다.
- `BN/scripts/deploy-ec2.sh`를 수정했다면 서버에서 `bash BN/scripts/jenkins-ec2-setup.sh`를 다시 실행해야 Jenkins 배포에 반영됩니다.

### 헬스체크

```bash
curl -G 'http://127.0.0.1:8081/api/schools/search' --data-urlencode 'keyword=서울'
# 기대: HTTP 200
```

### 배포 완료 기준

HTTPS 접속 → 회원가입(이메일/SMS) → 로그인 → `ondo-api active` + 8081 LISTEN

---

## 8. 개인정보 보호 · 보관 기간

학생 상담 내용 등 민감정보를 다루므로, 아래 내용은 **개인정보처리방침(`FN/src/v2/legal/privacy.ts`)과 항상 일치**해야 합니다. 코드를 바꾸면 문서도 함께 고칩니다.

| 항목 | 처리 |
|------|------|
| 정보 공개 범위 | 학생의 상담·마음 날씨·사전상담 카드는 초대 코드로 연결된 담임만 열람. 교사는 **자기에게 보낸 상담만** 봄 (담임이 바뀌면 지난 상담은 새 담임에게 안 보임) |
| 열람 기록 | 상담·사전상담 카드를 열 때마다 기록, 관리자 화면에서 점검. 관리자 화면에는 상담 본문 열람 기능 없음 |
| 암호화 | 비밀번호 BCrypt, 휴대전화(보호자·교사)와 사전상담 연락처 AES-256-GCM, 통신 HTTPS |
| 탈퇴 회원 | 탈퇴 후 3일이 지나면 다음 날 04:30에 파기 (탈퇴일로부터 5일 이내). 학생은 계정째 삭제, 교사는 개인정보를 비우고 '탈퇴한 회원' 표시만 남김 |
| 열람·관리자 작업 기록 | 2년 보관 후 삭제 |
| 탈퇴 사유 | 익명 처리 후 1년 |
| DB 백업 | 서버·S3 각각 14일 |
| 서버 접속 로그 (nginx) | 3개월 (`/etc/logrotate.d/nginx`: daily, rotate 90, maxage 90) |
| 외부 위탁 | Solapi(문자), 네이버(메일), AWS(서버·백업, 서울 리전) |
| 알림 메일 | 상담 답변·오류 알림 메일에는 상담 내용·개인정보를 넣지 않음 |

**약관 개정 절차**

1. `FN/src/v2/legal/terms.ts`·`privacy.ts` 내용을 고칩니다.
2. 버전(시행일)을 바꿀 때는 **BN `LegalDocumentVersions`와 FN `TERMS_VERSION`·`PRIVACY_VERSION`을 같은 값으로** 바꿉니다. 다르면 가입이 막힙니다.
3. 시행 7일 전(불리한 변경은 30일 전) 온도 공지로 알립니다.

---

## 9. API 개요

### 인증 · 회원

```
POST   /api/auth/signup
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/me/withdraw
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/username/check
POST   /api/auth/email/send|verify|status
POST   /api/auth/sms/send|verify
POST   /api/auth/recovery/id/send|verify
POST   /api/auth/recovery/password/send|reset
```

### 학생

```
GET    /api/student/home                         # 학생 홈 집계
GET    /api/student/meals/today                  # 급식
GET    /api/student/timetable/today              # 시간표
GET    /api/student/weather/today                # 날씨
POST   /api/student/mood   GET /mood/today       # 마음 날씨
GET|PUT /api/student/pre-counseling-profile      # 사전상담 카드
GET|POST|PUT /api/student/assignment             # 담임 연결·변경
GET    /api/student/notices                      # 선생님 공지
/api/student/profile/school|class|notification-settings
/api/student/suggestions                         # 운영 건의 CRUD
```

### 교사

```
GET    /api/teacher/home                         # 교사 홈 집계
GET    /api/teacher/attention                    # 위기 신호 (담당 학생만)
GET    /api/teacher/mood/today|weekly            # 마음 날씨
GET    /api/teacher/pre-counseling-profiles[/{studentUsername}]
GET|POST|DELETE /api/teacher/notices             # 학급 공지
GET    /api/teacher/invite-code   POST /regenerate
GET    /api/teacher/class/students               # 우리 반 학생
DELETE /api/teacher/class/students/{studentUsername}
POST   /api/teacher/class/release                # 새 학기 학급 정리
/api/teacher/profile/school|notification-settings
/api/teacher/suggestions                         # 운영 건의 CRUD
```

### 상담

```
POST   /api/counseling                           # 상담 신청
GET    /api/counseling/my | /teacher | /unread-count | /{id}
PUT|DELETE /api/counseling/{id}
PATCH  /api/counseling/{id}/status
POST   /api/counseling/{id}/reply                # 답변 (첫 답변 시 학생 메일 알림)
```

### 공통 · 관리자

```
GET    /api/common/home                          # 공통 홈 집계
GET    /api/common/weather/today
GET    /api/common/school-schedule/upcoming
GET    /api/common/announcements[/{id}]
GET    /api/schools/search                       # 학교 검색 (가입·헬스체크)

GET    /api/admin/dashboard | system-status | statistics
GET    /api/admin/users     PATCH /users/{username}/status|school
GET    /api/admin/schools   POST  /schools/sync-csv|sync-neis
GET    /api/admin/access-logs/counseling|pre-counseling
GET    /api/admin/activity-logs
/api/admin/announcements                         # 온도 공지 CRUD
/api/admin/suggestions                           # 건의 조회·상태·답변
```

---

## 10. 개발 이력

| 단계 | 내용 | 상태 |
|------|------|------|
| 1 | Thymeleaf BN 기반 기능 | ✅ |
| 2 | React scaffold · JWT 인증 · 회원가입 (#17) | ✅ |
| 3 | 학생·교사 홈, 관리자 (#17-5~7) | ✅ |
| 4 | 계정 복구 · 회원 탈퇴 · 관리자 공지 (#19~#25) | ✅ |
| 5 | 공통 디자인 시스템 마이그레이션 (#31~#36) | ✅ |
| 6 | API 성능 (홈 집계·캐시·병렬 로딩, #38) | ✅ |
| 7 | EC2 운영 배포 (nginx, systemd, Jenkins, HTTPS) | ✅ |
| 8 | 보안 강화 — httpOnly 쿠키, 보안 헤더, 배포 점검·자동 롤백, DB 자동 백업 | ✅ |
| 9 | UI v2 — Tailwind·lucide 디자인 시스템, 랜딩 페이지, 전 화면 새 디자인 | ✅ |
| 10 | 이용약관·개인정보처리방침, 약관 동의 버전 기록, 탈퇴 회원 자동 파기 | ✅ |
| 11 | 위기 신호 알림 · 운영자 오류 알림 · 새 학기 담임 변경 · 휴대전화 암호화 · 상담 답변 메일 | ✅ |
| 12 | 내 글 열람 기록 보기 · 공용 PC 자동 로그아웃 · 교사·관리자 2단계 인증 · 상담 글쓰기 도우미 | 🔜 |
| 13 | AWS 확장 (RDS, CloudFront, ElastiCache) | 🔜 |

---

## 11. 문서

| 문서 | 경로 |
|------|------|
| UI v2 디자인 규칙 | `FN/DOCS/DESIGN/ui-v2-guide.md` |
| UI/UX 디자인 가이드 (이전) | `FN/DOCS/DESIGN/2026_UIUX_디자인가이드.md` |
| 디자인 토큰 | `FN/DOCS/DESIGN/tokens.css` |
| 회원가입 QA | `FN/DOCS/QA/issue-17-4-join-qa-checklist.md` |
| 학생 QA | `FN/DOCS/QA/issue-17-5-student-qa-checklist.md` |
| 교사 QA | `FN/DOCS/QA/issue-17-6-teacher-qa-checklist.md` |
| 관리자 QA | `FN/DOCS/QA/issue-17-7-admin-qa-checklist.md` |
| React 통합 QA 보고 | `FN/DOCS/QA/issue-react-integration-qa-report.md` |
| API 성능 베이스라인 | `FN/DOCS/QA/issue-api-loading-performance-baseline.md` |
| 공통 홈 QA | `BN/docs/issue-14-common-home-qa-checklist.md` |
| 모바일 UX QA | `BN/docs/issue-8-mobile-ux-qa-checklist.md` |
| 운영 설정 예시 | `BN/config/application-prod.properties.example` |
| FN README | `FN/README.md` |

---

## 12. 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| 502 Bad Gateway | API(8081) 미기동 | `journalctl -u ondo-api`, 암호화 키·JAR 확인 |
| HTTP 000 | 8081 연결 실패 | `systemctl status ondo-api`, restart 후 15초 대기 |
| 배포가 `FAIL: preflight` 로 멈춤 | 운영 설정 누락·Redis 미기동 | `sudo bash BN/scripts/ec2-preflight.sh` 로 FAIL 항목 확인 후 수정 |
| `ROLLBACK OK` | 새 버전이 120초 안에 응답 안 함 | `journalctl -u ondo-api -n 80` 로 원인 확인 (서비스는 이전 버전으로 계속 동작) |
| Redis(6379) 미기동 | 컨테이너 중지 | `sudo docker start ondo-redis` |
| `spring.redis.*` 경고 | Spring Boot 3에서 이름 바뀜 | `spring.data.redis.*` 로 변경 |
| `localhost:25` SMTP | 운영 config 미반영 | `/opt/ondo/config/` 수정 + restart |
| plain JAR (544KB) | fat JAR 대신 배포 | `ondo-0.0.1-SNAPSHOT.jar` (~88MB) 사용 |
| 암호화 키 오류 | 32바이트(base64 44자) 키 형식 오류 | `openssl rand -base64 32` 로 다시 만들기 (로컬은 `dev-mode=true`) |
| 예전 개발용 키로 저장된 데이터 | 키 변경 | `ondo.encryption.migrate-from-dev-key=true` 로 1회 기동 → 로그에서 '실패 0건' 확인 → false |
| Solapi Forbidden IP | IP 화이트리스트 미등록 | Solapi 콘솔에 EC2 공인 IP 추가 |
| 가입 시 "약관이 개정되었습니다" | FN과 BN의 약관 버전이 다름 | `LegalDocumentVersions`와 `TERMS_VERSION`·`PRIVACY_VERSION`을 같은 값으로 맞춰 함께 배포 |
| 오류 알림·답변 알림 메일이 안 옴 | 메일 개발 모드이거나 받는 주소 미설정 | `ondo.mail.dev-mode=false`, `ondo.alert.email` 확인 후 restart (로그에 `[alert]`, `[reply-mail]` 기록) |
| 휴대전화가 빈 값으로 보임 | 암호화 키가 저장 당시와 다름 | `ondo.encryption.key` 확인 (로그: `[암호화] 저장된 값을 복호화하지 못했습니다`) |
| EC2 Instance Connect 접속 실패 | 보안 그룹에 서비스 IP 범위 없음 | SSH 인바운드에 `13.209.1.56/29` 추가 |
| HTTPS 접속 불가·인증서 오류 | 인증서 만료 / nginx 443 설정 덮어써짐 / DNS·IP 불일치 | `sudo -E bash BN/scripts/setup-https.sh` 재실행 (DNS·IP 검사 포함) |

---

## 13. 기여 가이드

- `main` / `develop`에 직접 커밋하지 않습니다.
- `develop`에서 feature 브랜치 분기 → PR → `develop` → `main`
- 브랜치 이름: `feat/…`, `fix/…`, `chore/…`
- 커밋 메시지: `type(scope): 한국어 요약` (예: `feat(attention): 위기 신호 알림 추가`)
- `.env`, `application-local.properties`, `application-prod.properties`, API 키, 비밀번호는 커밋하지 않습니다.
- 새 화면은 `FN/src/ds` 컴포넌트와 Tailwind CSS로 만듭니다 (`FN/DOCS/DESIGN/ui-v2-guide.md`).

---

## 14. 라이선스 · 팀

- **라이선스:** 미정
- **팀 / 작성자:** 원병선 (wonbyeonseon)
- **문의:** ybs8624@naver.com
- **데모:** https://ondo.ai.kr
