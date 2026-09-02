# 온도 (Ondo)

**학교 상담·학교생활 통합 플랫폼**

[![Live Demo](https://img.shields.io/badge/demo-ondo.ai.kr-blue)](https://ondo.ai.kr)
[![Java](https://img.shields.io/badge/Java-21-orange)]()
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5-green)]()
[![React](https://img.shields.io/badge/React-19-61DAFB)]()

학생·교사·관리자가 상담, 기분 기록, 급식·시간표, 공지 등 학교 생활 정보를 한곳에서 이용하는 웹 서비스입니다.

**운영 URL:** https://ondo.ai.kr

<!-- 스크린샷: 홈 / 회원가입 / 교사 대시보드 -->

---

## 목차

1. [프로젝트 소개](#1-프로젝트-소개)
2. [주요 기능](#2-주요-기능)
3. [기술 스택](#3-기술-스택)
4. [시스템 아키텍처](#4-시스템-아키텍처)
5. [저장소 구조](#5-저장소-구조)
6. [시작하기](#6-시작하기)
7. [운영 배포](#7-운영-배포)
8. [API 개요](#8-api-개요)
9. [개발 이력](#9-개발-이력)
10. [문서](#10-문서)
11. [트러블슈팅](#11-트러블슈팅)
12. [기여 가이드](#12-기여-가이드)
13. [라이선스 · 팀](#13-라이선스--팀)

---

## 1. 프로젝트 소개

온도(Ondo)는 학교 상담 웹 서비스입니다. 기존 Spring Boot + Thymeleaf 기반 기능을 **React SPA**로 전환하고, JWT 인증·역할별 홈·외부 API 연동·EC2 운영 배포까지 완료했습니다.

### 배경 · 목표

| 항목 | 내용 |
|------|------|
| **배경** | Thymeleaf 서버 렌더링 → React 클라이언트 렌더링 전환 |
| **목표** | 학생 친화 UI, 역할별 기능 분리, REST API 표준화 |
| **운영** | 단일 도메인(`ondo.ai.kr`)에서 React + API 통합 서비스 |

### 주요 성과

- React 19 + Vite 6 프론트, Spring Boot 3.5 백엔드 분리 구조
- JWT 로그인, 이메일/SMS 회원가입, 아이디·비밀번호 찾기
- 학생·교사·관리자 역할별 홈 및 핵심 업무 기능
- NEIS·기상청·Solapi·Naver SMTP 연동
- EC2 + nginx + systemd + Jenkins CI/CD 운영

---

## 2. 주요 기능

### 공통

| 기능 | 설명 |
|------|------|
| 로그인 | JWT access + refresh token |
| 회원가입 | 학교 검색, 이메일·SMS 인증, 약관 동의 |
| 계정 복구 | 아이디 찾기, 비밀번호 재설정 |
| 플랫폼 공지 | 전체·역할별 공지 |
| 학교 생활 정보 | 날씨, 학사일정 (NEIS·기상청) |

### 학생

- **홈:** 급식, 시간표, 날씨, 학급 공지, 기분 기록, 사전상담, 상담·건의
- **담임 배정:** 초대코드로 담임 교사 연결
- **상담:** 상담 작성·조회

### 교사

- **대시보드:** 미읽음 상담, 사전상담 프로필, 건의함
- **학급 관리:** 공지 작성, 학생 기분 요약
- **상담:** 답변·상태 변경
- **초대코드:** 발급·재발급

### 관리자

- **대시보드·통계·시스템 상태** (NEIS·Weather API 키 등)
- **회원·학교 관리**, NEIS 학교 매핑
- **건의·공지 관리**, 접근 로그

---

## 3. 기술 스택

### Frontend (FN)

React 19 · TypeScript · Vite 6 · React Router 7

### Backend (BN)

Java 21 · Spring Boot 3.5 · Spring Security · JWT · JPA · Redis

### Infrastructure

AWS EC2 · nginx · systemd · Docker(Redis) · MySQL · Jenkins · Let's Encrypt

### External API

| API | 용도 |
|-----|------|
| NEIS Open API | 급식, 시간표, 학사일정, 학교 검색 |
| 기상청 단기예보 | 오늘 날씨 |
| Solapi | SMS 인증·상담 알림 |
| Naver SMTP | 이메일 인증 |

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

상세 다이어그램: `assets/ondo-system-architecture-v2.png`, `assets/ondo-tech-architecture.png`

---

## 5. 저장소 구조

```
Ondo_Project/
├── BN/                    # Spring Boot API (Backend)
│   ├── config/            # local/prod 설정 (gitignore)
│   ├── scripts/           # deploy-ec2.sh, systemd, nginx
│   └── src/
├── FN/                    # React SPA (Frontend)
│   ├── DOCS/              # 디자인 가이드, QA 체크리스트
│   └── src/
│       ├── api/           # REST client & types
│       ├── auth/          # AuthProvider, route guards
│       ├── student/       # 학생 홈
│       ├── teacher/       # 교사 대시보드
│       └── admin/         # 관리자 콘솔
├── assets/                # 아키텍처 다이어그램
├── Jenkinsfile            # CI/CD 파이프라인
└── README.md
```

`BN/config/application-*.properties`는 Git에 포함되지 않습니다. `*.example` 파일을 복사해 사용하세요.

---

## 6. 시작하기

### 사전 요구사항

Java 21 · Node.js 20+ · MySQL · Redis

### Backend (BN)

```bash
cd BN
cp config/application-local.properties.example config/application-local.properties
# JWT, DB, Redis, API 키 등 수정

./gradlew bootRun
# API: http://localhost:8081
```

### Frontend (FN)

```bash
cd FN
npm install
npm run dev
# App: http://localhost:5173
# /api/* → http://localhost:8081 (Vite proxy)
```

개발 시 `VITE_API_BASE`는 비워 두세요 (상대 경로 `/api` 사용).

### 빌드

```bash
cd BN && ./gradlew bootJar
cd FN && npm run build   # 결과: FN/dist/
```

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

### 수동 배포

```bash
cd ~/Ondo_Project
git pull

cd BN && ./gradlew bootJar --no-daemon -x test
cd ../FN && npm ci && VITE_API_BASE= npm run build

./BN/scripts/deploy-ec2.sh
```

### Jenkins CI/CD

`Jenkinsfile` — Checkout → bootJar → npm build → deploy-ec2.sh

### 헬스체크

```bash
curl -G 'http://127.0.0.1:8081/api/schools/search' --data-urlencode 'keyword=서울'
# 기대: HTTP 200
```

### 배포 완료 기준

HTTPS 접속 → 회원가입(이메일/SMS) → 로그인 → `ondo-api active` + 8081 LISTEN

---

## 8. API 개요

### 인증 · 회원

```
POST   /api/auth/login
POST   /api/auth/signup
GET    /api/auth/me
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/username/check
POST   /api/auth/email/send|verify
POST   /api/auth/sms/send|verify
POST   /api/auth/recovery/id/send|verify
POST   /api/auth/recovery/password/send|reset
```

### 역할별

```
GET    /api/student/home          # 학생 홈 집계
GET    /api/teacher/home          # 교사 홈 집계
GET    /api/common/home           # 공통 홈 집계
GET    /api/counseling/*          # 상담 CRUD
GET    /api/admin/*               # 관리자 대시보드·관리
GET    /api/schools/search        # 학교 검색 (가입·헬스체크)
```

홈 화면은 성능 최적화를 위해 **집계 API**로 여러 요청을 1회 HTTP로 묶었습니다.

---

## 9. 개발 이력

| 단계 | 내용 | 상태 |
|------|------|------|
| 1 | Thymeleaf BN 기반 기능 | ✅ |
| 2 | React scaffold (#17-1) | ✅ |
| 3 | JWT 인증 (#17-2) | ✅ |
| 4 | 회원가입 API/UI (#17-3~4) | ✅ |
| 5 | 학생·교사 홈 (#17-5~6) | ✅ |
| 6 | 관리자 (#17-7) | ✅ |
| 7 | API 성능 (홈 집계·병렬 로딩) | ✅ |
| 8 | EC2 운영 배포 (nginx, systemd, Jenkins, HTTPS) | ✅ |
| 9 | AWS 확장 (RDS, CloudFront, ElastiCache) | 🔜 |

---

## 10. 문서

| 문서 | 경로 |
|------|------|
| UI/UX 디자인 가이드 | `FN/DOCS/DESIGN/2026_UIUX_디자인가이드.md` |
| 디자인 토큰 | `FN/DOCS/DESIGN/tokens.css` |
| 회원가입 QA | `FN/DOCS/QA/issue-17-4-join-qa-checklist.md` |
| 학생 QA | `FN/DOCS/QA/issue-17-5-student-qa-checklist.md` |
| 교사 QA | `FN/DOCS/QA/issue-17-6-teacher-qa-checklist.md` |
| 관리자 QA | `FN/DOCS/QA/issue-17-7-admin-qa-checklist.md` |
| API 성능 베이스라인 | `FN/DOCS/QA/issue-api-loading-performance-baseline.md` |
| FN README | `FN/README.md` |

---

## 11. 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| 502 Bad Gateway | API(8081) 미기동 | `journalctl -u ondo-api`, encryption/JAR 확인 |
| HTTP 000 | 8081 연결 실패 | `systemctl status ondo-api`, restart 후 15초 대기 |
| `localhost:25` SMTP | 운영 config 미반영 | `/opt/ondo/config/` 수정 + restart |
| plain JAR (544KB) | fat JAR 대신 배포 | `ondo-0.0.1-SNAPSHOT.jar` (~88MB) 사용 |
| encryption key 오류 | 32바이트 키 형식 오류 | `dev-mode=true`, `key=` 비우기 |
| Solapi Forbidden IP | IP 화이트리스트 미등록 | Solapi 콘솔에 EC2 공인 IP 추가 |

---

## 12. 기여 가이드

- `main` / `develop`에 직접 커밋하지 않습니다.
- `develop`에서 feature 브랜치 분기 → PR
- 커밋 메시지: `type(scope): 한국어 요약`
- `.env`, API 키, 비밀번호는 커밋하지 않습니다.

---

## 13. 라이선스 · 팀

- **라이선스:** 
- **팀 / 작성자:** wonbyeonseon
- **문의:** ybs8624@naver.co,
- **데모:** https://ondo.ai.kr
