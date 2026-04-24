#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
# restore.sh — Restore Postgres từ backup B2
#
# Dùng khi:
#   - DB hỏng
#   - Test khả năng restore (tháng 1 lần)
#   - Clone data qua staging
#
# Chạy:
#   ./scripts/restore.sh 2026-04-24_0300
#   (nếu không truyền arg → dùng bản mới nhất)
# ══════════════════════════════════════════════════════════════════

set -euo pipefail

BUCKET="traotay-backups"
DATE="${1:-}"

if [ -f /opt/traotay/.env.docker ]; then
  set -a
  # shellcheck disable=SC1091
  source /opt/traotay/.env.docker
  set +a
fi

# Nếu không có DATE → lấy file mới nhất
if [ -z "$DATE" ]; then
  echo ">>> Tìm backup mới nhất trên B2..."
  LATEST=$(rclone lsf "b2:${BUCKET}/db/" | sort | tail -1)
  if [ -z "$LATEST" ]; then
    echo "❌ Không tìm thấy backup nào"
    exit 1
  fi
  FILE="$LATEST"
else
  FILE="db-${DATE}.sql.gz"
fi

echo ">>> Download $FILE..."
TMPDIR="/tmp/traotay-restore-$$"
mkdir -p "$TMPDIR"
trap 'rm -rf "$TMPDIR"' EXIT

rclone copy "b2:${BUCKET}/db/${FILE}" "$TMPDIR/"

# Xác nhận
echo ""
echo "⚠️  SẮP RESTORE — TOÀN BỘ DATA HIỆN TẠI SẼ BỊ GHI ĐÈ"
echo "   File: $FILE"
echo "   Size: $(du -h "$TMPDIR/$FILE" | cut -f1)"
echo "   DB target: ${POSTGRES_DB:-traotay}"
read -rp ">>> Gõ 'YES' để xác nhận: " CONFIRM
if [ "$CONFIRM" != "YES" ]; then
  echo "Huỷ."
  exit 0
fi

# Restore
echo ">>> Restore..."
gunzip < "$TMPDIR/$FILE" | docker exec -i traotay_db \
  psql -U "${POSTGRES_USER:-postgres}" "${POSTGRES_DB:-traotay}"

echo ""
echo "✅ Restore xong từ $FILE"
echo "   Restart backend để load lại connection pool:"
echo "   docker compose -f docker-compose.prod.yml restart backend"
