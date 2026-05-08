# Incident Runbook — Blameless Postmortem

> Google SRE practice. Áp dụng cho mọi sự cố production.
> Triết lý: blame system, not people. Postmortem là để học, không phải đổ lỗi.

---

## 1. Severity tier

| Sev | Định nghĩa | Response time | Communication |
|---|---|---|---|
| **SEV-1** | Site down toàn phần / data loss / breach | < 15 phút | Status page + user email |
| **SEV-2** | Feature core down / 1 region down / payment fail | < 1h | Status page |
| **SEV-3** | Feature minor down / latency spike / partial degradation | < 4h | Internal log |
| **SEV-4** | Cosmetic bug / data inaccuracy non-critical | Sprint | Ticket |

---

## 2. Lifecycle

```
DETECT → TRIAGE → MITIGATE → RESOLVE → POSTMORTEM
```

### 2.1 Detect
Source detection:
- Alert tự động (xem OBSERVABILITY)
- User report (support, social)
- Internal observation
- Synthetic test fail

Khi receive: ack trong 5 phút nếu SEV-1/2.

### 2.2 Triage
Trong 15 phút đầu:
- Confirm impact (user nào, bao nhiêu, region nào)
- Assign severity
- Open status page communication nếu SEV-1/2
- Assemble responder (solo+AI: hoàng thượng + thần)

### 2.3 Mitigate
Ưu tiên **giảm impact** trước khi tìm root cause:
- Rollback deploy gần nhất nếu nghi ngờ regression
- Failover sang region khác (nếu có)
- Disable feature flag gây vấn đề
- Scale up tạm thời
- Drain traffic về maintenance page

### 2.4 Resolve
- Root cause identified
- Permanent fix deployed
- Verify monitoring/alert sạch
- Status page: "Resolved"
- Notify user (email/push) nếu SEV-1

### 2.5 Postmortem (BẮT BUỘC trong 48h)
- Document mọi thứ trong template §4
- Action items có owner + deadline
- Share công khai trong tổ chức (solo+AI: lưu trong `docs/postmortems/`)

---

## 3. Communication template

### Status page (mỗi 30 phút trong sự cố)

**Initial (T+0)**
```
🔴 [Investigating] Major outage
Bắt đầu: 03:15 UTC, 2026-05-08
Component: API, mobile login
Impact: User không login được
Đang điều tra. Cập nhật trong 30 phút.
```

**Update (T+30min)**
```
🟡 [Identified] Root cause là database connection pool full
Action: Đang restart connection pool + scale up
ETA resolve: 30-60 phút
```

**Resolved**
```
🟢 [Resolved] Service đã khôi phục lúc 04:15 UTC
Tổng downtime: 60 phút
Postmortem: link trong 48h
```

### User email (SEV-1)
```
Tiêu đề: [Service Name] — Service Disruption Notification

Tâu hoàng thượng (= "Dear user"),

Lúc HH:MM UTC ngày YYYY-MM-DD, dịch vụ của chúng tôi gặp sự cố [mô tả]
ảnh hưởng [scope]. Đã được khôi phục lúc HH:MM, tổng thời gian XX phút.

Nguyên nhân: [tóm tắt 1-2 câu, không kỹ thuật quá]
Hành động: [đã làm gì, sẽ làm gì để tránh lặp lại]

Nếu hoàng thượng gặp vấn đề tiếp, liên hệ [contact].

Xin lỗi vì sự bất tiện.
```

---

## 4. Postmortem template (blameless)

