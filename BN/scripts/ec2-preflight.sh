#!/usr/bin/env bash
# Ondo 운영 기동 전 점검 — 위험한 설정을 서버가 켜지기 전에 잡아냅니다.
#
# 사용:   sudo bash BN/scripts/ec2-preflight.sh [설정파일]
#         (기본: /opt/ondo/config/application-prod.properties)
# 결과:   FAIL 이 하나라도 있으면 exit 1 — deploy-ec2.sh 가 배포를 중단합니다.
#         WARN 은 배포를 막지 않지만 고치는 것을 권장합니다.
# 비밀번호·키 값은 화면에 출력하지 않습니다.
set -uo pipefail

CONFIG="${1:-/opt/ondo/config/application-prod.properties}"
FAILS=0
WARNS=0

fail() { echo "FAIL: $*"; FAILS=$((FAILS + 1)); }
warn() { echo "WARN: $*"; WARNS=$((WARNS + 1)); }
ok()   { echo "OK  : $*"; }

# key=value 읽기 (마지막 값, 앞뒤 공백 제거)
prop() {
  local key="$1"
  grep -E "^[[:space:]]*${key//./\\.}[[:space:]]*=" "${CONFIG}" 2>/dev/null \
    | tail -1 | cut -d= -f2- | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's/\r$//'
}
has_prop() {
  grep -qE "^[[:space:]]*${1//./\\.}[[:space:]]*=" "${CONFIG}" 2>/dev/null
}

echo "=== Ondo preflight: ${CONFIG} ==="

# ----------------------------------------------------------------
# 1. 설정 파일
# ----------------------------------------------------------------
if [[ ! -f "${CONFIG}" ]]; then
  fail "설정 파일 없음 — cp BN/config/application-prod.properties.example ${CONFIG} 후 수정"
  echo "=== FAIL ${FAILS} / WARN ${WARNS} ==="
  exit 1
fi
PERM="$(stat -c %a "${CONFIG}")"
if [[ "${PERM}" =~ [0-7][0-7][1-7]$ ]]; then
  warn "설정 파일을 서버의 다른 사용자도 읽을 수 있음 (권한 ${PERM}) — sudo chmod 600 ${CONFIG}"
else
  ok "설정 파일 권한 ${PERM}"
fi

# ----------------------------------------------------------------
# 2. 예시값(placeholder) 그대로인지
# ----------------------------------------------------------------
if grep -qE 'your-|YOUR_|change-me|ChangeMe1!' "${CONFIG}"; then
  fail "예시값이 남아 있음 — 줄 번호: $(grep -nE 'your-|YOUR_|change-me|ChangeMe1!' "${CONFIG}" | cut -d: -f1 | tr '\n' ' ')"
else
  ok "예시값 없음"
fi

# ----------------------------------------------------------------
# 3. DB
# ----------------------------------------------------------------
for key in spring.datasource.url spring.datasource.username spring.datasource.password; do
  [[ -n "$(prop "${key}")" ]] || fail "${key} 비어 있음"
done
if [[ "$(prop spring.datasource.username)" == "root" ]]; then
  warn "DB를 root 로 접속 중 — ondo_DB 전용 계정 사용 권장"
fi
if [[ "$(prop spring.jpa.hibernate.ddl-auto)" =~ ^(create|create-drop)$ ]]; then
  fail "spring.jpa.hibernate.ddl-auto=$(prop spring.jpa.hibernate.ddl-auto) — 기동할 때 운영 데이터가 지워집니다"
fi

# ----------------------------------------------------------------
# 4. JWT
# ----------------------------------------------------------------
JWT="$(prop ondo.jwt.secret)"
if [[ -z "${JWT}" ]]; then
  fail "ondo.jwt.secret 비어 있음"
