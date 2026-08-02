#!/usr/bin/env bash
# Jenkins / 수동 배포 — EC2에서 JAR·React 배포 및 API 재시작
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/ondo}"
NGINX_HTML="${NGINX_HTML:-/usr/share/nginx/html}"
WORKSPACE="${WORKSPACE:-$(cd "$(dirname "$0")/../.." && pwd)}"

BN_DIR="${WORKSPACE}/BN"
FN_DIR="${WORKSPACE}/FN"
JAR_PATH="$(ls -1 "${BN_DIR}"/build/libs/*.jar 2>/dev/null | head -1 || true)"

echo "=== Deploy Ondo ==="
echo "WORKSPACE=${WORKSPACE}"

if [[ -z "${JAR_PATH}" || ! -f "${JAR_PATH}" ]]; then
  echo "FAIL: JAR not found. Run: cd BN && ./gradlew bootJar"
  exit 1
fi

if [[ ! -d "${FN_DIR}/dist" ]]; then
  echo "FAIL: FN/dist not found. Run: cd FN && npm ci && VITE_API_BASE= npm run build"
  exit 1
fi

sudo mkdir -p "${APP_ROOT}/app" "${NGINX_HTML}"
sudo cp "${JAR_PATH}" "${APP_ROOT}/app/ondo.jar"
sudo chown ec2-user:ec2-user "${APP_ROOT}/app/ondo.jar"

sudo rm -rf "${NGINX_HTML:?}"/*
sudo cp -r "${FN_DIR}/dist/"* "${NGINX_HTML}/"

if sudo docker ps -a --format '{{.Names}}' | grep -qx 'ondo-redis'; then
  sudo docker start ondo-redis >/dev/null 2>&1 || true
fi

sudo systemctl restart ondo-api
sleep 3

if ! sudo systemctl is-active --quiet ondo-api; then
  echo "FAIL: ondo-api not active"
  sudo systemctl status ondo-api --no-pager || true
  exit 1
fi

if command -v nginx >/dev/null; then
  sudo nginx -t
  sudo systemctl reload nginx
fi

HTTP_CODE="$(curl -s -o /dev/null -w '%{http_code}' \
  -G 'http://127.0.0.1:8081/api/schools/search' --data-urlencode 'keyword=서울' || true)"
echo "API health: HTTP ${HTTP_CODE}"

if [[ "${HTTP_CODE}" != "200" ]]; then
  echo "WARN: API returned ${HTTP_CODE} (check logs: journalctl -u ondo-api -n 50)"
  exit 1
fi

echo "Deploy OK"
