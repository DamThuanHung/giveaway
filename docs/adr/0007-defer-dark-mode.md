# ADR-0007: Defer Dark Mode tới Stage 2 GA

**Status:** Accepted
**Date:** 2026-05-08
**Decider(s):** Hoàng thượng (proposed by Thần)
**Tags:** ui, theming, scope

## Context

UI_UX_AUDIT 2026-05-08 G-10: dark mode mark P3 effort L (3-4 ngày, đụng
mọi component). Modern app expectation, battery + eye strain benefit.

Trao Tay current state:
- Stage 1 Beta (Closed Testing 4-5 tester active)
- Design System v2 light theme đã rollout (24 surfaces web + mobile Phase C done)
- Token-based architecture (Tailwind config + AppTheme Flutter) — đã ready cho dark variant

## Decision

**Defer dark mode implementation tới Stage 2 Early GA** (post Closed Testing pass).

**KHÔNG implement nửa vời ở Stage 1** vì:

### 5 câu long-term thinking
1. **Scale 10x-100x:** Dark mode foundation tốt cho > 10k user (battery save mobile). Nhưng ở < 100 user, không critical.
2. **Maintain 3 năm:** Implement đủ thì OK; implement nửa vời = 2 theme drift, mỗi component fix 2 lần.
3. **Tech debt:** Defer = 0 debt; nửa vời = high debt (mỗi component có thể có dark/light bug khác nhau).
4. **Reversibility:** Easy revert nếu defer. Khó revert nếu đã rollout 50%.
5. **Strategic fit:** Stage 1 priority là feature completeness + tester recruitment. Dark mode KHÔNG drive conversion ở stage này.

## Implementation plan (cho Stage 2)

Khi đạt trigger (Closed Testing pass + Open Testing live):

### Phase 1: Infrastructure (1 ngày)
```ts
// tailwind.config.ts
{
  darkMode: 'class',  // Kích hoạt qua <html class="dark">
}

// Tokens dark variant
colors: {
  cream: { ... light },
  ink: { ... light },
  // Dark variant qua CSS custom properties:
  // :root { --bg: #fff; --text: #0f0f1b; }
  // .dark { --bg: #0f0f1b; --text: #fafafc; }
}
```

### Phase 2: ThemeProvider + Toggle (4h)
- React Context + localStorage persist
- ThemeToggle component (system/light/dark)
- Hook detect `prefers-color-scheme`
- Mobile: equivalent với `Provider` Flutter

### Phase 3: Component dark variants (2-3 ngày)
Ưu tiên rollout:
1. Layout: Header, Footer, page bg
2. Critical: PostCard, EmptyState, ErrorState
3. Forms: Input, Button, Modal/BottomSheet
4. Surfaces: Card, Skeleton
5. Edge: VIP card (gold + dark theme adjust)

### Phase 4: Test (1 ngày)
- WCAG contrast check trong dark mode (AccessibilityBaseline)
- Visual regression manual 20 screen
- Edge cases: image overlay, gradient

## Trigger to revisit (active từ defer)

Implement khi BẤT KỲ điều sau:
- Closed Testing pass + Open Testing live (Stage 2)
- > 10% user feedback request dark mode (qua tester survey)
- Apple/Google design guideline mới yêu cầu (Material/HIG release)
- Đối thủ Trao Tay (Chợ Tốt mobile) ra dark mode

## Consequences

### Positive
- Stage 1 sprint focus đúng priority (feature + tester)
- Dark mode khi implement sẽ có quality cao (1 phase tập trung)
- Avoid 2-theme drift bug

### Negative / Trade-offs
- User power-user (Persona 2 — Tú) có thể prefer dark
- Marketing message "modern app" thiếu 1 tick

### Mitigations
- Document defer trong CHANGELOG để user biết roadmap
- Auto-detect `prefers-color-scheme` Stage 1 → respect system theme cho text-only (loading screen) — KHÔNG đầy đủ nhưng better than nothing

## Compliance check

- [x] Conflict ADR cũ: KHÔNG (ADR-0004 design system v2 light-first)
- [x] UI_UX_STANDARDS §13: WCAG 2.2 AA contrast — sẽ verify trong Phase 4
- [x] PERFORMANCE_AND_FINOPS: dark mode KHÔNG impact perf
- [x] DOCUMENTATION_STANDARDS: roadmap document trong này
