#!/usr/bin/env bash
# EC2 1회 초기 설정 (sudo). Jenkins·systemd·Nginx·디렉터리 준비
set -euo pipefail

APP_USER="${APP_USER:-ec2-user}"
APP_ROOT="${APP_ROOT:-/opt/ondo}"
REPO_ROOT="${REPO_ROOT:-/home/${APP_USER}/Ondo_Project}"

echo "=== Ondo EC2 deploy layout ==="
sudo mkdir -p "${APP_ROOT}/app" "${APP_ROOT}/config" "${APP_ROOT}/logs"
sudo chown "${APP_USER}:${APP_USER}" "${APP_ROOT}"
sudo chown -R "${APP_USER}:${APP_USER}" "${APP_ROOT}/app" "${APP_ROOT}/config" "${APP_ROOT}/logs"
sudo chmod 700 "${APP_ROOT}/config"

# 운영 설정이 이미 있으면 절대 덮어쓰지 않음 (암호화 키·DB 계정이 바뀌어 있을 수 있음)
if [[ -f "${APP_ROOT}/config/application-prod.properties" ]]; then
  echo "OK: ${APP_ROOT}/config/application-prod.properties 이미 있음 — 덮어쓰지 않습니다."
elif [[ -f "${REPO_ROOT}/BN/config/application-prod.properties" ]]; then
  sudo cp "${REPO_ROOT}/BN/config/application-prod.properties" "${APP_ROOT}/config/application-prod.properties"
  sudo chown "${APP_USER}:${APP_USER}" "${APP_ROOT}/config/application-prod.properties"
  sudo chmod 600 "${APP_ROOT}/config/application-prod.properties"
  echo "Copied application-prod.properties -> ${APP_ROOT}/config/"
else
  echo "WARN: ${REPO_ROOT}/BN/config/application-prod.properties 없음 — 수동으로 ${APP_ROOT}/config/ 에 두세요."
fi

sudo cp "${REPO_ROOT}/BN/scripts/ondo-api.service" /etc/systemd/system/ondo-api.service
sudo systemctl daemon-reload
sudo systemctl enable ondo-api

# nginx 설정은 HTTPS(443) 포함 — 인증서가 있어야 적용 가능
# 인증서 발급·갱신·nginx 적용은 setup-https.sh 가 담당합니다.
if sudo test -f /etc/letsencrypt/live/ondo.ai.kr/fullchain.pem; then
  if [[ -f /etc/nginx/conf.d/ondo.conf ]]; then
    sudo cp -a /etc/nginx/conf.d/ondo.conf "/etc/nginx/conf.d/ondo.conf.bak.$(date +%s)"
  fi
  sudo cp "${REPO_ROOT}/BN/scripts/nginx-ondo.conf" /etc/nginx/conf.d/ondo.conf
  sudo nginx -t
  sudo systemctl enable nginx
  sudo systemctl reload nginx || sudo systemctl start nginx
else
  echo "WARN: 인증서 없음 — nginx 설정은 건너뜁니다."
  echo "      EMAIL=you@example.com sudo -E bash ${REPO_ROOT}/BN/scripts/setup-https.sh"
fi

# ----------------------------------------------------------------
# 배포 스크립트 설치 (root 소유 — Jenkins가 내용을 바꿀 수 없음)
# repo의 deploy-ec2.sh 를 고쳤다면 이 스크립트를 다시 실행해야 Jenkins 배포에 반영됩니다.
# ----------------------------------------------------------------
sudo install -d -o root -g root -m 755 "${APP_ROOT}/bin"
sudo install -o root -g root -m 755 "${REPO_ROOT}/BN/scripts/deploy-ec2.sh" "${APP_ROOT}/bin/deploy-ec2.sh"
sudo install -o root -g root -m 755 "${REPO_ROOT}/BN/scripts/ec2-preflight.sh" "${APP_ROOT}/bin/ec2-preflight.sh"
echo "Installed ${APP_ROOT}/bin/deploy-ec2.sh, ec2-preflight.sh"

# ----------------------------------------------------------------
# Jenkins sudo 권한 — 배포 스크립트 하나만 허용
# (예전에는 cp·chown·docker 등을 허용해 사실상 root 권한이었음)
# ----------------------------------------------------------------
JENKINS_SUDOERS="/etc/sudoers.d/jenkins-ondo"
if id jenkins &>/dev/null; then
  TMP_SUDOERS="$(mktemp)"
  echo "jenkins ALL=(root) NOPASSWD: ${APP_ROOT}/bin/deploy-ec2.sh" > "${TMP_SUDOERS}"
  if sudo visudo -cf "${TMP_SUDOERS}" >/dev/null; then
    sudo install -o root -g root -m 440 "${TMP_SUDOERS}" "${JENKINS_SUDOERS}"
    echo "sudoers for jenkins configured: ${JENKINS_SUDOERS}"
  else
    echo "FAIL: sudoers 문법 오류 — 적용하지 않았습니다."
  fi
  rm -f "${TMP_SUDOERS}"
else
  echo "WARN: jenkins 사용자 없음 — Jenkins 설치 후 이 스크립트를 다시 실행하세요."
fi

echo ""
echo "Done. Next:"
echo "  1) Edit ${APP_ROOT}/config/application-prod.properties if needed"
echo "  2) sudo docker start ondo-redis  (or create container)"
echo "  3) Jenkins job: Pipeline from SCM, script path Jenkinsfile"
echo "  4) First deploy: Build Now"
