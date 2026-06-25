# ADR-0013 — Migration tổng hợp đóng băng schema drift + thêm User.lastActiveAt

**Ngày:** 2026-06-25
**Trạng thái:** Accepted
**Người quyết định:** Team (Hùng + Claude)

## Bối cảnh

`notification-cron.service.ts` (bản tin digest hàng ngày) đang đếm "visitor hôm nay" bằng `User.updatedAt`, sai về bản chất — bất kỳ field nào của user được update (đổi avatar, đổi tên, link email...) cũng bị tính nhầm là "đang hoạt động", dù user không hề mở app/gọi API.

Khi định thêm field `User.lastActiveAt` đúng nghĩa, `prisma migrate dev` báo lỗi drift: DB dev local đã có nhiều cột/bảng được áp qua `prisma db push` từ trước (không qua migrate) mà chưa từng có migration file tương ứng — `Post.boostTier`, `Post.bumpedAt`, `Post.completedAt`/`completedWithUserId`, `User.deletedAt`, các bảng `BumpOrder`, `PostView`, `BannedIdentity`, `Category`, `AdminActionLog`, `AppDownloadLog`, `WebPushSubscription`, và việc `Review` đổi từ liên kết qua `dealId` sang `postId` (bảng `Deal` bị xóa). Production đã có toàn bộ các thay đổi này từ lâu (qua `db push --accept-data-loss`), nhưng migration history chưa từng ghi nhận.

## Quyết định

Reset DB dev local (chỉ data test, không phải production), rồi generate **1 migration catch-up duy nhất** (`20260624172757_sync_schema_drift_and_last_active_at`) gộp toàn bộ phần drift cũ + field `lastActiveAt` mới, thay vì tách migration riêng cho từng thay đổi lịch sử.

`jwt.strategy.ts` ghi `lastActiveAt = now()` mỗi khi user gọi API có auth, throttle 1 lần/ngày (so với `todayStart` UTC) để tránh write DB trên mọi request. `notification-cron.service.ts` đổi điều kiện đếm visitor từ `updatedAt` sang `lastActiveAt`.

## Lý do chọn phương án này

- **Không tách migration riêng cho từng phần drift cũ**: các thay đổi đó đã là quá khứ (đã chạy production từ lâu), không cần lịch sử chi tiết từng bước — chỉ cần migration history khớp với schema hiện tại để `migrate dev`/`migrate deploy` hoạt động bình thường từ giờ trở đi.
- **Không tiếp tục dùng `db push` cho field này**: lặp lại đúng vấn đề đang fix (tiếp tục tích lũy drift mới).
- **Không dùng `updatedAt` patch tạm** (vd thêm điều kiện loại trừ field nào đó): phức tạp, dễ sai tiếp khi thêm field mới vào `User` sau này; `lastActiveAt` là field chuyên dụng, rõ nghĩa, không nhầm lẫn.

## Hậu quả

- DB dev local đã reset — mất data test cũ, đã seed lại 10 user/170 bài qua `prisma/seed.ts`.
- **Production action còn nợ**: production đã có sẵn các cột/bảng drift (qua `db push`), nên khi chạy `prisma migrate deploy` lần đầu sau ADR này, cần chạy `prisma migrate resolve --applied 20260624172757_sync_schema_drift_and_last_active_at` TRƯỚC để Prisma đánh dấu migration này "đã áp dụng" mà không chạy lại SQL — nếu chạy thẳng `migrate deploy` sẽ lỗi `column/table already exists`. Bước này chưa thực hiện, cần làm thủ công trên VPS trong lần deploy backend kế tiếp.
- Từ migration này trở đi, mọi thay đổi schema PHẢI qua `prisma migrate dev` (tạo file migration), không dùng `db push` nữa — tránh tái diễn drift.
