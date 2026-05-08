# Database Migration Policy

> Universal. Forward-only migration + backward compat + zero-downtime
> patterns + rollback procedure.

---

## 1. Migration tools

| Stack | Tool |
|---|---|
| Prisma (Node) | `prisma migrate` (production) / `prisma db push` (dev) |
| TypeORM | `typeorm migration:run` |
| Sequelize | `sequelize-cli db:migrate` |
| Django | `django-admin migrate` |
| Rails | `rails db:migrate` |
| Flyway / Liquibase | Database-agnostic |
| Atlas | Multi-DB, schema-as-code |

---

## 2. `db push` vs `migrate` — when each (Prisma case)

### `prisma db push` (dev / prototype)
- ✅ Fast iteration, không sinh migration file
- ✅ OK cho local dev + early prototyping
- ❌ KHÔNG có history, KHÔNG rollback chuẩn
- ❌ Có thể `--accept-data-loss` để force → nguy hiểm

### `prisma migrate dev` (development)
- ✅ Sinh migration file SQL
- ✅ Auto-apply trên local DB
- ❌ KHÔNG dùng cho production

### `prisma migrate deploy` (production)
- ✅ Apply migration files có sẵn (đã commit từ dev)
- ✅ History đầy đủ, audit được
- ✅ Idempotent (skip migration đã apply)

### Policy
- **Dev**: `migrate dev` để có file. Nếu chỉ thử nghiệm fast → `db push`, sau đó tạo migration thật trước commit.
- **Staging**: `migrate deploy` (cùng pattern prod)
- **Production**: **CHỈ** `migrate deploy`. **KHÔNG** `db push --accept-data-loss` trừ trường hợp đặc biệt với explicit ADR.

---

## 3. Forward-only rule

### Migration là FORWARD-ONLY
- KHÔNG sửa migration đã apply (dù trên dev)
- KHÔNG xóa migration file đã commit
- Đổi quyết định → tạo migration MỚI revert change

### Naming
```
20260508_103000_add_web_push_subscription.sql
20260508_104500_add_user_deleted_at.sql
20260509_090000_create_index_post_bumped_at.sql
```
- Timestamp prefix → ordering deterministic
- Slug ngắn mô tả change

---

## 4. Backward-compatible deploy

### 4.1 Add column (phổ biến nhất)

❌ **WRONG** — break old app
```sql
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NOT NULL;
-- Old app version chưa biết column này → INSERT fail
```

✅ **RIGHT** — 3 phase
```
Phase 1: Add column nullable
  ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL;
  Deploy app version mới (dùng column).

Phase 2: Backfill data
  UPDATE users SET deleted_at = ... WHERE ...;

Phase 3 (optional): Add NOT NULL constraint
  ALTER TABLE users ALTER COLUMN deleted_at SET NOT NULL;
  (chỉ làm nếu mọi row đã có value)
```

### 4.2 Remove column (3 phase)
```
Phase 1: App stop reading + writing column (chỉ ignore)
Phase 2: Migrate drop column từ schema (sau khi app đã deploy ổn định)
Phase 3: Cleanup code reference
```

KHÔNG drop column trong cùng deploy với code change đụng column đó.

### 4.3 Rename column
```
Phase 1: Add column mới + write to both (dual-write)
Phase 2: Backfill column mới từ column cũ
Phase 3: App switch read sang column mới
Phase 4: Drop column cũ
```

→ Rename = expensive. Chỉ rename khi value cao hơn cost.

### 4.4 Change type (vd VARCHAR → INT)
- Tạo column mới với type mới
- Backfill (có validation conversion)
- Switch read/write sang column mới
- Drop column cũ

---

## 5. Index management

### 5.1 Tạo index lớn
```sql
-- Postgres: CONCURRENTLY tránh lock table
CREATE INDEX CONCURRENTLY idx_post_bumped_at ON posts (bumped_at DESC NULLS LAST);
```
- Mất time tỉ lệ với table size
- KHÔNG block read/write
- Failed → DROP INDEX và retry

### 5.2 Drop index
```sql
DROP INDEX CONCURRENTLY idx_old;
```
- Thường nhanh
- Verify performance sau drop (có query nào dùng index này không)

### 5.3 Tránh
- `CREATE INDEX` (không concurrent) trên prod table > 1M row → lock toàn bảng
- Drop index không kiểm tra usage trước

---

## 6. Schema drift detection

### Symptom
- Code Prisma model có field X nhưng DB không có column X (hoặc ngược)
- Sự cố Trao Tay 2026-05-08: WebPushSubscription model có nhưng DB chưa có

