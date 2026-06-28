# ADR-0014: Lưu OAuth token TikTok trong Postgres (model TiktokCredential), 1 row duy nhất

**Status:** Proposed
**Date:** 2026-06-29
**Decider(s):** Hoàng thượng (proposed by Thần)
**Tags:** db, security, third-party-integration

## Context

Đang xây tính năng đăng video lên TikTok (mở rộng từ pipeline Facebook/Instagram
Reels đã có ở `scripts/social/`). Đã verify qua tài liệu chính thức TikTok
(`content-sharing-guidelines`): API **bắt buộc** người dùng tự tay chọn privacy
level + commercial disclosure cho TỪNG video, không có ngoại lệ, không cho phép
giá trị mặc định. Vì vậy KHÔNG thể tự động hoàn toàn (zero-touch cron) như đang
làm với FB/IG — cần 1 trang admin để người (hoàng thượng) tự bấm chọn trước khi
đăng mỗi video.

Việc này đặt ra câu hỏi kiến trúc: lưu OAuth token (access_token + refresh_token)
của tài khoản TikTok business ở đâu, vì backend (NestJS, có DB Postgres qua
Prisma) cần đọc/ghi token này để gọi API thay mặt admin.

Ràng buộc:
- Chỉ có **1 tài khoản TikTok business** duy nhất dùng cho cả app (không phải
  per-user, khác hẳn model `WebPushSubscription` vốn 1-nhiều theo `userId`).
- access_token sống 24h, refresh_token sống 365 ngày — cần tự refresh định kỳ,
  nghĩa là cần ghi token mới liên tục, không chỉ đọc 1 lần.
- Trang admin TikTok (`backend/public/admin.html` tab mới) đã dùng `AdminGuard`
  + JWT có sẵn — tự nhiên cần backend (không phải `scripts/social/`, vốn chạy
  trên EC2 host ngoài Docker) làm nơi gọi TikTok API.

## Decision

Dùng **Postgres qua Prisma**, model `TiktokCredential`, **1 row duy nhất**
(không có field liên kết User, không phân theo userId).

```prisma
model TiktokCredential {
  id           String   @id @default(cuid())
  openId       String
  accessToken  String
  refreshToken String
  expiresAt    DateTime
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

Service (`tiktok.service.ts`) luôn `findFirst()` rồi `update` (hoặc `create`
nếu chưa có row) — không bao giờ có row thứ 2. Tự refresh access_token nếu
`expiresAt` còn dưới 5 phút trước khi gọi API thật.

Alternative đã xem xét và lý do không chọn:
- **File `.env` / file JSON trên EC2 host** (giống cách `scripts/social/.env`
  lưu token FB/IG/Threads hiện tại): loại vì backend (Docker container) không
  có quyền ghi trực tiếp lên host filesystem mà không thêm volume mount phức
  tạp; token TikTok cần ghi lại liên tục (refresh mỗi <24h), khác hẳn token
  FB/IG/Threads vốn never-expire chỉ cần đọc 1 lần lúc setup.
- **Bảng riêng `TiktokToken` liên kết `User`** (per-user, giống
  `WebPushSubscription`): loại vì chỉ có 1 tài khoản TikTok business dùng
  chung, không phải nhiều user TikTok khác nhau — thêm `userId` chỉ tạo
  phức tạp giả (luôn query 1 row cố định, không có ý nghĩa multi-tenant).
- **Redis/session store cho token**: loại vì project chưa dùng Redis ở đâu
  khác (theo `feedback_3layer_enforcement`/stack hiện tại), thêm dependency
  mới chỉ để lưu 1 row là dư thừa.

## Consequences

### Positive
- Tái dùng đúng hạ tầng sẵn có (Postgres + Prisma + AdminGuard) — không thêm
  dependency, không thêm volume mount Docker, không đụng `scripts/social/`
  đang chạy ổn định cho FB/IG/Threads.
- Backend tự refresh token, không cần thao tác tay định kỳ.

### Negative / Trade-offs
- Model "1 row duy nhất" là anti-pattern nhẹ về mặt schema design (không có
  ràng buộc DB-level ngăn row thứ 2 — chỉ ngăn ở application code). Nếu sau
  này cần nhiều tài khoản TikTok (vd nhiều brand), phải migrate sang model
  per-account.
- Backend (Docker container) giờ phụ thuộc gọi trực tiếp TikTok API — khác
  với FB/IG/Threads vốn hoàn toàn nằm trong `scripts/social/` (EC2 host,
  ngoài Docker). Tăng 1 điểm tích hợp third-party mới trong backend.

### Mitigations
- Nếu cần nhiều tài khoản TikTok trong tương lai: thêm `@@unique` constraint
  giả hoặc đổi sang bảng có `accountLabel` phân biệt, migrate data cũ thành
  1 row có label default.
- Trigger để revisit: khi cần TikTok cho >1 brand/tài khoản, hoặc khi Phase 2
  (tự động hoá đăng theo lịch) cần kiến trúc khác (vd cron riêng đọc DB này).

## Compliance check

- [x] Không conflict ADR cũ (ADR-0003 chọn MinIO cho storage ảnh/video — không
  liên quan token OAuth; ADR-0005 Web Push VAPID là pattern gần nhất nhưng
  per-user, đã giải thích lý do khác ở trên).
- [x] Có ảnh hưởng SECURITY_BASELINE: access_token/refresh_token là secret —
  cần đảm bảo không log ra console/error message lộ token (đã review
  `tiktok.service.ts`, lỗi chỉ throw `error.message` từ TikTok response, không
  echo token).
- [ ] Compliance (GDPR/Nghị định 13): đã cập nhật `privacy.html` mục 4.1 nêu rõ
  việc lưu token này, không thu thập dữ liệu cá nhân người dùng TikTok khác.
- [ ] DR/backup: token nằm trong DB chính → đã nằm trong backup tự động hiện
  có (14 ngày), không cần cơ chế riêng.