```markdown
# Postmortem: <Tên ngắn sự cố>

**Date of incident:** YYYY-MM-DD HH:MM UTC
**Date of postmortem:** YYYY-MM-DD
**Author:** Thần (AI)
**Severity:** SEV-1/2/3/4
**Status:** Draft / Reviewed / Final
**Total downtime:** Xh Ym
**Affected users:** ~N (% of total)

## Summary
1-2 câu tóm tắt: cái gì, khi nào, impact gì, fix bằng gì.

## Impact
- Số user ảnh hưởng:
- Business impact: revenue loss, NPS, churn risk
- Data impact: data loss / corruption / leak (nếu có)

## Timeline
| Time (UTC) | Event |
|---|---|
| HH:MM | [Detect] Alert fired: latency p99 > 5s |
| HH:MM | [Triage] Engineer ack, severity SEV-2 |
| HH:MM | [Identify] Root cause: schema mới chưa migrate |
| HH:MM | [Mitigate] Run prisma db push, restart backend |
| HH:MM | [Resolve] Smoke test pass, status page green |

## Root cause
**Chi tiết kỹ thuật**: hệ thống nào, code path nào, lý do tại sao.

KHÔNG viết "engineer X quên làm Y". VIẾT "system thiếu mechanism prevent Y khi Z".

Ví dụ:
- ❌ "Thần quên chạy prisma db push trên production"
- ✅ "Quy trình deploy không có gate verify schema sync giữa code và prod
  DB. Hậu quả: schema đổi không tự động propagate, dependent error path
  không có circuit breaker"

## What went well
- Backup/monitoring detect nhanh
- Rollback playbook có sẵn → mitigate nhanh
- Communication kịp thời

## What went wrong
- Schema sync gate thiếu trong deploy pipeline
- Web Push error chỉ throw, không có graceful degradation
- Chat send timeout 8s che dấu underlying error

## Lucky / could-have-been-worse
- Nếu xảy ra giờ peak (thay vì 3am UTC) → impact 10x

## Action items
| ID | Action | Owner | Priority | Deadline |
|---|---|---|---|---|
| A1 | Add `prisma db push` step vào deploy pipeline | Thần | P1 | +3 ngày |
| A2 | Wrap WebPushService.sendToUser với try/catch graceful | Thần | P1 | +1 tuần |
| A3 | Tăng timeout chat 8s → 15s + add retry | Thần | P2 | Sprint sau |
| A4 | Document quy trình schema migration trong `feedback_prisma_db_push_after_schema_change.md` | Thần | P1 | Done |

## Lessons learned
- Bullet 1 — actionable insight chung
- Bullet 2

## Supporting data
- Logs/metrics/dashboards link
- Related ADRs
- Related ticket numbers
```

---

## 5. Blameless culture

### DO
- Focus vào system, process, tooling gap
- Assume good intent
- "What allowed this to happen" thay vì "who did this"
- Celebrate người raise vấn đề

### DON'T
- "X engineer should have known"
- "Anyone can see this is wrong"
- "How did you miss this"
- Punishment / disciplinary action vì sự cố

Ngay cả solo+AI: tránh self-blame loop. Vấn đề là process gap, không phải "thần ngu".

---

## 6. Action item discipline

### SMART
Mỗi action item phải:
- **S**pecific: rõ ràng, cụ thể
- **M**easurable: định lượng được
- **A**chievable: làm được trong realistic time
- **R**elevant: address root cause
- **T**ime-bound: có deadline cứng

### Tracking
- Đưa vào backlog với label `postmortem`
- Review trong sprint review
- Re-postmortem nếu action item không done sau 2 lần extension

---

## 7. Postmortem review checklist

```
[ ] Severity assigned đúng
[ ] Timeline UTC, đầy đủ key events
[ ] Root cause là system gap, không phải person
[ ] What went well section có (không chỉ negative)
[ ] Action items SMART
[ ] Action items có owner + deadline
[ ] Lessons learned có insight chung (không chỉ "fix bug X")
[ ] Supporting data link
[ ] Distributed to relevant party (solo+AI: lưu repo + memory)
[ ] Update SECURITY_BASELINE / RISK_REGISTER nếu cần
```

---

## 8. Postmortem cadence review (hàng quý)

- Đọc lại 5 postmortem gần nhất
- Pattern lặp lại không? → fix pattern, không patch lẻ
- Action item closure rate? Nếu < 80% → discipline issue
- MTTR (Mean Time To Resolve) trend? Improving không?
- Sev distribution có đáng lo? (nhiều SEV-1 = systemic problem)

---

## 9. Folder structure

```
docs/postmortems/
├── README.md                         ← Index + stats
├── 2026-05-08-web-push-schema.md
├── 2026-04-30-splash-treo.md
└── ...
```

`README.md` index:
```markdown
# Postmortems

| Date | Title | Severity | MTTR | Action items closed |
|---|---|---|---|---|
| 2026-05-08 | Web Push schema migration miss | SEV-2 | 60min | 3/4 |
```
