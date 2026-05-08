# Upgrade Roadmap — 95% → 99%

> Universal. Pre-commit roadmap để close gap từ "solo+AI baseline" lên
> "solo+AI ceiling". Trigger-based, KHÔNG time-based.
> Apply long-term thinking (`AI_WORKING_RULES.md §9.0`) — không
> over-engineer trước stage, không skip khi đạt trigger.

---

## 1. Triết lý

### Trigger-based > time-based
- "Khi đạt 100 user" rõ ràng hơn "khi có thời gian"
- Trigger phải là metric đo được, không subjective
- Trigger đạt → implement trong sprint kế (không slip)

### Cost-benefit theo stage
- Pre-revenue: implement upgrade ROI âm = waste
- Post product-market fit: implement = competitive moat
- Mỗi upgrade có pre-requisite — không skip thứ tự

### Không cherry-pick
- KHÔNG chọn upgrade rẻ, skip đắt
- 8 upgrade là 1 hệ thống — incomplete coverage = vẫn 95%

---

## 2. 8 Upgrades với trigger cụ thể

### Upgrade 1: Multi-AI cross-check
**Mục đích:** Khắc phục thiếu reviewer thứ 2 cho decision quan trọng.

| Field | Value |
|---|---|
| **Trigger** | ADR cho schema critical (auth, payment, encryption) HOẶC architecture decision Tier 1 (database choice, framework lớn) |
| **Cost** | $0 (free tier 2 AI) |
| **Action** | Trước khi `Status: Accepted` cho ADR, gửi context + draft sang Gemini/ChatGPT review. Document feedback ở section "Review notes" trong ADR. |
| **Pre-requisite** | ADR_TEMPLATE đã có |
| **Implement effort** | 30 phút mỗi ADR |
| **Status default** | Implement ngay từ ADR Tier 1 đầu tiên |

### Upgrade 2: Feature flag + canary deploy
**Mục đích:** Giảm blast radius bug deploy production.

| Field | Value |
|---|---|
| **Trigger** | 100 active user/week OR doanh thu xuất hiện |
| **Cost** | $0 (GrowthBook self-host) hoặc $0-39/tháng (LaunchDarkly free → starter) |
| **Action** | Install feature flag SDK, refactor 1-2 feature critical sang flag-controlled, rollout 10% → 50% → 100% |
| **Pre-requisite** | Monitoring đủ tốt để detect canary issue trong 1h (OBSERVABILITY) |
| **Implement effort** | 4-8h setup + ongoing per-feature |
| **Status default** | Pre-trigger |

### Upgrade 3: Bug bounty / disclosure program
**Mục đích:** External security researcher tìm vuln thay vì hacker malicious.

| Field | Value |
|---|---|
| **Trigger** | 1000 active user OR handle data sensitive (payment, health, ID) |
| **Cost** | $500-2000/năm reward budget + $50-200 per finder |
| **Action** | Setup `security@domain`, viết policy public (scope, out-of-scope, reward tier), post HackerOne / Bugcrowd / OpenBugBounty |
| **Pre-requisite** | SECURITY_BASELINE pass internal audit + có quy trình xử lý report (SLA 7-30 ngày) |
| **Implement effort** | 1 ngày setup + ongoing triage |
| **Status default** | Pre-trigger |

### Upgrade 4: Light chaos engineering
**Mục đích:** Verify resilience proactive thay vì đợi sự cố thật.

| Field | Value |
|---|---|
| **Trigger** | Multi-instance deploy OR SLO target ≥ 99.5% |
| **Cost** | 2-4h setup ban đầu, ~30 phút/tuần ongoing |
| **Action** | Script weekly: random kill 1 container/instance trong off-peak. Verify auto-recovery + no data loss. Log + alert nếu recovery fail. |
| **Pre-requisite** | Container orchestration (Docker Compose, K8s, ECS), backup test đã verify (DISASTER_RECOVERY) |
| **Implement effort** | 2-4h setup, weekly cron |
| **Status default** | Pre-trigger |

### Upgrade 5: A/B testing infrastructure
**Mục đích:** Đo impact feature thật thay vì đoán.

