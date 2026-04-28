-- ══════════════════════════════════════════════════════════════════════
-- Migration: AdminActionLog table cho audit trail mọi action của admin.
--
-- Why: Trước đây admin xóa post / ban user / cấp quyền không log lại.
-- Compliance + forensics zero. Giờ mọi mutation của admin đều ghi 1 row.
--
-- Áp dụng:
--   psql $DATABASE_URL -f migrate-admin-audit-log.sql
--   hoặc qua container Postgres: docker exec -i traotay_db psql -U postgres -d traotay < migrate-admin-audit-log.sql
-- ══════════════════════════════════════════════════════════════════════
BEGIN;

CREATE TABLE IF NOT EXISTS "AdminActionLog" (
  "id"         TEXT PRIMARY KEY,
  "adminId"    TEXT NOT NULL,
  "action"     TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId"   TEXT NOT NULL,
  "metadata"   JSONB,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminActionLog_admin_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "AdminActionLog_adminId_idx" ON "AdminActionLog"("adminId");
CREATE INDEX IF NOT EXISTS "AdminActionLog_targetType_targetId_idx" ON "AdminActionLog"("targetType", "targetId");
CREATE INDEX IF NOT EXISTS "AdminActionLog_createdAt_idx" ON "AdminActionLog"("createdAt");

SELECT 'AdminActionLog created' AS status, COUNT(*) AS row_count FROM "AdminActionLog";

COMMIT;
