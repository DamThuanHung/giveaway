# ADR-0006: Post sort 3 tầng — VIP > Plus > Standard tuyệt đối

**Status:** Accepted
**Date:** 2026-05-08
**Decider(s):** Hoàng thượng
**Tags:** business-logic, monetization, ranking

## Context

Logic sort post list public ban đầu:
```ts
[{ bumpedAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }]
```

→ `boostTier` (VIP=3, Plus=2, Standard=0) KHÔNG tham gia sort.
→ Hệ quả: Plus bump mới hơn 1 phút có thể vượt VIP — sai monetization.

Hoàng thượng phát hiện qua screenshot trang chủ 2026-05-08:
- Card 3 (DHC DHA Plus, bumped 23:43) đứng TRÊN
- Card 4 (DHC Collagen VIP, bumped 23:42)

Plus mới hơn 1 phút nhưng vượt VIP → user mua VIP đắt hơn không được ưu tiên.

## Decision

Sort 3 tầng — tier tuyệt đối:

```ts
[
  { boostTier: 'desc' },                        // 3 VIP > 2 Plus > 0 Standard
  { bumpedAt: { sort: 'desc', nulls: 'last' } }, // cùng tier, ai bump mới hơn lên trước
  { createdAt: 'desc' },                         // fallback theo ngày đăng
]
```

Sort theo giá (`price_asc`/`price_desc`) giữ nguyên KHÔNG tier — để user
filter giá thấy đủ kết quả.

Alternative đã xem xét:
- **Phương án 1 (chốt):** boostTier tuyệt đối → VIP luôn đầu
- **Phương án 2 (loại):** Standard "Đẩy bài" miễn phí vẫn lên top toàn cục →
  bù đắp cho user free, nhưng vi phạm "tier tuyệt đối"

Hoàng thượng quyết phương án 1: tier tuyệt đối, kể cả Standard "Đẩy
miễn phí" cũng chỉ leo lên đầu nhóm Standard.

## Consequences

### Positive
- Monetization chuẩn: VIP đắt hơn → ưu tiên hơn Plus tuyệt đối
- Logic đơn giản, deterministic
- User dễ hiểu: "muốn lên top thật → mua VIP/Plus"

### Negative
- Standard "Đẩy bài" miễn phí KHÔNG leo lên top toàn cục như trước
- User free có thể cảm thấy "Đẩy bài" miễn phí ít giá trị

### Mitigations
- "Đẩy bài" miễn phí vẫn có giá trị: leo lên đầu nhóm Standard, refresh
  bumpedAt → đứng trước bài Standard cũ
- Khi monetization stable + có đủ user free, cân nhắc lại nếu retention drop

## Áp dụng vào screenshot hoàng thượng

Sau fix, thứ tự đúng:
- #1 Loa Xiaomi VIP (bumped 02:32) ✓
- #2 Giày sport VIP (bumped 02:31) ✓
- #3 DHC Collagen VIP (bumped Mar 6, 23:42) ✓
- #4 DHC DHA Plus (bumped Mar 6, 23:43) — Plus mới hơn 1 phút nhưng vẫn DƯỚI VIP
- #5+ Standard...

## Compliance check

- [x] PERFORMANCE: index `(boostTier DESC, bumpedAt DESC NULLS LAST)` cần verify trên prod
- [x] OBSERVABILITY: monitor sort latency p95
- [ ] A/B test future: tier tuyệt đối vs tier-weighted bumpedAt — measure conversion VIP

## Trigger to revisit
- Conversion rate VIP < 2% (nghi ngờ sort không drive purchase)
- User free churn rate tăng do "Đẩy bài" miễn phí giá trị giảm
- Đối thủ xuất hiện model sort khác (hybrid tier + freshness)
