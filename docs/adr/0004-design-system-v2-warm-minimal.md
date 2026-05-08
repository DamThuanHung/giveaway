# ADR-0004: Design System v2 — Vietnamese Warm Minimal

**Status:** Accepted (backfill)
**Date:** 2026-05-08 (rolled out 2026-05-04 web, 2026-05-07 mobile)
**Decider(s):** Hoàng thượng
**Tags:** design, ui, brand

## Context

Bộ design v1 của Trao Tay (~2026-03) generic blue-grey không có identity
rõ. Cần refactor để:
- Phân biệt với Chợ Tốt / FB Marketplace (cảm giác "công ty" lạnh)
- Match văn hóa Việt: warm, friendly, trao gửi
- UX best practice: Nielsen + Fitts + Hick + Gestalt + Miller + F-Pattern + Progressive Disclosure
- Áp dụng nhất quán mobile + web + email

## Decision

**Design System v2 — Vietnamese Warm Minimal:**

- **Primary:** Emerald scale (50-900) — gợi nhịp tươi, bền vững, "trao gửi"
- **Cream:** warm off-white (50-300) — thay neutral grey, gây cảm giác ấm
- **Ink:** ink scale (50-900) — text + border, warmer than pure grey
- **Radius:** sm6 / md12 / lg16 / xl20 (4 levels)
- **Shadow:** soft / card / elevated (3 levels, primary-tinted)
- **Motion:** ease-warm cubic + 4 duration tokens
- **Gradient:** warm / hero / cta (3 named gradients)
- **Typography:** giữ existing font stack, adjust weight scale

Apply theo phase:
- Phase A.1+A.2: Web tokens + 24 surfaces refactor (DONE)
- Phase B: /posts/[id], /me/*, /login, form, chat (DONE)
- Phase C: Mobile port (DONE phase C.1-C.6)

Alternative đã loại:
- Material You (Android 12+): không cross-platform iOS
- Tailwind default palette: thiếu identity, generic
- Bright neon: trẻ trung nhưng không hợp văn hóa "trao gửi" (cảm giác chợ búa)

## Consequences

### Positive
- Brand identity rõ + memorable
- Token-based → đổi 1 chỗ apply toàn project
- Mobile + web visually consistent
- 7 nguyên tắc UX chuẩn ngành áp dụng được trên token này

### Negative
- Migration cost: 24 web surface + 6 phase mobile
- Designer dependency: cần lock palette trước khi code
- Risk inconsistency nếu dev mới không biết tokens

### Mitigations
- `docs/UI_DESIGN_SYSTEM.md` document tokens đầy đủ
- AppTheme widget Flutter export tất cả tokens
- Tailwind config web export tokens
- Code review check hardcode color → reject

## Compliance check

- [x] ACCESSIBILITY_BASELINE: color contrast checked, primary-700 / ink-900 trên cream-100 → 7:1 (AAA pass)
- [x] DOCUMENTATION_STANDARDS: tokens documented in UI_DESIGN_SYSTEM
- [ ] Cần audit lại WCAG sau khi rollout iOS

## Trigger to revisit
- Brand pivot major
- User feedback "tone không match" lặp lại > 5 user
- A/B test cho thấy palette thay thế convert tốt hơn
