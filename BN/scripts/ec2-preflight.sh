#!/usr/bin/env bash
# EC2에서 Spring Boot 기동 전 점검. 사용: cd BN && bash scripts/ec2-preflight.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== 1. 작업 디렉터리 ==="
pwd

echo "=== 2. Java ==="
java -version 2>&1 | head -1 || { echo "Java 없음"; exit 1; }

echo "=== 3. 설정 파일 (example 은 로드되지 않음) ==="
if [[ -f config/application-prod.properties ]]; then
  echo "OK: config/application-prod.properties 존재"
else
  echo "FAIL: config/application-prod.properties 없음"
  echo "      cp config/application-prod.properties.example config/application-prod.properties"
  echo "      nano config/application-prod.properties"
  exit 1
fi

if [[ -f config/application-local.properties ]]; then
  echo "WARN: application-local.properties 도 있음 — prod 와 충돌할 수 있음"
  echo "      mv config/application-local.properties config/application-local.properties.bak 권장"
fi

echo "=== 4. MySQL (3306) ==="
if ss -tlnp 2>/dev/null | grep -q ':3306'; then
  echo "OK: 3306 LISTEN"
else
  echo "FAIL: MySQL/MariaDB 미기동"
  echo "      sudo systemctl start mariadb  또는  mysqld"
  exit 1
fi

echo "=== 5. Redis (6379) ==="
if redis-cli ping 2>/dev/null | grep -q PONG; then
  echo "OK: Redis PONG"
else
  echo "FAIL: Redis 미기동"
  echo "      sudo systemctl start redis6  또는  redis"
  exit 1
fi

echo "=== 6. 필수 설정 키 ==="
for key in spring.datasource.url spring.datasource.password ondo.jwt.secret; do
  if grep -q "^${key}=" config/application-prod.properties; then
    echo "OK: $key"
  else
    echo "FAIL: $key 없음"
    exit 1
  fi
done

if grep -q 'your-rds-endpoint\|your-db-password' config/application-prod.properties; then
  echo "FAIL: placeholder 값 그대로 — DB 주소/비번 수정 필요"
  exit 1
fi

echo "=== 7. 암호화 dev-mode ==="
if grep -q '^ondo.encryption.dev-mode=false' config/application-prod.properties; then
  if ! grep -q '^ondo.encryption.key=.\+' config/application-prod.properties; then
    echo "FAIL: dev-mode=false 인데 encryption.key 없음"
    exit 1
  fi
fi

echo ""
echo "=== preflight 통과. 기동: ==="
echo "  cd $ROOT"
echo "  export SPRING_PROFILES_ACTIVE=prod"
echo "  ./gradlew bootRun --no-daemon"
