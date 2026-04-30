#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
# backup.sh — Backup Postgres + MinIO local + Backblaze B2
#
# 2-tier backup strategy:
#   - Local: /opt/traotay/backups/db-*.sql.gz (giữ 14 ngày, recovery nhanh)
#   - Cloud B2: bucket traotay-backup-prod/ (giữ 30 ngày, disaster recovery)
#
# Cron daily 3h sáng VN (= 20:00 UTC), chạy bằng root:
#   0 20 * * * /opt/traotay/repo/scripts/backup.sh >> /var/log/traotay-backup.log 2>&1
#
# Setup rclone (1 lần):
#   sudo mkdir -p /root/.config/rclone
#   sudo tee /root/.config/rclone/rclone.conf <<EOF
#   [b2]
#   type = b2
#   account = <keyID 25 chars>
#   key = <applicationKey K00x...>
#   hard_delete = true
#   EOF
#   sudo chmod 600 /root/.config/rclone/rclone.conf
#
# Test thủ công:
#   sudo /opt/traotay/repo/scripts/backup.sh
# ══════════════════════════════════════════════════════════════════

set -euo pipefail

BUCKET="traotay-backup-prod"                          # Bucket B2 đã tạo
RETENTION_DAYS_LOCAL=14                                # Local backup retention
RETENTION_DAYS_B2=30                                   # B2 backup retention
LOCAL_DIR=/opt/traotay/backups
DATE=$(date +%Y-%m-%d_%H%M)
DB_FILE="db-${DATE}.sql.gz"
MINIO_VOLUME=/var/lib/docker/volumes/repo_minio_data/_data

# Đọc credentials DB từ .env.docker (avoid sourcing whole file vì có FCM JSON multi-line)
PGUSER=$(grep '^POSTGRES_USER=' /opt/traotay/repo/.env.docker | cut -d= -f2)
PGDB=$(grep '^POSTGRES_DB=' /opt/traotay/repo/.env.docker | cut -d= -f2)

mkdir -p "$LOCAL_DIR"
chown traotay:traotay "$LOCAL_DIR"

# ─── [1/4] Postgres dump → local ─────────────────────────────────────
echo ">>> [$(date)] Dump Postgres → ${LOCAL_DIR}/${DB_FILE}"
docker exec traotay_db pg_dump -U "$PGUSER" "$PGDB" \
  | gzip > "${LOCAL_DIR}/${DB_FILE}"

DB_SIZE=$(du -h "${LOCAL_DIR}/${DB_FILE}" | cut -f1)
echo "    DB size: $DB_SIZE"

# ─── [2/4] Upload DB dump → B2 ───────────────────────────────────────
echo ">>> Upload DB → b2:${BUCKET}/db/"
rclone copy "${LOCAL_DIR}/${DB_FILE}" "b2:${BUCKET}/db/"

# ─── [3/4] Sync MinIO ảnh → B2 (incremental) ─────────────────────────
echo ">>> Sync MinIO ảnh → b2:${BUCKET}/minio/"
rclone sync "$MINIO_VOLUME" "b2:${BUCKET}/minio/" \
  --transfers 4 \
  --fast-list

# ─── [4/4] Cleanup retention ─────────────────────────────────────────
echo ">>> Cleanup local backups > ${RETENTION_DAYS_LOCAL} ngày..."
find "$LOCAL_DIR" -name 'db-*.sql.gz' -mtime +$RETENTION_DAYS_LOCAL -delete

echo ">>> Cleanup B2 db backups > ${RETENTION_DAYS_B2} ngày..."
rclone delete "b2:${BUCKET}/db/" --min-age "${RETENTION_DAYS_B2}d"

echo "✅ Backup xong $(date)"
