# ADR-0008: Defer Atomic Design folder refactor tới >30 components

**Status:** Accepted
**Date:** 2026-05-08
**Decider(s):** Hoàng thượng (proposed by Thần)
**Tags:** code-org, refactor, scope

## Context

UI_UX_AUDIT 2026-05-08 G-05: refactor `web/components/` + `app/lib/widgets/`
sang Atomic Design (Brad Frost) folder structure: atoms → molecules →
organisms → templates → pages.

Trao Tay current state:
- web/components/ ~25 components
- app/lib/widgets/ ~15 widgets
- Tổng ~40 components nhưng nhiều là single-purpose, không reusable enough
  để justify atomic taxonomy

## Decision

**Defer Atomic Design folder refactor tới khi component count > 30 thực sự
reusable** (không phải tổng count).

**KHÔNG refactor sớm** vì:

### 5 câu long-term thinking
1. **Scale 10x-100x:** Atomic Design giúp khi codebase scale nhiều dev + nhiều component shared. Solo+AI ~25 components không tận dụng được benefit.
2. **Maintain 3 năm:** Refactor sớm = lock structure trước khi rõ requirement. Refactor đúng lúc (gradient need pattern) = natural.
3. **Tech debt:** Hiện tại flat structure KHÔNG là debt — KHÔNG có pain point report. Refactor sớm = tạo debt (2 reorganize sau khi pattern rõ).
4. **Reversibility:** Refactor đảo lộn import path mọi file → hard to revert. Defer = easy.
5. **Strategic fit:** Stage 1 priority feature ship. Refactor structure không drive user value.

## Trigger to revisit

Implement khi BẤT KỲ điều sau:
- Component count > 30 reusable (không tính single-purpose page wrapper)
- Storybook setup (cần atomic structure để organize stories)
- 2+ developer trên project (cần shared mental model)
- Pain point thực: "khó tìm component" report > 3 lần
- Component name collision (vd `Card.tsx` vs `card.dart` vs `PostCard`)

## Counter to "premature optimization"

Brad Frost atomic design valuable nhất khi:
- 50+ components
- Multiple designer-developer team
- Component library shared across products

Trao Tay hiện tại:
- 1 developer (hoàng thượng + AI)
- 1 product
- ~25 components, 80% project-specific (PostCard, BumpButton, ChatRoom)

→ Atomic Design over-engineer cho stage này.

## Khi implement (future)

```
web/components/
├── atoms/          (Button, Input, Label, Icon, Badge)
├── molecules/      (SearchBar, FormField, Card header, EmptyState)
├── organisms/      (Header, PostCard, ChatList, OwnerActions)
├── templates/      (PageLayout, AuthLayout, ChatLayout)
└── pages/          (giữ trong app/ Next.js)

app/lib/widgets/
├── atoms/
├── molecules/
├── organisms/
└── templates/
```

Migration plan:
1. Document component categorization (table A→O)
2. Create new folder structure
3. Move 5-10 components/sprint với git mv (preserve history)
4. Update imports
5. Add Storybook đồng thời với migration

## Consequences

### Positive
- Stage 1 focus feature, không refactor scope
- Avoid premature abstraction
- Defer learning curve cho team (chưa có team)

### Negative / Trade-offs
- Newcomer (nếu hire) sẽ thấy flat structure khó navigate
- Component reuse pattern ad-hoc

### Mitigations
- README components/ document mỗi component purpose + usage
- Naming convention strict (KHÔNG `Card.tsx` chung — `PostCard.tsx`, `UserCard.tsx`)

## Compliance check

- [x] Conflict ADR: KHÔNG
- [x] DOCUMENTATION_STANDARDS: README structure cần update khi migrate
- [x] UI_UX_STANDARDS §9: Atomic Design reference standard, defer là valid
