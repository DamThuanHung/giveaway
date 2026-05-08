# ADR-0010: PostView aggregate theo ngày — Top bài lượt xem theo period

**Status:** Accepted
**Date:** 2026-05-08
**Decider(s):** Hoàng thượng
**Tags:** schema, observability, dashboard, monetization

## Context

Admin dashboard có widget "Bảng xếp hạng" với 3 thẻ:
1. Top user nhiều bài đăng
2. Top user chi tiêu (Bump)
3. Top bài lượt xem

Yêu cầu mới: filter theo Ngày / Tuần / Tháng / Năm / Tất cả.

- Thẻ #1 và #2: filter theo `Post.createdAt` / `BumpOrder.createdAt` — DỄ.
- Thẻ #3: schema chỉ có `Post.viewCount` lifetime, KHÔNG có log lượt xem
  theo thời gian. Nếu cố filter bằng `Post.createdAt`, semantics sẽ sai:
  "Bài đăng tuần này có lifetime view cao nhất" KHÁC "Bài có lượt xem
  phát sinh tuần này" — bài hot tuần này đăng từ tháng trước sẽ KHÔNG
  xuất hiện.

Hoàng thượng yêu cầu giải quyết triệt để.

## Decision

Thêm bảng aggregate `PostView { id, postId, date, count }` với unique
`(postId, date)`. Mỗi (post, ngày VN) chỉ có 1 row, count tăng dần qua
upsert mỗi lần `getPostById` được gọi.

```prisma
model PostView {
  id     String   @id @default(cuid())
  postId String
  date   DateTime // VN day start expressed in UTC
  count  Int      @default(0)
  post   Post     @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@unique([postId, date])
  @@index([date])
  @@index([postId, date])
}
```

`Post.viewCount` lifetime giữ nguyên — không đụng mobile/web đang dùng.

**Date boundary**: dùng VN day start (00:00 múi giờ +7) biểu diễn dưới
dạng UTC Date — khớp với `computeSince` của admin period filter.

**Query "Top bài lượt xem theo period"**:
- period = `all`: giữ logic cũ — sort `Post.viewCount desc`.
- period ≠ `all`:
  ```sql
  SELECT postId, SUM(count) FROM PostView
  WHERE date >= since GROUP BY postId
  ORDER BY SUM(count) DESC LIMIT N
  ```

## Alternatives đã xem xét

| Phương án | Storage | Granularity | Chốt? |
|---|---|---|---|
| **A. Aggregate ngày** (chốt) | 1 row / post / ngày | Ngày | ✓ |
| B. Raw event log `PostViewEvent { postId, viewedAt }` | 1 row / view | Giây | ✗ ~100x storage, không cần granular cho admin |
| C. Counter rolling window `Post.viewsToday/Week/Month` | 0 row mới | Hiện tại | ✗ Không back-date được, race condition phức tạp |
| D. Materialized view + cron | 1 row / post / ngày | Ngày, lag 1h | ✗ Phức tạp hơn upsert, lợi ích marginal |

Phương án A cân bằng tốt nhất giữa chính xác / storage / phức tạp.

## Consequences

### Positive
- "Top bài lượt xem theo period" semantics đúng — bài hot trong period
  thực sự lên rank.
- Storage: 5 năm × 1000 active post × 365 ngày = 1.8M row → nhỏ, không
  cần partition.
- Date boundary VN khớp với UX admin.
- Không break Post.viewCount lifetime.

### Negative
- Mỗi `getPostById` tốn thêm 1 upsert (~5-10ms), tổng latency tăng nhẹ.
- Không phân biệt bot/spam/F5/self-view ở v1 — match hành vi
  `Post.viewCount` cũ. Lỗi về phía inflate đều, không lệch giữa post.

### Mitigations
- Upsert chạy song song qua `Promise.all` với `post.update` → không
  serialize.
- Upsert wrap `.catch()` swallow lỗi → view tracking không crash request
  trả post detail.
- Risk R-013 mở để follow-up bot/spam/dedupe (xem RISK_REGISTER).

## Trigger to revisit

- PostView table > 10M row → cân nhắc partition theo tháng.
- Cần granularity giờ (xem realtime peak time) → migrate sang Redis HINCRBY
  + flush DB mỗi 5 phút.
- Bot/scrape inflate count đáng kể (R-013 escalate sang Red) → thêm
  rate-limit theo IP/session.
- Cần track unique viewer (mỗi user count 1 lần / ngày) → đổi sang model
  `PostViewer { postId, viewerId, date }` unique 3 cột.

## Compliance check

- [x] DB_MIGRATION_POLICY: schema change → BẮT BUỘC `prisma db push` prod
      (memory rule `feedback_prisma_db_push_after_schema_change`)
- [x] PERFORMANCE: 2 index `(date)` + `(postId, date)` cover cả hai query
      pattern (filter by date, group by postId in date range)
- [x] OBSERVABILITY: latency `getPostById` p95 cần monitor sau deploy
- [x] RISK_REGISTER: R-013 added — bot/spam protection deferred
- [x] AI_WORKING_RULES §9.0 long-term thinking: 5 câu trong commit message