| Field | Value |
|---|---|
| **Trigger** | Có 2+ feature có thể quantify (conversion rate, retention, revenue) OR pre-launch decision lớn |
| **Cost** | $0 (PostHog/GrowthBook free tier) tới ~$0.001/event sau threshold |
| **Action** | Install SDK + experiment framework. Mỗi feature lớn: define hypothesis + metric + duration + minimum sample size trước khi launch. |
| **Pre-requisite** | Analytics đã đo conversion baseline. User base đủ lớn để significance (thường > 1000/variant) |
| **Implement effort** | 4-8h setup + 1h per experiment |
| **Status default** | Pre-trigger |

### Upgrade 6: Synthetic test bot
**Mục đích:** User bot test critical flow 24/7 thay vì đợi user thật báo.

| Field | Value |
|---|---|
| **Trigger** | 5+ critical user flow stable (login, signup, checkout, search, ...) |
| **Cost** | $0 (Playwright on GitHub Actions) hoặc $20-200/tháng (Checkly, Datadog Synthetic) |
| **Action** | Playwright script test 5 flow critical mỗi giờ. Alert P2 nếu fail 2 lần liên tiếp. Screenshot + video trace trên fail. |
| **Pre-requisite** | UI selectors stable (test ID), test data dedicated (không pollute prod) |
| **Implement effort** | 4-8h setup + 1h per flow |
| **Status default** | Pre-trigger |

### Upgrade 7: External code audit (quarterly)
**Mục đích:** Outside perspective trên blind spot AI/user không thấy.

| Field | Value |
|---|---|
| **Trigger** | Revenue ≥ $1k/tháng OR có investor/seed funding OR architecture inflection point |
| **Cost** | $200-500/quý ($50-125/giờ × 4-8h) |
| **Action** | Hire Upwork/Toptal senior engineer (relevant stack experience). Brief: review codebase 4-8h, output gap report (security, perf, maintain, scaling). NDA bắt buộc. |
| **Pre-requisite** | Codebase trên 5k LOC, có NDA template, ngân sách dedicated |
| **Implement effort** | 1 ngày brief + reviewer time + 1 ngày triage findings |
| **Status default** | Pre-trigger |

### Upgrade 8: Annual external pen-test
**Mục đích:** Real-world security validation, không phải checklist nội bộ.

| Field | Value |
|---|---|
| **Trigger** | Handle payment OR PII với compliance regulation (GDPR/PCI-DSS/HIPAA) OR > 10k user |
| **Cost** | $500-3000/năm (HackerOne, Cobalt, Astra, local firm) |
| **Action** | Annual engagement: scope (web app + API + mobile), 1-2 tuần testing, report findings với severity. Fix critical/high trong 30 ngày. |
| **Pre-requisite** | SECURITY_BASELINE compliance, có insurance Cyber Liability nếu finding nặng |
| **Implement effort** | 1 ngày scope + 2 tuần test + 1-4 tuần fix |
| **Status default** | Pre-trigger |

---

## 3. Status tracker (live)

Mỗi project copy bảng này, update khi trigger đạt:

```markdown
## Upgrade Status — <Project Name>

Last review: YYYY-MM-DD
Next quarterly review: YYYY-MM-DD

| ID | Upgrade | Trigger | Status | Triggered date | Implemented date | Notes |
|---|---|---|---|---|---|---|
| U1 | Multi-AI cross-check | First Tier 1 ADR | Implemented | 2026-05-08 | 2026-05-08 | Apply mọi ADR auth/schema |
| U2 | Feature flag + canary | 100 weekly user | Pre-trigger | — | — | Current: 5 user |
| U3 | Bug bounty | 1000 user OR data sensitive | Pre-trigger | — | — | — |
| U4 | Chaos engineering | Multi-instance OR 99.5% SLO | Pre-trigger | — | — | Single-instance hiện tại |
| U5 | A/B testing | 2+ measurable feature | Pre-trigger | — | — | — |
| U6 | Synthetic test bot | 5+ critical flow | Pre-trigger | — | — | — |
| U7 | External audit | $1k MRR OR funding | Pre-trigger | — | — | — |
| U8 | External pen-test | Payment OR > 10k user | Pre-trigger | — | — | — |
```

