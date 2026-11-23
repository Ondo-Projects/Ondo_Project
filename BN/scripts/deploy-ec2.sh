#!/usr/bin/env bash
# Ondo 배포 — 빌드된 JAR·React를 EC2에 반영하고 API를 재시작
#
# 사용:
#   수동 (repo 루트에서):  sudo ./BN/scripts/deploy-ec2.sh
#   Jenkins:              sudo /opt/ondo/bin/deploy-ec2.sh "$WORKSPACE"
#
# - 반영 전 이전 JAR·React를 *.prev 로 보관합니다.
# - API가 HEALTH_TIMEOUT(기본 120초) 안에 응답하지 않으면 이전 버전으로 자동 롤백합니다.
# - root 로 실행됩니다. Jenkins sudo 권한은 이 스크립트의 /opt/ondo/bin 사본 하나만 허용합니다.
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  exec sudo -- "$0" "$@"
fi

APP_ROOT="/opt/ondo"
APP_USER="ec2-user"
NGINX_HTML="/usr/share/nginx/html"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-120}"
HEALTH_URL="http://127.0.0.1:8081/api/schools/search"

# 배포 원본을 가져와도 되는 위치 (Jenkins 작업공간, ec2-user 홈의 repo)
ALLOWED_ROOTS=("/var/lib/jenkins/workspace" "/home/${APP_USER}")

# ----------------------------------------------------------------
# 1. 작업공간 확인
# ----------------------------------------------------------------
if [[ $# -ge 1 ]]; then
  WORKSPACE="$1"
else
  WORKSPACE="$(cd "$(dirname "$(readlink -f "$0")")/../.." && pwd)"
fi
WORKSPACE="$(readlink -f "${WORKSPACE}")"

allowed=false
for root in "${ALLOWED_ROOTS[@]}"; do
  if [[ "${WORKSPACE}" == "${root}"/* ]]; then
    allowed=true
  fi
done
if [[ "${allowed}" != true ]]; then
  echo "FAIL: 허용되지 않은 작업공간입니다: ${WORKSPACE}"
  exit 1
fi

BN_DIR="${WORKSPACE}/BN"
FN_DIST="${WORKSPACE}/FN/dist"

echo "=== Deploy Ondo ==="
echo "WORKSPACE=${WORKSPACE}"

# ----------------------------------------------------------------
# 2. 배포 파일 확인 (fat JAR만, 심볼릭 링크 금지)
# ----------------------------------------------------------------
JAR_PATH="$(ls -1 "${BN_DIR}"/build/libs/ondo-*.jar 2>/dev/null | grep -v -- '-plain\.jar$' | head -1 || true)"

if [[ -z "${JAR_PATH}" || ! -f "${JAR_PATH}" || -L "${JAR_PATH}" ]]; then
  echo "FAIL: 실행 JAR가 없습니다. 먼저: cd BN && ./gradlew bootJar"
  exit 1
fi
if (( $(stat -c %s "${JAR_PATH}") < 10 * 1024 * 1024 )); then
  echo "FAIL: JAR가 너무 작습니다 ($(du -h "${JAR_PATH}" | cut -f1)) — plain JAR일 수 있습니다: ${JAR_PATH}"
  exit 1
fi

if [[ ! -d "${FN_DIST}" || -L "${FN_DIST}" || ! -f "${FN_DIST}/index.html" ]]; then
  echo "FAIL: FN/dist 가 없습니다. 먼저: cd FN && npm ci && VITE_API_BASE= npm run build"
  exit 1
fi
if [[ -n "$(find "${FN_DIST}" -type l -print -quit)" ]]; then
  echo "FAIL: FN/dist 안에 심볼릭 링크가 있습니다 — 배포를 중단합니다."
  exit 1
fi

echo "JAR : ${JAR_PATH} ($(du -h "${JAR_PATH}" | cut -f1))"

# ----------------------------------------------------------------
# 3. 헬스체크 — 200 이 올 때까지 최대 HEALTH_TIMEOUT 초 대기
# ----------------------------------------------------------------
wait_for_health() {
  local waited=0 code="000"
  while (( waited < HEALTH_TIMEOUT )); do
    code="$(curl -s -o /dev/null -m 5 -w '%{http_code}' -G "${HEALTH_URL}" --data-urlencode 'keyword=서울' || true)"
    if [[ "${code}" == "200" ]]; then
      echo "API health: HTTP 200 (${waited}초)"
      return 0
    fi
    sleep 3
    waited=$(( waited + 3 ))
  done
  echo "API health: HTTP ${code} — ${HEALTH_TIMEOUT}초 안에 응답 없음"
  return 1
}

# ----------------------------------------------------------------
# 4. 이전 버전 보관
# ----------------------------------------------------------------
mkdir -p "${APP_ROOT}/app"
if [[ -f "${APP_ROOT}/app/ondo.jar" ]]; then
  cp -p "${APP_ROOT}/app/ondo.jar" "${APP_ROOT}/app/ondo.jar.prev"
fi

# ----------------------------------------------------------------
# 5. 새 버전 반영 (React는 새 폴더에 복사한 뒤 교체 → 빈 화면 시간 최소화)
# ----------------------------------------------------------------
install -o "${APP_USER}" -g "${APP_USER}" -m 644 "${JAR_PATH}" "${APP_ROOT}/app/ondo.jar.new"
mv -f "${APP_ROOT}/app/ondo.jar.new" "${APP_ROOT}/app/ondo.jar"

rm -rf "${NGINX_HTML}.new"
mkdir -p "${NGINX_HTML}.new"
cp -r "${FN_DIST}/." "${NGINX_HTML}.new/"
chmod -R a+rX "${NGINX_HTML}.new"
rm -rf "${NGINX_HTML}.prev"
if [[ -d "${NGINX_HTML}" ]]; then
  mv "${NGINX_HTML}" "${NGINX_HTML}.prev"
fi
mv "${NGINX_HTML}.new" "${NGINX_HTML}"

if docker ps -a --format '{{.Names}}' 2>/dev/null | grep -qx 'ondo-redis'; then
  docker start ondo-redis >/dev/null 2>&1 || true
fi

systemctl restart ondo-api

if wait_for_health; then
  echo "Deploy OK"
  exit 0
fi

# ----------------------------------------------------------------
# 6. 실패 → 이전 버전으로 롤백
# ----------------------------------------------------------------
echo "FAIL: 새 버전이 응답하지 않습니다. 최근 로그:"
journalctl -u ondo-api -n 60 --no-pager | grep -iE 'error|exception|caused' | tail -10 || true

if [[ ! -f "${APP_ROOT}/app/ondo.jar.prev" ]]; then
  echo "롤백할 이전 JAR가 없습니다. journalctl -u ondo-api -n 80 으로 원인을 확인하세요."
  exit 1
fi

echo "=== 이전 버전으로 롤백 ==="
cp -p "${APP_ROOT}/app/ondo.jar.prev" "${APP_ROOT}/app/ondo.jar"
if [[ -d "${NGINX_HTML}.prev" ]]; then
  rm -rf "${NGINX_HTML}"
  mv "${NGINX_HTML}.prev" "${NGINX_HTML}"
fi
systemctl restart ondo-api

if wait_for_health; then
  echo "ROLLBACK OK — 이전 버전으로 서비스 중입니다. 새 버전은 배포되지 않았습니다."
else
  echo "ROLLBACK FAIL — 이전 버전도 응답하지 않습니다. 설정·DB·Redis 상태를 확인하세요."
fi
exit 1