elif (( ${#JWT} < 32 )); then
  fail "ondo.jwt.secret 이 32자 미만"
else
  ok "JWT secret 길이 충분"
fi
unset JWT

# ----------------------------------------------------------------
# 5. 암호화 (사전상담 전화번호)
# ----------------------------------------------------------------
ENC_KEY="$(prop ondo.encryption.key)"
if [[ "$(prop ondo.encryption.dev-mode)" != "false" ]]; then
  if [[ -z "${ENC_KEY}" ]]; then
    fail "ondo.encryption.dev-mode 가 false 가 아니고 key 도 비어 있음 — 코드에 공개된 개발용 키로 암호화됩니다"
  else
    warn "ondo.encryption.dev-mode=false 로 두세요 (키 오류 시 개발용 키로 바뀌는 것을 막기 위해)"
  fi
fi
if [[ -n "${ENC_KEY}" ]]; then
  DECODED_LEN="$(printf '%s' "${ENC_KEY}" | base64 -d 2>/dev/null | wc -c)"
  if [[ "${DECODED_LEN}" == "32" || "${#ENC_KEY}" == "32" ]]; then
    ok "암호화 키 형식 정상"
  else
    fail "ondo.encryption.key 형식 오류 — openssl rand -base64 32 로 만든 값(44자)이어야 합니다"
  fi
  if [[ "${ENC_KEY}" == "01234567890123456789012345678901" ]]; then
    fail "ondo.encryption.key 가 공개된 개발용 키와 같음"
  fi
elif [[ "$(prop ondo.encryption.dev-mode)" == "false" ]]; then
  fail "ondo.encryption.dev-mode=false 인데 key 가 비어 있음 — 서버가 기동되지 않습니다"
fi
unset ENC_KEY DECODED_LEN
if [[ "$(prop ondo.encryption.migrate-from-dev-key)" == "true" ]]; then
  warn "ondo.encryption.migrate-from-dev-key=true — 재암호화가 끝났다면 false 로 바꾸세요"
fi

# ----------------------------------------------------------------
# 6. 관리자 초기 계정
# ----------------------------------------------------------------
if [[ "$(prop ondo.admin.bootstrap.enabled)" == "true" ]]; then
  warn "ondo.admin.bootstrap.enabled=true — 관리자 계정을 만든 뒤에는 false 로 두세요"
fi
if [[ -n "$(prop ondo.admin.bootstrap.password)" ]]; then
  warn "ondo.admin.bootstrap.password 가 설정 파일에 남아 있음 — 계정 생성 후 비우세요"
fi

# ----------------------------------------------------------------
# 7. 운영 모드 (dev-mode 가 켜져 있으면 실제 발송·조회가 안 됨)
# ----------------------------------------------------------------
for key in ondo.mail.dev-mode ondo.solapi.dev-mode ondo.neis.dev-mode ondo.weather.dev-mode; do
  if [[ "$(prop "${key}")" == "true" ]]; then
    warn "${key}=true — 운영에서는 실제 메일·SMS·API 대신 개발용 동작을 합니다"
  fi
done
BASE_URL="$(prop ondo.app.base-url)"
if [[ "${BASE_URL}" != https://* ]]; then
  warn "ondo.app.base-url 이 https 가 아님 (${BASE_URL:-비어 있음}) — SMS 링크에 쓰입니다"
fi

if grep -qE '^[[:space:]]*spring\.redis\.' "${CONFIG}"; then
  warn "spring.redis.* 는 Spring Boot 3 에서 무시됩니다 — spring.data.redis.* 로 이름을 바꾸세요"
fi

# ----------------------------------------------------------------
# 8. 실행 환경
# ----------------------------------------------------------------
if command -v java >/dev/null 2>&1; then
  JAVA_MAJOR="$(java -version 2>&1 | grep -m1 ' version ' | sed -E 's/.*version "([0-9]+).*/\1/')"
  if [[ "${JAVA_MAJOR}" == "21" ]]; then ok "Java 21"; else warn "Java ${JAVA_MAJOR} — 프로젝트는 Java 21 기준"; fi
else
  fail "java 없음"
fi
if ss -tln 2>/dev/null | grep -q ':3306 '; then ok "MySQL 3306 LISTEN"; else fail "MySQL(3306) 미기동"; fi
if ss -tln 2>/dev/null | grep -q ':6379 '; then ok "Redis 6379 LISTEN"; else fail "Redis(6379) 미기동 — sudo docker start ondo-redis"; fi

echo "=== FAIL ${FAILS} / WARN ${WARNS} ==="
if (( FAILS > 0 )); then
  exit 1
fi
exit 0
