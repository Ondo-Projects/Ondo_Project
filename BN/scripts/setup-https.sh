#!/usr/bin/env bash
# Ondo HTTPS(Let's Encrypt) 발급 + nginx 443 적용 + 자동 갱신 설정
#
# 사용 (EC2에서, repo 루트 기준):
#   EMAIL=you@example.com sudo -E bash BN/scripts/setup-https.sh
#
# 여러 번 실행해도 안전합니다. 인증서가 이미 있으면 발급은 건너뛰고 설정·갱신만 맞춥니다.
# 실행하면 Let's Encrypt 이용약관(https://letsencrypt.org/repository/)에 동의하는 것으로 처리됩니다.
set -euo pipefail

DOMAIN="${DOMAIN:-ondo.ai.kr}"
EMAIL="${EMAIL:-}"
WEBROOT="/var/www/certbot"
NGINX_CONF="/etc/nginx/conf.d/ondo.conf"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_CONF="${SCRIPT_DIR}/nginx-ondo.conf"
CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"

if [[ $EUID -ne 0 ]]; then
  echo "sudo 로 실행하세요: EMAIL=you@example.com sudo -E bash $0"
  exit 1
fi

if [[ ! -f "${REPO_CONF}" ]]; then
  echo "FAIL: ${REPO_CONF} 없음"
  exit 1
fi

echo "=== 1. DNS 확인 (${DOMAIN}) ==="
PUBLIC_IP="$(curl -s -m 5 https://checkip.amazonaws.com || true)"
DNS_IP="$(getent ahostsv4 "${DOMAIN}" | awk 'NR==1{print $1}' || true)"
echo "EC2 공인 IP : ${PUBLIC_IP:-알 수 없음}"
echo "DNS A 레코드: ${DNS_IP:-조회 실패}"
if [[ -n "${PUBLIC_IP}" && -n "${DNS_IP}" && "${PUBLIC_IP}" != "${DNS_IP}" ]]; then
  echo "FAIL: DNS가 이 서버를 가리키지 않습니다."
  echo "      도메인 관리 페이지에서 ${DOMAIN} A 레코드를 ${PUBLIC_IP} 로 바꾸고,"
  echo "      IP가 다시 바뀌지 않게 EC2에 Elastic IP를 연결하세요."
  exit 1
fi

echo "=== 2. certbot 설치 ==="
if ! command -v certbot >/dev/null 2>&1; then
  if ! dnf install -y certbot >/dev/null 2>&1; then
    echo "dnf 패키지가 없어 pip 가상환경으로 설치합니다 (/opt/certbot)"
    dnf install -y python3 python3-pip >/dev/null
    python3 -m venv /opt/certbot
    /opt/certbot/bin/pip install --upgrade pip certbot >/dev/null
    ln -sf /opt/certbot/bin/certbot /usr/bin/certbot
  fi
fi
CERTBOT="$(command -v certbot)"
echo "OK: ${CERTBOT} ($(${CERTBOT} --version 2>&1))"

mkdir -p "${WEBROOT}/.well-known/acme-challenge"

echo "=== 3. 인증서 ==="
if [[ -f "${CERT_DIR}/fullchain.pem" ]]; then
  echo "OK: 기존 인증서 있음 — 발급 건너뜀"
  "${CERTBOT}" certificates -d "${DOMAIN}" 2>/dev/null | grep -E 'Expiry|Domains' || true
else
  if [[ -z "${EMAIL}" ]]; then
    echo "FAIL: 인증서 발급에는 이메일이 필요합니다 (만료 알림용)."
    echo "      EMAIL=you@example.com sudo -E bash $0"
    exit 1
  fi

  # 인증서가 없으면 443 설정이 nginx -t 를 통과하지 못하므로, 발급용 임시 80 설정을 먼저 씁니다.
  if [[ -f "${NGINX_CONF}" ]]; then
    cp -a "${NGINX_CONF}" "${NGINX_CONF}.bak.$(date +%s)"
  fi
  cat > "${NGINX_CONF}" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    location ^~ /.well-known/acme-challenge/ {
        root ${WEBROOT};
        default_type "text/plain";
    }

    root /usr/share/nginx/html;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8081;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF
  nginx -t
  systemctl enable --now nginx
  systemctl reload nginx

  "${CERTBOT}" certonly --webroot -w "${WEBROOT}" -d "${DOMAIN}" \
    --email "${EMAIL}" --agree-tos --no-eff-email --non-interactive
fi

echo "=== 4. nginx 443 설정 적용 ==="
if [[ -f "${NGINX_CONF}" ]] && ! cmp -s "${REPO_CONF}" "${NGINX_CONF}"; then
  cp -a "${NGINX_CONF}" "${NGINX_CONF}.bak.$(date +%s)"
fi
cp "${REPO_CONF}" "${NGINX_CONF}"
nginx -t
systemctl reload nginx
echo "OK: ${NGINX_CONF}"

echo "=== 5. 자동 갱신 ==="
HOOK="/etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh"
mkdir -p "$(dirname "${HOOK}")"
cat > "${HOOK}" <<'EOF'
#!/usr/bin/env bash
nginx -t && systemctl reload nginx
EOF
chmod 755 "${HOOK}"

if systemctl list-unit-files 2>/dev/null | grep -q '^certbot-renew.timer'; then
  systemctl enable --now certbot-renew.timer
  TIMER="certbot-renew.timer"
else
  cat > /etc/systemd/system/ondo-certbot-renew.service <<EOF
[Unit]
Description=Renew Let's Encrypt certificates (Ondo)
After=network-online.target

[Service]
Type=oneshot
ExecStart=${CERTBOT} renew --quiet
EOF
  cat > /etc/systemd/system/ondo-certbot-renew.timer <<'EOF'
[Unit]
Description=Run certbot renew twice a day (Ondo)

[Timer]
OnCalendar=*-*-* 03,15:17:00
RandomizedDelaySec=1h
Persistent=true

[Install]
WantedBy=timers.target
EOF
  systemctl daemon-reload
  systemctl enable --now ondo-certbot-renew.timer
  TIMER="ondo-certbot-renew.timer"
fi
systemctl list-timers "${TIMER}" --no-pager || true

echo "갱신 리허설 (dry-run)..."
if "${CERTBOT}" renew --dry-run --cert-name "${DOMAIN}" >/dev/null 2>&1; then
  echo "OK: 자동 갱신 dry-run 성공"
else
  echo "WARN: dry-run 실패 — sudo certbot renew --dry-run 으로 메시지를 확인하세요"
fi

echo "=== 6. 접속 확인 ==="
HTTP_CODE="$(curl -s -o /dev/null -m 10 -w '%{http_code}' "https://${DOMAIN}/" || true)"
REDIRECT="$(curl -s -o /dev/null -m 10 -w '%{http_code}' "http://${DOMAIN}/" || true)"
echo "https://${DOMAIN}/ → HTTP ${HTTP_CODE}"
echo "http://${DOMAIN}/  → HTTP ${REDIRECT} (301 이면 정상)"
if [[ "${HTTP_CODE}" != "200" ]]; then
  echo "WARN: HTTPS 응답이 200이 아닙니다. EC2 보안 그룹 인바운드에 443(0.0.0.0/0) 이 열려 있는지 확인하세요."
fi

echo ""
echo "Done. 다음: /opt/ondo/config/application-prod.properties 의"
echo "      ondo.app.base-url=https://${DOMAIN} 로 바꾸고 sudo systemctl restart ondo-api"
