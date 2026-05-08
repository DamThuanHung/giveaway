# ADR-0009: Defer Usability Testing 5-user tới Stage 2 + Recruit Strategy

**Status:** Accepted
**Date:** 2026-05-08
**Decider(s):** Hoàng thượng (proposed by Thần)
**Tags:** user-research, ux, scope

## Context

UI_UX_AUDIT 2026-05-08 G-09: Jakob Nielsen 5-user rule (5 user phát hiện
~85% usability issue). Currently zero structured usability testing.

Trao Tay state:
- Closed Testing 4-5 tester active (recruit through personal network)
- Tester feedback ad-hoc (chat group), không structured
- R-004 (RISK_REGISTER): tester crisis — < 12 tester required by Google,
  reset 14-day clock

## Decision

**Defer formal usability testing 5-user tới Stage 2 Early GA** với
recruit strategy + alternative methods cho Stage 1.

**Lý do KHÔNG làm Stage 1:**

### 5 câu long-term thinking
1. **Scale 10x-100x:** 5-user findings extrapolate được cho 1000 user nếu sample đại diện. Nhưng sample yêu cầu match persona (xem `USER_PERSONAS.md`).
2. **Maintain 3 năm:** Findings sẽ stale sau 6 tháng nếu product evolve. Cần periodic test.
3. **Tech debt:** KHÔNG implement = blind decision tệ hơn = product-market fit chậm.
4. **Reversibility:** Findings dùng làm input feature priority — easy override với data thật khi có user nhiều.
5. **Strategic fit:** Stage 1 priority = recruit tester R-004 + ship features. Formal usability test cần effort + recruit ngoài tester crisis.

## Stage 1 Alternative — Lightweight feedback loop

**KHÔNG zero feedback Stage 1** — replace formal testing với:

### A. Tester chat group structured prompts
- Sau mỗi APK release, post 3 task prompts trong tester group:
  - "Hãy thử đăng 1 bài bán đồ cũ"
  - "Tìm 1 bài đăng quan tâm + nhắn người bán"
  - "Đánh dấu giao dịch xong"
- Collect feedback within 48h
- Categorize: blocker / friction / nice-to-have

### B. Analytics-driven (`PERFORMANCE_AND_FINOPS.md`)
- Track funnel: signup → first post → first chat → first deal
- Drop-off rate ở mỗi stage = friction signal
- Defer A/B test (UPGRADE_ROADMAP U5 trigger)

### C. Hot Jar / Microsoft Clarity (free tier)
- Session recording 1% sample
- Heatmap top pages
- Privacy compliant (anonymize IP, exclude PII fields)

### D. Direct interview 2-3 tester (Stage 1 abbreviated)
- 30-min Zoom với 2-3 tester active nhất
- Open-ended Q: "Bạn dùng app khi nào? Pain point gì?"
- Note + pattern match

## Stage 2 Implementation Plan

Khi đạt trigger (Closed Testing pass + Open Testing live):

### Phase 1: Recruit (1 tuần)
- 5 user matching 3 persona (xem `USER_PERSONAS.md`):
  - 2 user fit Persona 1 (Mai - mom seller)
  - 2 user fit Persona 2 (Tú - young buyer)
  - 1 user fit Persona 3 (Lan - elderly giver)
- Channel: Facebook group VN dev/UX, Reddit r/vietnam, personal network
- Compensation: 200-500k VND/user (1h session)

### Phase 2: Test session (1 tuần)
- Task scenario realistic (xem `UI_UX_STANDARDS.md` §11.3):
  - Task 1: "Post 1 bài bán đồ cũ trong 5 phút"
  - Task 2: "Tìm + chat người bán cụ thể"
  - Task 3: "Hủy bài / chỉnh sửa giá"
- Think-aloud protocol
- Record screen + face (consent)
- Moderator note critical moment

### Phase 3: Analyze (3 ngày)
- Issues severity 1-4 (Nielsen scale)
- Pattern match across 5 user
- Prioritize fix theo impact × frequency

### Phase 4: Action (sprint sau)
- Fix critical (severity 4) trong 2 sprint
- High (severity 3) trong 4 sprint
- Defer minor

## Trigger to implement

Implement formal usability test khi:
- Closed Testing pass (≥ 12 tester active 14 ngày)
- Open Testing live > 100 user
- Major UX overhaul (> 30% screen redesign)
- Drop-off funnel > 50% ở 1 stage

## Consequences

### Positive (defer)
- Stage 1 focus recruit + ship feature core
- Avoid recruit conflict với Closed Testing tester pool
- Cost saved (~1-2.5tr cho 5 session × 200-500k)

### Negative / Trade-offs (defer)
- Blind UX decisions Stage 1 (mitigated bằng Alternative §A-D)
- Findings late = product-market fit chậm hơn

### Mitigations
- Tester chat group structured prompts (Alternative A) bù 70% findings
- Analytics funnel data > behavior signal (Alternative B)
- Direct interview 2-3 tester (Alternative D) bù 50% qualitative

## Compliance check

- [x] UI_UX_STANDARDS §11.3 5-user rule: defer với justification
- [x] RISK_REGISTER R-004 tester crisis: alternative không xung đột với recruit Closed Testing
- [x] COMPLIANCE: session recording cần consent + anonymize → document trước Phase 1
