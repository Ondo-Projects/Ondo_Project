#!/usr/bin/env bash
# Ondo DB 자동 백업 설치 — 매일 새벽 4시(한국 시간) systemd 타이머로 backup-db.sh 실행
#
# 사용 (EC2, repo 루트):  sudo bash BN/scripts/setup-backup.sh
# 여러 번 실행해도 안전합니다. 설치 후 바로 한 번 백업을 실행해 동작을 확인합니다.
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  exec sudo -- "$0" "$@"
fi

SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
APP_ROOT="/opt/ondo"

echo "=== 1. 백업 스크립트 설치 (root 소유) ==="
install -d -o root -g root -m 755 "${APP_ROOT}/bin"
install -o root -g root -m 755 "${SCRIPT_DIR}/backup-db.sh" "${APP_ROOT}/bin/backup-db.sh"
install -d -o root -g root -m 700 /var/backups/ondo
echo "OK: ${APP_ROOT}/bin/backup-db.sh"

echo "=== 2. mysqldump 확인 ==="
if ! command -v mysqldump >/dev/null 2>&1; then
  dnf install -y mariadb105 >/dev/null 2>&1 || dnf install -y mysql >/dev/null 2>&1 || true
fi
command -v mysqldump >/dev/null 2>&1 || { echo "FAIL: mysqldump 설치 실패 — 수동 설치 필요"; exit 1; }
echo "OK: $(mysqldump --version)"

echo "=== 3. systemd 타이머 설치 ==="
cat > /etc/systemd/system/ondo-db-backup.service <<EOF
[Unit]
Description=Ondo DB backup (mysqldump)
After=network-online.target mysqld.service mariadb.service

[Service]
Type=oneshot
ExecStart=${APP_ROOT}/bin/backup-db.sh
Nice=10
IOSchedulingClass=idle
EOF

cat > /etc/systemd/system/ondo-db-backup.timer <<'EOF'
[Unit]
Description=Daily Ondo DB backup

[Timer]
OnCalendar=*-*-* 04:07:00 Asia/Seoul
RandomizedDelaySec=10m
Persistent=true

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable --now ondo-db-backup.timer
systemctl list-timers ondo-db-backup.timer --no-pager || true

echo "=== 4. 지금 한 번 백업 실행 ==="
if systemctl start ondo-db-backup.service; then
  journalctl -u ondo-db-backup.service -n 15 --no-pager -o cat
  echo ""
  echo "Done. 백업 위치: /var/backups/ondo  (sudo ls -lh /var/backups/ondo)"
else
  echo "FAIL: 첫 백업 실패 — sudo journalctl -u ondo-db-backup.service -n 40 --no-pager"
  exit 1
fi
