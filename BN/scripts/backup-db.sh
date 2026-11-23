#!/usr/bin/env bash
# Ondo 운영 DB 백업 — mysqldump → gzip → /var/backups/ondo (선택: S3 복사)
#
# 사용:   sudo bash BN/scripts/backup-db.sh
# 자동:   setup-backup.sh 가 설치한 systemd 타이머(ondo-db-backup.timer)가 매일 실행
#
# - DB 접속 정보는 /opt/ondo/config/application-prod.properties 에서 읽습니다.
# - 비밀번호는 명령줄·화면에 노출하지 않고 임시 설정 파일(권한 600)로 전달합니다.
# - 백업 파일에는 학생 개인정보가 들어 있으므로 root 만 읽을 수 있게 저장합니다.
# - S3 복사: /opt/ondo/config/backup.env 에 ONDO_BACKUP_S3_URI=s3://버킷/경로 를 넣으면 활성화됩니다.
set -euo pipefail
umask 077

CONFIG="${ONDO_CONFIG:-/opt/ondo/config/application-prod.properties}"
BACKUP_ENV="${ONDO_BACKUP_ENV:-/opt/ondo/config/backup.env}"
BACKUP_DIR="${ONDO_BACKUP_DIR:-/var/backups/ondo}"
KEEP_DAYS="${ONDO_BACKUP_KEEP_DAYS:-14}"

if [[ $EUID -ne 0 ]]; then
  exec sudo -- "$0" "$@"
fi

if [[ -f "${BACKUP_ENV}" ]]; then
  # shellcheck disable=SC1090
  source "${BACKUP_ENV}"
fi
S3_URI="${ONDO_BACKUP_S3_URI:-}"

prop() {
  grep -E "^[[:space:]]*${1//./\\.}[[:space:]]*=" "${CONFIG}" | tail -1 | cut -d= -f2- \
    | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's/\r$//'
}

if [[ ! -f "${CONFIG}" ]]; then
  echo "FAIL: 설정 파일 없음: ${CONFIG}"
  exit 1
fi

# jdbc:mysql://127.0.0.1:3306/ondo_DB?option=...
JDBC_URL="$(prop spring.datasource.url)"
DB_USER="$(prop spring.datasource.username)"
DB_PASS="$(prop spring.datasource.password)"
HOST_PORT_DB="${JDBC_URL#jdbc:mysql://}"
HOST_PORT_DB="${HOST_PORT_DB%%\?*}"
DB_NAME="${HOST_PORT_DB#*/}"
HOST_PORT="${HOST_PORT_DB%%/*}"
DB_HOST="${HOST_PORT%%:*}"
DB_PORT="3306"
if [[ "${HOST_PORT}" == *:* ]]; then
  DB_PORT="${HOST_PORT##*:}"
fi

if [[ -z "${DB_NAME}" || -z "${DB_USER}" || -z "${DB_HOST}" ]]; then
  echo "FAIL: spring.datasource.url / username 을 해석하지 못했습니다."
  exit 1
fi

command -v mysqldump >/dev/null 2>&1 || { echo "FAIL: mysqldump 없음 (sudo dnf install -y mariadb105 또는 mysql 클라이언트)"; exit 1; }

mkdir -p "${BACKUP_DIR}"
chmod 700 "${BACKUP_DIR}"

TIMESTAMP="$(TZ=Asia/Seoul date +%Y%m%d-%H%M)"
OUT="${BACKUP_DIR}/${DB_NAME}-${TIMESTAMP}.sql.gz"
TMP_OUT="${OUT}.partial"

# 비밀번호를 명령줄에 넣지 않기 위한 임시 설정 파일
DEFAULTS_FILE="$(mktemp)"
trap 'rm -f "${DEFAULTS_FILE}" "${TMP_OUT}"' EXIT
# 옵션 파일 따옴표 안에서는 \ 와 " 를 이스케이프해야 함
ESCAPED_PASS="${DB_PASS//\\/\\\\}"
ESCAPED_PASS="${ESCAPED_PASS//\"/\\\"}"
{
  echo "[client]"
  echo "user=${DB_USER}"
  echo "password=\"${ESCAPED_PASS}\""
  echo "host=${DB_HOST}"
  echo "port=${DB_PORT}"
} > "${DEFAULTS_FILE}"
unset DB_PASS ESCAPED_PASS

echo "=== Ondo DB 백업: ${DB_NAME} @ ${DB_HOST}:${DB_PORT} ==="

# --single-transaction: 서비스 중에도 일관된 스냅샷 (InnoDB), 테이블 잠금 없음
# --no-tablespaces: 전용 계정(ondo)에 PROCESS 권한이 없어도 동작
mysqldump --defaults-extra-file="${DEFAULTS_FILE}" \
  --single-transaction --quick --no-tablespaces \
  --default-character-set=utf8mb4 \
  --databases "${DB_NAME}" \
  | gzip -9 > "${TMP_OUT}"

# 검증: 압축이 깨지지 않았고, 덤프가 끝까지 기록됐는지
gzip -t "${TMP_OUT}"
if ! zcat "${TMP_OUT}" | tail -n 1 | grep -q "Dump completed"; then
  echo "FAIL: 덤프가 끝까지 기록되지 않았습니다."
  exit 1
fi
mv "${TMP_OUT}" "${OUT}"
chmod 600 "${OUT}"
echo "OK  : ${OUT} ($(du -h "${OUT}" | cut -f1))"

# 오래된 백업 정리
find "${BACKUP_DIR}" -name "${DB_NAME}-*.sql.gz" -type f -mtime +"${KEEP_DAYS}" -print -delete \
  | sed 's/^/삭제: /' || true
echo "보관 중: $(find "${BACKUP_DIR}" -name "${DB_NAME}-*.sql.gz" -type f | wc -l)개 (최근 ${KEEP_DAYS}일)"

# 서버 밖 보관 (선택)
if [[ -n "${S3_URI}" ]]; then
  if command -v aws >/dev/null 2>&1; then
    aws s3 cp "${OUT}" "${S3_URI%/}/$(basename "${OUT}")" --only-show-errors --sse AES256
    echo "OK  : S3 복사 → ${S3_URI%/}/$(basename "${OUT}")"
  else
    echo "FAIL: ONDO_BACKUP_S3_URI 가 설정됐지만 aws CLI 가 없습니다."
    exit 1
  fi
else
  echo "INFO: S3 복사 꺼짐 (서버 안에만 보관 중 — 서버가 망가지면 함께 사라집니다)"
fi

echo "Backup OK"
