#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
# backup-local.sh — Backup Postgres LOCAL ONLY (chờ Backblaze B2 setup)
#
# Khác `backup.sh` ở chỗ chỉ dump DB ra disk local (/opt/traotay/backups/),
# KHÔNG upload lên B2. Layer tạm để có protection ngay khi DB bị corruption
# logic, NHƯNG không bảo vệ khi cả EBS volume hỏng.
#
# Cần upgrade lên `backup.sh` (B2 cloud) ASAP — chỉ là tạm thời.
#
# Cron daily 3h sáng giờ VN (= 20:00 UTC):
#   0 20 * * * /opt/traotay/repo/scripts/backup-local.sh
#
# Test thủ công:
#   sudo /opt/traotay/repo/scripts/backup-local.sh
# ══════════════════════════════════════════════════════════════════
set -euo pipefail

BACKUP_DIR=/opt/traotay/backups
RETENTION_DAYS=14
DATE=$(date +%Y-%m-%d_%H%M)
LOG=/var/log/traotay-backup.log

# Đọc chỉ POSTGRES_USER/DB từ .env.docker
# (Tránh source toàn bộ vì có multi-line FCM_SERVICE_ACCOUNT JSON)
PGUSER=$(sudo grep '^POSTGRES_USER=' /opt/traotay/repo/.env.docker | cut -d= -f2)
PGDB=$(sudo grep '^POSTGRES_DB=' /opt/traotay/repo/.env.docker | cut -d= -f2)

sudo mkdir -p "$BACKUP_DIR"
sudo chown traotay:traotay "$BACKUP_DIR"

echo ">>> [$(date)] Backup -> $BACKUP_DIR/db-${DATE}.sql.gz" | sudo tee -a "$LOG"

# pg_dump qua docker exec — dùng Unix socket trong container nên không cần password
docker exec traotay_db pg_dump -U "$PGUSER" "$PGDB" \
  | gzip \
  | sudo tee "$BACKUP_DIR/db-${DATE}.sql.gz" > /dev/null

SIZE=$(sudo du -h "$BACKUP_DIR/db-${DATE}.sql.gz" | cut -f1)
echo "    Size: $SIZE" | sudo tee -a "$LOG"

# Dọn backup cũ hơn 14 ngày
sudo find "$BACKUP_DIR" -name 'db-*.sql.gz' -mtime +$RETENTION_DAYS -delete

echo "OK Backup done $(date)" | sudo tee -a "$LOG"