Status values:
- **Pre-trigger**: chưa đạt trigger
- **Triggered**: đạt trigger, chưa implement
- **In progress**: đang implement (ghi rõ % done)
- **Implemented**: done
- **Skipped**: cố ý skip (ghi lý do + ADR)
- **Deferred**: defer với deadline cứng (KHÔNG indefinite)

---

## 4. Quarterly review process

### Cadence: đầu mỗi quý

```
[ ] Đọc Upgrade Roadmap
[ ] Check metric thực tế vs trigger:
    - User count
    - Revenue
    - Feature count critical
    - SLO target
    - Compliance scope
[ ] Đánh dấu upgrade vừa Triggered
[ ] Schedule implementation trong sprint kế
[ ] Re-evaluate trigger nếu product pivot
[ ] Update Status tracker
[ ] Commit + push
```

### Khi đạt trigger
1. Tạo ADR `0XXX-upgrade-<name>.md` với:
   - Why now (trigger evidence)
   - Implementation plan
   - Pre-requisite check
   - Cost confirm
2. Schedule sprint cho implementation (T-shirt size theo file)
3. Update Status: Pre-trigger → Triggered → In progress → Implemented

### Khi defer hoặc skip
- BẮT BUỘC ghi ADR với:
  - Lý do (không khả thi? trade-off?)
  - Risk accepted (thêm vào RISK_REGISTER)
  - Trigger revisit (deadline cứng để reconsider)

---

## 5. Anti-patterns

| Anti-pattern | Đúng |
|---|---|
| Implement U2-U8 trước khi đạt trigger | Pre-trigger = wait, đừng over-engineer |
| Skip upgrade vì "chưa có thời gian" khi đạt trigger | Đó là tech debt, ghi RISK_REGISTER |
| Cherry-pick U1+U6 (rẻ), skip U7+U8 (đắt) | Incomplete coverage = vẫn 95% |
| Trigger vague ("khi cần") | Metric đo được cụ thể |
| Implement xong không update tracker | Tracker = single source of truth |
| Pivot product không re-evaluate trigger | Mỗi pivot → review tất cả trigger |
| Defer indefinitely | Deadline cứng để reconsider |

---

## 6. Khi qua dự án mới

```bash
# Copy file template
cp docs/standards/UPGRADE_ROADMAP.md <new-project>/docs/standards/

# Tạo Status tracker riêng
cp docs/standards/UPGRADE_ROADMAP.md <new-project>/docs/UPGRADE_STATUS.md
# Sửa: chỉ giữ section §3 (Status tracker), populate cho dự án mới
```

Mỗi dự án mới mặc định: U1 implement ngay, U2-U8 pre-trigger.

---

## 7. Trigger evolution theo stage

### Stage 0 — MVP (0-10 user, < 3 tháng)
- Active: U1 only
- Pre-trigger: U2-U8
- Focus: validate idea, ship feature core

### Stage 1 — Beta (10-100 user, 3-6 tháng)
- Active: U1
- Watch: U2 (gần trigger), U6 (gần đủ flow)
- Focus: feedback loop, fix critical bug

### Stage 2 — Early GA (100-1k user, 6-12 tháng)
- Active: U1, U2, U6 likely triggered
- Watch: U3 (sắp 1k user)
- Focus: stability + onboarding

### Stage 3 — Growth (1k-10k user, 12-24 tháng)
- Active: U1, U2, U3, U5, U6 likely
- Watch: U4 (multi-instance), U7 (revenue)
- Focus: scale + monetization

### Stage 4 — Scale (10k+ user)
- Active: U1-U8 likely tất cả
- Focus: reliability + competitive moat

---

## 8. Beyond 99% — không thể với solo+AI

1% gap còn lại đòi hỏi:
- 24/7 dedicated SRE on-call (cần team)
- Multi-region active-active (cần ops team)
- Dedicated security team (full-time)
- Tech writer dedicated
- Code review từ 2+ engineer

→ Khi product cần 1% này = thời điểm scale team. Solo+AI **không nên** chạy theo 100%.

Mục tiêu solo+AI: **99% của ceiling** + product-market fit + sustainable revenue. Sau đó hire team mới mở 100%.
