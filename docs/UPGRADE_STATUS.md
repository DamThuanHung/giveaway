# Upgrade Status — Trao Tay

Theo `docs/standards/UPGRADE_ROADMAP.md`. Track 8 upgrade trigger-based.

Last review: 2026-05-08
Next quarterly review: 2026-08-01

Current stage: **Stage 1 Beta** (Closed Testing 4-5 tester active, < 100 weekly user)

---

## Status tracker

| ID | Upgrade | Trigger | Status | Triggered date | Implemented date | Notes |
|---|---|---|---|---|---|---|
| **U1** | Multi-AI cross-check | First Tier 1 ADR | **Triggered** | 2026-05-08 | — | Có 6 ADR backfill (Tier 1 stack, deploy, design); chưa cross-AI review. Schedule sprint kế. |
| U2 | Feature flag + canary | 100 weekly user | Pre-trigger | — | — | Current: ~5 weekly user (Closed Testing). Còn xa trigger. |
| U3 | Bug bounty | 1000 user OR data sensitive | Pre-trigger | — | — | Có data sensitive (chat message, location GPS) nhưng < 1k user. Defer. |
| U4 | Chaos engineering | Multi-instance OR 99.5% SLO | Pre-trigger | — | — | Single instance hiện tại. SLO mục tiêu 99% (Tier 2). Không trigger sớm. |
| U5 | A/B testing | 2+ measurable feature | Pre-trigger | — | — | Chưa có baseline conversion để A/B test có ý nghĩa. Pre-trigger tới khi launch GA. |
| U6 | Synthetic test bot | 5+ critical flow | Pre-trigger | — | — | Có ~7 critical flow (login, post create, chat, bump, search, profile, review). **Sắp đạt trigger.** |
| U7 | External code audit | $1k MRR OR funding | Pre-trigger | — | — | Pre-revenue. Pre-trigger tới khi monetization stable. |
| U8 | Annual external pen-test | Payment OR > 10k user | Pre-trigger | — | — | Có PayOS payment integration nhưng < 10k user. Schedule khi go GA hoặc DAU > 1k. |

---

## Action items

### Sprint hiện tại (cuối tháng 5)
- [ ] **U1 implement:** chọn 1 ADR Tier 1 (vd ADR-0001 stack) gửi sang Gemini/ChatGPT review. Document feedback ở section "Cross-AI Review notes" trong ADR.

### Sắp trigger — chuẩn bị
- [ ] **U6 prep:** liệt kê 7 critical flow Trao Tay, chuẩn bị Playwright script cho từng flow. Khi đủ stable → setup synthetic test bot weekly.

### Defer (pre-trigger)
- U2-U5, U7-U8: review tại quarterly check 2026-08-01

---

## Stage evolution prediction

Dựa trên roadmap Trao Tay:

| Mốc | Khả năng đạt | Triggers activate |
|---|---|---|
| Stage 1 Beta hiện tại | Now | U1 |
| Stage 2 Early GA (Closed Testing pass + Open Testing) | Q3 2026 | U2, U6 likely |
| Stage 3 Growth (1k user) | Q4 2026 - Q1 2027 | U3 (data sensitive), possibly U5 |
| Stage 4 Scale (10k user) | 2027+ | U7, U8 likely + multi-instance → U4 |

---

## Anti-pattern audit

```
[ ] Implement upgrade khi chưa đạt trigger? → KHÔNG (chỉ U1 đã trigger)
[ ] Bỏ qua trigger vì "chưa có thời gian"? → KHÔNG
[ ] Cherry-pick rẻ skip đắt? → KHÔNG
[ ] Trigger vague? → KHÔNG (mọi trigger là metric đo được)
```

Compliance: ✅ Đang theo đúng triết lý trigger-based.