### Prevention
- CI gate: `prisma migrate status` hoặc `prisma migrate diff` mỗi PR
- Pre-deploy hook: verify schema sync trước khi accept deploy
- Memory: `feedback_prisma_db_push_after_schema_change.md`

### Recovery
```bash
# Check drift
npx prisma migrate status

# Nếu missing migration: dev có code đổi schema chưa generate migration
# Production: nếu DB có column mà migration không có → manual baseline

npx prisma migrate resolve --applied <migration_name>
```

---

## 7. Rollback procedure

### Khi nào rollback
- Deploy cause SEV-1/2 ngay sau release
- Bug fundamental không fix nhanh được
- Rollback < 1h (sau đó data drift quá lớn để revert)

### Migration rollback (KHÔNG khuyến nghị — forward-only is preferred)

❌ **AVOID:** `prisma migrate resolve --rolled-back` + reverse SQL manually
- Dữ liệu mới có thể lỡ ghi vào schema mới → rollback mất data

✅ **PREFER:** forward-fix
1. Identify regression
2. Create migration mới revert (vd add lại column đã drop)
3. Deploy app cũ + migration revert

### App-level rollback (preferred)
```bash
# Tag-based deploy
git checkout v1.4.0  # version trước
./scripts/deploy.sh production v1.4.0
```
- App rollback nhanh
- Schema không rollback (forward-compat dual-write helps)

→ Hệ quả: schema phải ALWAYS backward compat với app version trước.

---

## 8. Backup before migrate prod

### BẮT BUỘC trước mọi migration prod
```bash
# Snapshot DB
pg_dump -U user -d dbname -F c -f /backup/pre-migrate-$(date +%s).dump

# Verify backup size
ls -lh /backup/pre-migrate-*.dump

# Test restore on staging (random sample)
pg_restore -d staging_db /backup/pre-migrate-XXX.dump
```

### Retention
- Pre-migrate backup giữ 30 ngày
- Move sang offsite (Backblaze B2, S3 cross-region) cho disaster

---

## 9. Test migration on staging

### Required
- Staging DB schema = production schema
- Staging data: subset production (anonymized PII) hoặc fresh seed
- Run migration trên staging trước prod
- Smoke test 1h + run integration test

### Bench mark
- Đo thời gian migration trên staging
- Estimate prod = staging time × (prod row count / staging row count)
- Nếu > 5 phút lock → planning maintenance window hoặc dùng zero-downtime pattern

---

## 10. Migration in CI/CD

### Pipeline
```yaml
deploy_migration:
  steps:
    - name: Backup DB
      run: ./scripts/backup-db.sh
    - name: Apply migration
      run: npx prisma migrate deploy
    - name: Verify schema
      run: ./scripts/verify-schema.sh  # psql query check
    - name: Smoke test
      run: curl ... && check response
    - name: Deploy app
      run: ./scripts/deploy-app.sh
    - name: Health check
      run: ./scripts/health-check.sh
    - name: Rollback if fail
      if: failure()
      run: ./scripts/rollback.sh
```

### Hook integration
- L2: `.claude/check-deploy-readiness.sh` chặn deploy nếu chưa qua TEST_PROTOCOL §4
- L3: `.github/workflows/standards-check.yml` chặn merge nếu schema change không có ADR

---

## 11. Multi-tenant + sharding

### Migration multiple shard
- Apply migration song song trên mọi shard
- Tracker progress per shard
- Stop nếu shard nào fail (không partial state)

### Tenant migration
- Migration metadata table: `migrations_applied`
- Per-tenant run khi tenant active (off-peak hour)

---

## 12. Anti-patterns

| Anti-pattern | Đúng |
|---|---|
| `db push --accept-data-loss` trên prod | `migrate deploy` |
| Sửa migration file đã commit | Tạo migration mới |
| Drop column + remove code reference cùng deploy | 3-phase: ignore → drop → cleanup |
| `CREATE INDEX` không CONCURRENTLY trên big table | `CREATE INDEX CONCURRENTLY` |
| Migration > 1h không có window plan | Zero-downtime pattern |
| Skip backup trước migrate prod | Always backup |
| Rollback migration revert SQL manually | Forward-fix migration mới |
| Migration trong app startup code | Migration tách biệt deploy step |

---

## 13. Setup checklist

```
[ ] Migration tool chosen + documented in CLAUDE.md
[ ] CI gate verify schema sync mỗi PR
[ ] Backup script chạy auto trước migrate prod
[ ] Staging DB mirror schema prod
[ ] Rollback playbook in runbook
[ ] DR drill test schema restore quarterly
[ ] ADR cho mỗi schema change major
[ ] Memory rule: db push sau schema change (Trao Tay specific)
```
