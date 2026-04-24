#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
# backup.sh — Backup Postgres + MinIO lên Backblaze B2
#
# Chạy daily qua cron (3h sáng):
#   0 3 * * * /opt/traotay/scripts/backup.sh >> /var/log/traotay-backup.log 2>&1
#
# Setup rclone trước:
#   rclone config
#   → n (new remote)
#   → name: b2
#   → storage: b2
#   → account: <Backblaze Key ID>
#   → key: <Backblaze Application Key>
#   → ...
# ══════════════════════════════════════════════════════════════════

set -euo pipefail

BUCKET="traotay-backups"             # Bucket B2 (tạo trước trên backblaze.com)
RETENTION_DAYS=30                     # Xóa backup cũ hơn 30 ngày
TMPDIR="/tmp/traotay-backup-$(date +%s)"
DATE=$(date +%Y-%m-%d_%H%M)

# Load env để lấy POSTGRES_USER/PASSWORD/DB
if [ -f /opt/traotay/.env.docker ]; then
  set -a
  # shellcheck disable=SC1091
  source /opt/traotay/.env.docker
  set +a
fi

mkdir -p "$TMPDIR"
trap 'rm -rf "$TMPDIR"' EXIT

# ─── [1/3] Postgres dump ────────────────────────────────────────────
echo ">>> [$(date)] Backup Postgres → $TMPDIR"
docker exec traotay_db pg_dump \
  -U "${POSTGRES_USER:-postgres}" \
  "${POSTGRES_DB:-traotay}" \
  | gzip > "$TMPDIR/db-${DATE}.sql.gz"

DB_SIZE=$(du -h "$TMPDIR/db-${DATE}.sql.gz" | cut -f1)
echo "    DB backup: $DB_SIZE"

# ─── [2/3] Upload lên B2 ────────────────────────────────────────────
echo ">>> Upload Postgres dump lên b2:$BUCKET/db/"
rclone copy "$TMPDIR/db-${DATE}.sql.gz" "b2:${BUCKET}/db/" --progress

echo ">>> Sync MinIO ảnh lên b2:$BUCKET/minio/"
# Dùng sync thay vì copy — chỉ upload file mới/thay đổi
# MinIO data volume mount tại /var/lib/docker/volumes/traotay_minio_data/_data
rclone sync /var/lib/docker/volumes/traotay_minio_data/_data \
  "b2:${BUCKET}/minio/" \
  --transfers 4 \
  --fast-list

# ─── [3/3] Dọn backup cũ trên B2 ────────────────────────────────────
echo ">>> Xóa backup DB cũ hơn ${RETENTION_DAYS} ngày..."
rclone delete "b2:${BUCKET}/db/" \
  --min-age "${RETENTION_DAYS}d"

# ─── Alert nếu có lỗi qua Resend ────────────────────────────────────
# (Optional — thêm sau khi Resend đã verify domain)
# if [ $? -ne 0 ]; then
#   curl -X POST https://api.resend.com/emails ...
# fi

echo ""
echo "✅ Backup xong $(date)"
