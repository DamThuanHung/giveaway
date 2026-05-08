---
description: Self-audit weekly — đo % tuân thủ docs/standards/ trong 7 ngày qua
---

Audit % tuân thủ standards trong 7 ngày qua, output report cụ thể.

Steps:

1. **Git activity 7 ngày qua**
   - `git log --since="7 days ago" --oneline` lấy danh sách commit
   - Phân loại: feature / fix / docs / refactor

2. **Đo từng standard**:

### ADR compliance
- Schema/migration commits: có ADR đi kèm không?
  - `git log --since="7 days ago" --diff-filter=AM -- 'prisma/schema.prisma' '**/migrations/**' '**/schema.sql'`
  - So với ADR mới trong cùng range
- Tỷ lệ: schema commits CÓ ADR / total schema commits

### Test compliance
- Commit có "Edge cases:" + "Test level:" trong message?
  - `git log --since="7 days ago" --grep="Edge cases:" --oneline`
- So với total commits non-docs
- Tỷ lệ: compliant / total

### Postmortem compliance
- Số incident production (logs alert + status page) trong 7 ngày
- Số postmortem được tạo trong docs/postmortems/
- Tỷ lệ: postmortem / incident, target 100%

### Risk register compliance
- File RISK_REGISTER.md last review date — có trong 30 ngày qua không?
- Số risk Open có mitigation plan SMART

### Security compliance
- `npm audit` / `cargo audit` — số CVE Critical/High còn open
- Secrets check: `git log -p --since="7 days ago" | grep -iE "password|secret|token" | head`
- Suspicious commit?

### Observability compliance
- Có log/metric/trace mới được add trong 7 ngày?
- Health endpoint còn work?

3. **Output report**:

```
═══════════════════════════════════════════════════════════════
STANDARDS AUDIT — last 7 days
═══════════════════════════════════════════════════════════════

📋 ADR compliance:        X/Y schema commits (Z%)
🧪 Test evidence:         X/Y feature commits (Z%)
🚨 Postmortem:            X/Y incidents (Z%)
🔒 Security CVE:          X Critical, Y High open
📊 Observability adds:    X logs/metrics/traces
⚠️ Risk register review:  Z days ago

OVERALL COMPLIANCE: XX%

Issues:
- [list specific gaps]

Action items:
- [SMART action items để improve next week]
═══════════════════════════════════════════════════════════════
```

4. **Nếu OVERALL < 80%** → cảnh báo + đề xuất hoàng thượng tăng enforcement
5. **Save report** vào `docs/audits/YYYY-MM-DD-weekly.md` để track xu hướng

Cadence: chạy mỗi Chủ Nhật cuối tuần.
