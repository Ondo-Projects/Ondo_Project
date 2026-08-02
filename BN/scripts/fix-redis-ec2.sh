#!/usr/bin/env bash
# Amazon Linux EC2 — redis6.service Permission denied / start failure fix
# Usage: cd BN && bash scripts/fix-redis-ec2.sh
set -u

REDIS_CONF="/etc/redis/redis6.conf"
REDIS_USER="redis"
REDIS_GROUP="redis"

echo "=== Redis6 EC2 fix script ==="

if [[ ! -f "$REDIS_CONF" ]]; then
  echo "redis6.conf 없음. 설치: sudo dnf install -y redis6"
  exit 1
fi

if ! id "$REDIS_USER" &>/dev/null; then
  echo "redis 사용자 없음. sudo dnf reinstall -y redis6"
  exit 1
fi

echo "=== 1. Stop service ==="
sudo systemctl stop redis6 2>/dev/null || true
sudo systemctl reset-failed redis6 2>/dev/null || true

echo "=== 2. Directories & ownership ==="
sudo mkdir -p /var/lib/redis /var/log/redis /run/redis
sudo touch /var/log/redis/redis6.log
sudo chown -R "$REDIS_USER:$REDIS_GROUP" /var/lib/redis /var/log/redis /run/redis
sudo chmod 750 /var/lib/redis
sudo chmod 755 /var/log/redis /run/redis
sudo chmod 644 /var/log/redis/redis6.log

echo "=== 3. Backup possibly broken persistence files ==="
for f in /var/lib/redis/dump.rdb /var/lib/redis/appendonly.aof; do
  if [[ -f "$f" ]]; then
    sudo mv "$f" "${f}.bak.$(date +%s)" 2>/dev/null || true
  fi
done
sudo chown -R "$REDIS_USER:$REDIS_GROUP" /var/lib/redis

echo "=== 4. Patch redis6.conf (systemd-friendly) ==="
sudo cp -a "$REDIS_CONF" "${REDIS_CONF}.bak.$(date +%s)"

patch_kv() {
  local key="$1"
  local value="$2"
  if sudo grep -q "^${key} " "$REDIS_CONF" 2>/dev/null; then
    sudo sed -i "s|^${key} .*|${key} ${value}|" "$REDIS_CONF"
  elif sudo grep -q "^# *${key} " "$REDIS_CONF" 2>/dev/null; then
    sudo sed -i "s|^# *${key} .*|${key} ${value}|" "$REDIS_CONF"
  else
    echo "${key} ${value}" | sudo tee -a "$REDIS_CONF" >/dev/null
  fi
}

patch_kv "daemonize" "no"
patch_kv "supervised" "systemd"
patch_kv "dir" "/var/lib/redis"
patch_kv "logfile" "/var/log/redis/redis6.log"
patch_kv "pidfile" "/run/redis/redis6.pid"
patch_kv "bind" "127.0.0.1"
patch_kv "port" "6379"

echo "=== 5. SELinux (if Enforcing) ==="
if command -v getenforce >/dev/null 2>&1 && [[ "$(getenforce)" == "Enforcing" ]]; then
  echo "SELinux Enforcing — redis 컨텍스트 적용"
  sudo chcon -R -t redis_var_lib_t /var/lib/redis 2>/dev/null || true
  sudo chcon -t redis_log_t /var/log/redis/redis6.log 2>/dev/null || true
  sudo restorecon -Rv /var/lib/redis /var/log/redis 2>/dev/null || true
fi

echo "=== 6. Foreground test (실제 에러 확인) ==="
set +e
TEST_OUT="$(timeout 3 sudo -u "$REDIS_USER" /usr/bin/redis-server "$REDIS_CONF" 2>&1)"
TEST_CODE=$?
set -e
if [[ $TEST_CODE -ne 0 && $TEST_CODE -ne 124 ]]; then
  echo "$TEST_OUT"
  echo ""
  echo "FAIL: redis-server foreground test failed (exit $TEST_CODE)"
  echo "위 메시지를 확인하세요."
  exit 1
fi
echo "Foreground test OK (or timeout after start — normal)"

echo "=== 7. Start systemd service ==="
sudo systemctl daemon-reload
sudo systemctl enable redis6
sudo systemctl start redis6
sleep 1

if systemctl is-active --quiet redis6; then
  echo "SUCCESS: redis6.service is active"
  redis-cli ping
  exit 0
fi

echo "FAIL: redis6.service still not running"
echo "--- systemctl status ---"
sudo systemctl status redis6 -l --no-pager || true
echo "--- journalctl ---"
sudo journalctl -u redis6.service --no-pager | tail -25
echo ""
echo "=== Fallback: Docker Redis (6379) ==="
echo "  sudo dnf install -y docker"
echo "  sudo systemctl enable --now docker"
echo "  sudo docker run -d --name ondo-redis --restart unless-stopped -p 6379:6379 redis:7-alpine"
exit 1
