#!/usr/bin/env bash
# EC2 1회 초기 설정 (sudo). Jenkins·systemd·Nginx·디렉터리 준비
set -euo pipefail

APP_USER="${APP_USER:-ec2-user}"
APP_ROOT="${APP_ROOT:-/opt/ondo}"
REPO_ROOT="${REPO_ROOT:-/home/${APP_USER}/Ondo_Project}"

echo "=== Ondo EC2 deploy layout ==="
sudo mkdir -p "${APP_ROOT}/app" "${APP_ROOT}/config" "${APP_ROOT}/logs"
sudo chown -R "${APP_USER}:${APP_USER}" "${APP_ROOT}"

if [[ -f "${REPO_ROOT}/BN/config/application-prod.properties" ]]; then
  sudo cp "${REPO_ROOT}/BN/config/application-prod.properties" "${APP_ROOT}/config/application-prod.properties"
  sudo chown "${APP_USER}:${APP_USER}" "${APP_ROOT}/config/application-prod.properties"
  echo "Copied application-prod.properties -> ${APP_ROOT}/config/"
else
  echo "WARN: ${REPO_ROOT}/BN/config/application-prod.properties 없음 — 수동으로 ${APP_ROOT}/config/ 에 두세요."
fi

sudo cp "${REPO_ROOT}/BN/scripts/ondo-api.service" /etc/systemd/system/ondo-api.service
sudo systemctl daemon-reload
sudo systemctl enable ondo-api

if [[ -f "${REPO_ROOT}/BN/scripts/nginx-ondo.conf" ]]; then
  sudo cp "${REPO_ROOT}/BN/scripts/nginx-ondo.conf" /etc/nginx/conf.d/ondo.conf
  sudo nginx -t
  sudo systemctl enable nginx
  sudo systemctl start nginx || true
fi

# Jenkins가 sudo 로 배포·재시작 (비밀번호 없이)
JENKINS_SUDOERS="/etc/sudoers.d/jenkins-ondo"
if id jenkins &>/dev/null; then
  echo "jenkins ALL=(ALL) NOPASSWD: /bin/systemctl restart ondo-api, /bin/systemctl status ondo-api, /bin/systemctl is-active ondo-api, /usr/sbin/nginx, /bin/cp, /usr/bin/cp, /bin/mkdir, /usr/bin/mkdir, /bin/chown, /usr/bin/chown, /usr/bin/docker" | sudo tee "${JENKINS_SUDOERS}" >/dev/null
  sudo chmod 440 "${JENKINS_SUDOERS}"
  echo "sudoers for jenkins configured: ${JENKINS_SUDOERS}"
else
  echo "WARN: jenkins 사용자 없음 — Jenkins 설치 후 이 스크립트를 다시 실행하세요."
fi

echo ""
echo "Done. Next:"
echo "  1) Edit ${APP_ROOT}/config/application-prod.properties if needed"
echo "  2) sudo docker start ondo-redis  (or create container)"
echo "  3) Jenkins job: Pipeline from SCM, script path Jenkinsfile"
echo "  4) First deploy: Build Now"
