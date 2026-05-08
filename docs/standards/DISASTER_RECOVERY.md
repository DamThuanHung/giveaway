# Disaster Recovery (DR)

> AWS Well-Architected — Reliability Pillar.
> RTO = thời gian tối đa chấp nhận để khôi phục.
> RPO = lượng data tối đa chấp nhận mất.

---

## 1. RTO / RPO target theo tier

| Tier | RTO | RPO | Strategy |
|---|---|---|---|
| Tier 1 (critical user-facing) | < 1h | < 15 phút | Multi-region active-passive + continuous replication |
| Tier 2 (important) | < 4h | < 1h | Single region + hourly backup + standby image |
| Tier 3 (best effort) | < 24h | < 24h | Daily backup + manual restore |

Solo+AI startup mặc định: Tier 2 hoặc Tier 3.

---

## 2. Backup strategy — 3-2-1 rule

```
3 copies of data
2 different storage media
1 offsite copy
```

### Cụ thể
- **Copy 1**: production DB volume (live)
- **Copy 2**: snapshot/dump cùng region (vd EBS snapshot, pg_dump local)
- **Copy 3**: offsite (vd Backblaze B2, AWS S3 cross-region, Wasabi)

### Cadence
- Database: snapshot mỗi 1h, full dump mỗi 24h
- File storage (S3/MinIO): incremental sync mỗi 24h
- Config/IaC: git-based (auto, mỗi commit)

### Encryption
- Backup at rest: AES-256
- Transit lên offsite: TLS 1.2+

---

## 3. Test backup — định kỳ

**KHÔNG TIN backup nếu chưa restore thử.**

### Cadence
- Quý: restore staging environment từ backup mới nhất, verify schema + sample data
- 6 tháng: full DR drill — giả lập production down, restore từ offsite, đo RTO thực tế
- Năm: tabletop exercise — cả ekip (hoàng thượng + thần) walk through scenario disaster

### Drill checklist
```
[ ] Đo thời gian từ "trigger restore" → "service back online"
[ ] So với RTO target — có đạt không?
[ ] Verify data integrity (compare row count, checksum sample)
[ ] Test toàn bộ user flow critical (login, transaction, upload)
[ ] Document gap, update runbook
```

---

## 4. Disaster scenarios — playbook

### 4.1 Database corruption
1. Stop write traffic (read-only mode)
2. Identify corruption time (binlog, WAL log)
3. Restore từ snapshot trước thời điểm corrupt
4. Replay WAL/binlog tới timestamp safe
5. Validate sample data
6. Resume write traffic

RTO target: 1-2h.

### 4.2 Region/AZ down
1. Verify AWS/cloud status page
2. Failover sang region/AZ khác (nếu multi-region)
3. Update DNS (TTL phải thấp, vd 60s)
4. Communicate via status page

RTO target: <1h cho Tier 1 multi-region; <4h cho single region.

### 4.3 Accidental delete (table drop, file purge)
1. Stop write traffic
2. Restore từ snapshot mới nhất
3. So sánh diff với production để identify data mất
4. Decide: restore full hay merge selective

RTO target: 2-4h.

### 4.4 Ransomware / malicious access
1. Containment: rotate ALL secret, revoke ALL session
2. Isolate compromised host (snapshot + terminate)
3. Restore từ backup ngày trước nghi ngờ breach
4. Forensic analysis logs (xem `INCIDENT_RUNBOOK.md`)
5. Notification compliance (GDPR 72h)

RTO target: phụ thuộc scope, ưu tiên containment trước restore speed.

### 4.5 Domain expiration / hijack
- Auto-renewal domain bật 12 tháng trước
- Lock domain (registrar lock) bật
- DNS provider: 2FA + transfer lock
- Backup: ghi expiration date + registrar credential vào password manager

### 4.6 Account loss (cloud provider)
- Multi-account separation: prod khác account so với dev/test
- Root account: 2FA hardware key, backup code in safe physical
- IAM user thường (không root) cho daily ops
- Backup billing contact + emergency contact với cloud provider

---

## 5. Recovery infrastructure

### Required tooling
- IaC (Terraform/CloudFormation/Pulumi) — recreate infra trong 1 command
- Container image versioned (immutable tag, không `:latest` cho production)
- Config separate from code (env-specific)
- Runbook step-by-step trong `docs/runbooks/`

### Avoid
- Hand-crafted server (snowflake) — không reproducible
- Mutable infrastructure (sửa server live) — drift, không rollback được
- Manual deploy steps — error-prone, no audit trail

---

## 6. Status page

Khi disaster:
- Public status page (statuspage.io / Atlassian Statuspage / self-hosted Cachet)
- Update ít nhất mỗi 30 phút trong sự cố
- Format:
  ```
  🔴 Major outage — investigating
  Bắt đầu: HH:MM UTC
  Component bị ảnh hưởng: API, mobile app
  Impact: user không login được
  Cập nhật mỗi 30 phút.
  ```
- Incident close: postmortem link

---

## 7. Communication plan

| Audience | Channel | Trigger |
|---|---|---|
| End user | Status page + email + push | Down >5 phút Tier 1 |
| Hoàng thượng | Direct (SMS/messenger) | Page P1 alert |
| Thần (AI) | Logs/dashboard | Auto monitor |
| Compliance | Email | Data breach (GDPR 72h) |
| Cloud provider | Support ticket | Infrastructure-side issue |

---

## 8. Cost of DR

DR có cost:
- Storage backup (offsite): $X/GB/month
- Multi-region active-passive: 2x infra cost
- Drill time: 4-8h mỗi quý

Trade-off: cost của DR vs cost của downtime.

```
Cost downtime/h × probability × duration > Cost DR/year ?
→ YES: invest more DR
→ NO: hiện tại đủ
```

Solo+AI startup early stage: chấp nhận RTO 4-24h, đầu tư minimal DR cho đến khi có revenue.

---

## 9. Checklist DR readiness

```
[ ] RTO/RPO target documented
[ ] Backup schedule chạy auto (cron + alert nếu fail)
[ ] Backup offsite copy verified (3-2-1)
[ ] Backup encrypt at rest + transit
[ ] Restore test thực hiện trong 6 tháng gần nhất
[ ] Runbook cho 5 scenarios (§4) viết sẵn
[ ] IaC reproduce infra
[ ] Domain auto-renew + lock
[ ] Cloud account 2FA + backup credential
[ ] Status page setup
[ ] Communication plan documented
[ ] DR drill scheduled in calendar
```
