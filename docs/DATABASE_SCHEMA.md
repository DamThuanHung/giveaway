# DATABASE SCHEMA — Cấu trúc cơ sở dữ liệu

> Cập nhật từ `backend/prisma/schema.prisma` — [từ code]

## Thông tin kết nối

| Thông số | Giá trị |
|---|---|
| Engine | PostgreSQL 15 |
| Dev | `postgresql://postgres:postgres@localhost:5432/traotay` (Docker container `traotay_db`) |
| Production | Self-hosted / VPS (biến `DATABASE_URL`) |
| ORM | Prisma v6 |
| Schema file | `backend/prisma/schema.prisma` |
| Extension | `unaccent` (tìm kiếm không dấu) |

---

## Tables

### `User`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | `String` (cuid) | PK |
| `email` | `String?` | UNIQUE, nullable (user phone-only không có email) |
| `name` | `String?` | Tên hiển thị |
| `avatar` | `String?` | URL Cloudinary |
| `phone` | `String?` | UNIQUE, nullable, đăng nhập bằng SĐT (Firebase) |
| `isPhoneVerified` | `Boolean` | Mặc định false |
| `fcmToken` | `String?` | Push notification token (Firebase Cloud Messaging) |
| `isBanned` | `Boolean` | Mặc định false |
| `role` | `String` | `"user"` hoặc `"admin"` |
| `deletedAt` | `DateTime?` | Soft delete: null = active, có giá trị = đã xóa |
| `createdAt` | `DateTime` | Tự động |
| `updatedAt` | `DateTime` | Tự động |

**Relations:** posts, favorites, notifications, chatAsBuyer, chatAsSeller, sentMessages, blockedUsers, blockedByUsers, followers, following, reviewsGiven, reviewsReceived, reports, keywordAlerts, bumpOrders, adminActions, webPushSubscriptions

---

### `Post`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | `String` (cuid) | PK |
| `title` | `String` | Tiêu đề bài đăng |
| `description` | `String` | Mô tả chi tiết |
| `price` | `Int` | Giá (0 = tặng miễn phí) |
| `images` | `String[]` | Mảng URL Cloudinary (không phải filename) |
| `imageLabel` | `String` | URL ảnh đại diện (ảnh đầu tiên, dùng cho thumbnail) |
| `listingType` | `String` | `"give"` hoặc `"sell"` |
| `itemCategory` | `String` | Danh mục, mặc định `"other"` |
| `postType` | `String` | `"item"` / `"realestate"` / `"service"` |
| `status` | `String` | `"available"` / `"reserved"` / `"done"` / `"hidden"` / `"archived"` / `"deleted_by_admin"` |
| `province` | `String` | Tỉnh/Thành phố |
| `district` | `String` | Quận/Huyện |
| `ward` | `String` | Phường/Xã |
| `addressDetail` | `String` | Địa chỉ chi tiết |
| `latitude` | `Float` | Tọa độ (mặc định 0) |
| `longitude` | `Float` | Tọa độ (mặc định 0) |
| `viewCount` | `Int` | Số lượt xem |
| `bumpedAt` | `DateTime?` | Thời điểm đẩy bài gần nhất (null = chưa bump). Dùng để sort + cooldown 24h |
| `boostTier` | `Int` | Tier boost hiện tại: `0`=none, `1`=free bump, `2`=Plus, `3`=VIP. Default `0`. Được PayOS set khi user mua gói |
| `subType` | `String?` | BĐS: `"rent"` / `"sell"` |
| `area` | `Float?` | BĐS: diện tích m² |
| `bedrooms` | `Int?` | BĐS: số phòng ngủ |
| `priceUnit` | `String?` | Đơn vị giá: `"month"` / `"total"` / `"sqm"` / `"hour"` / `"day"` |
| `serviceArea` | `String?` | Dịch vụ: phạm vi phục vụ |
| `completedWithUserId` | `String?` | FK → `User.id` — partner giao dịch khi author bấm "Hoàn thành" |
| `completedAt` | `DateTime?` | Thời điểm bấm "Hoàn thành" |
| `authorId` | `String?` | FK → `User.id` |
| `createdAt` | `DateTime` | Tự động |
| `updatedAt` | `DateTime` | Tự động |

**Post.status flow:** `available` (mới đăng) → `reserved` (đã chốt, chờ giao) → `done` (hoàn thành, review được) / `hidden` (bị report/ẩn) / `archived` (user tự lưu) / `deleted_by_admin` (soft-delete admin, không hiển thị public)

**Indexes:** status, province, listingType, itemCategory, authorId, createdAt, postType, bumpedAt, (status+listingType), (status+itemCategory)

---

### `BumpOrder`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | `String` (cuid) | PK |
| `userId` | `String` | FK → `User.id` (cascade delete) |
| `postId` | `String` | FK → `Post.id` (cascade delete) |
| `package` | `String` | `"plus_3d"` \| `"vip_7d"` |
| `tier` | `Int` | `2`=Plus \| `3`=VIP |
| `amount` | `Int` | Giá VNĐ: `5000` \| `15000` |
| `status` | `String` | `pending` → `paid` / `expired` / `cancelled` / `refunded` |
| `payosOrderId` | `String?` | Mã đơn PayOS (unique) |
| `expiredAt` | `DateTime?` | `null` khi chưa paid. Set khi webhook xác nhận thanh toán |
| `refundedAt` | `DateTime?` | Thời điểm admin hoàn tiền |
| `refundReason` | `String?` | Lý do hoàn tiền |
| `createdAt` | `DateTime` | Tự động |

**Indexes:** userId, postId, status, expiredAt

**Flow:** `pending` (tạo đơn) → `paid` (webhook PayOS xác nhận) → `expired` (cron reset mỗi giờ khi expiredAt < now)

---

### `Favorite`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | `String` (cuid) | PK |
| `userId` | `String` | FK → `User.id` |
| `postId` | `String` | FK → `Post.id` (cascade delete) |
| `createdAt` | `DateTime` | Tự động |

**Unique:** `[userId, postId]`

---

### `ChatRoom`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | `String` (cuid) | PK |
| `buyerId` | `String` | FK → `User.id` (người hỏi mua/xin) |
| `sellerId` | `String` | FK → `User.id` (người đăng bài) |
| `postId` | `String` | FK → `Post.id` |
| `createdAt` | `DateTime` | Tự động |
| `updatedAt` | `DateTime` | Tự động |

**Unique:** `[buyerId, sellerId]` — mỗi cặp user chỉ có 1 room

---

### `Message`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | `String` (cuid) | PK |
| `roomId` | `String` | FK → `ChatRoom.id` (cascade delete) |
| `senderId` | `String` | FK → `User.id` |
| `text` | `String` | Nội dung tin nhắn |
| `isRead` | `Boolean` | Mặc định false |
| `metadata` | `String?` | JSON string, dùng cho ảnh/file đính kèm |
| `createdAt` | `DateTime` | Tự động |

---

### `Notification`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | `String` (cuid) | PK |
| `userId` | `String` | FK → `User.id` (cascade delete) |
| `type` | `String` | Xem danh sách type bên dưới |
| `title` | `String` | Tiêu đề thông báo |
| `body` | `String` | Nội dung thông báo |
| `data` | `String?` | JSON string context: `{ roomId, dealId, postId, followerId, ... }` |
| `isRead` | `Boolean` | Mặc định false |
| `createdAt` | `DateTime` | Tự động |

**Notification types:**
| Type | Nguồn | Mô tả |
|---|---|---|
| `chat` | ChatGateway | Tin nhắn mới |
| `review` | ReviewService | Nhận đánh giá mới sau giao dịch hoàn thành |
| `transaction_completed` | PostService | Giao dịch hoàn thành — cả 2 bên được mời review |
| `follow` | FollowService | Có người follow mình |
| `favorite` | FavoriteService | Có người thích bài của mình |
| `new_post` | FollowService | Người mình follow đăng bài mới |
| `deal_reminder` | NotificationCronService | Deal pending > 24h chưa xử lý (cron mỗi giờ) |
| `post_reminder` | NotificationCronService | Bài đăng 7 ngày không có tương tác (cron 9:00) |
| `keyword_alert` | KeywordAlertService | Có bài đăng mới khớp từ khóa theo dõi |
| `welcome` | NotificationCronService | Chào mừng sau 1 ngày đăng ký (cron 10:00) |
| `daily_digest` | NotificationCronService | Bản tin cuối ngày 20:00 |

---

### `Review`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | `String` (cuid) | PK |
| `postId` | `String` | FK → `Post.id` (cascade delete) — bài đăng đã hoàn thành |
| `reviewerId` | `String` | FK → `User.id` (người viết review) |
| `revieweeId` | `String` | FK → `User.id` (người nhận review) |
| `rating` | `Int` | 1–5 sao |
| `comment` | `String?` | Nhận xét (tối đa 1000 ký tự) |
| `createdAt` | `DateTime` | Tự động |
| `updatedAt` | `DateTime` | Tự động (cho phép edit 24h) |

**Unique:** `[postId, reviewerId]` — mỗi user chỉ review 1 bài 1 lần

**Flow:** Post status = 'done' → author + partner đều có thể tạo review → chỉnh sửa trong 24h đầu → freeze

---

### `BlockedUser`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | `String` (cuid) | PK |
| `blockerId` | `String` | FK → `User.id` |
| `blockedId` | `String` | FK → `User.id` (cascade delete) |
| `createdAt` | `DateTime` | Tự động |

**Unique:** `[blockerId, blockedId]`

---

### `Follow`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | `String` (cuid) | PK |
| `followerId` | `String` | FK → `User.id` (người follow) |
| `followingId` | `String` | FK → `User.id` (người được follow, cascade delete) |
| `createdAt` | `DateTime` | Tự động |

**Unique:** `[followerId, followingId]`

---

### `KeywordAlert`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | `String` (cuid) | PK |
| `userId` | `String` | FK → `User.id` (cascade delete) |
| `keyword` | `String` | Từ khóa theo dõi |
| `createdAt` | `DateTime` | Tự động |

**Unique:** `[userId, keyword]` — mỗi user không thể theo dõi cùng 1 từ khóa 2 lần

---

### `PostView`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | `String` (cuid) | PK |
| `postId` | `String` | FK → `Post.id` (cascade delete) |
| `date` | `DateTime` | Ngày UTC (00:00 midnight), mốc theo múi giờ VN +7 |
| `count` | `Int` | Số lượt xem trong ngày |

**Unique:** `[postId, date]`

**Mục đích:** Aggregate lượt xem theo ngày cho admin dashboard. Source of truth cho analytics. `Post.viewCount` giữ nguyên cho mobile/web legacy — không dùng cho analytics.

---

### `Category`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | `String` (cuid) | PK |
| `value` | `String` | UNIQUE, slug khớp `Post.itemCategory` (e.g. `"electronics"`) |
| `label` | `String` | Nhãn hiển thị (e.g. `"Điện tử"`) |
| `icon` | `String?` | Path asset hoặc URL icon |
| `sortOrder` | `Int` | Thứ tự hiển thị, mặc định 0 |
| `enabled` | `Boolean` | Admin disable → không hiện trong picker, bài cũ giữ nguyên value |
| `createdAt` | `DateTime` | Tự động |
| `updatedAt` | `DateTime` | Tự động |

---

### `AdminActionLog`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | `String` (cuid) | PK |
| `adminId` | `String` | FK → `User.id` (admin thực hiện) |
| `action` | `String` | `post.hide`, `post.delete`, `user.ban`, `user.unban`, `user.role`, `report.resolve`, `auth.reviewer_login`, ... |
| `targetType` | `String` | `"post"` / `"user"` / `"report"` |
| `targetId` | `String` | ID đối tượng bị tác động |
| `metadata` | `Json?` | Chi tiết: `{ reason, oldRole, newRole, ... }` |
| `createdAt` | `DateTime` | Tự động |

**Mục đích:** Audit log mọi hành động admin — tracing khi có incident.

---

### `WebPushSubscription`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | `String` (cuid) | PK |
| `userId` | `String` | FK → `User.id` (cascade delete) |
| `endpoint` | `String` | UNIQUE, URL push service (Chrome/Firefox/Apple) |
| `p256dh` | `String` | Public key client cho encryption |
| `auth` | `String` | Auth secret cho encryption |
| `userAgent` | `String?` | Tên browser (debug) |
| `createdAt` | `DateTime` | Tự động |
| `updatedAt` | `DateTime` | Tự động |

**Mục đích:** Web Push (VAPID) — khác FCM mobile. 1 user có thể có nhiều subscription (Chrome + Firefox + Edge). Push 410 Gone → auto-prune.

---

### `DacDinhAttempt`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | `String` (cuid) | PK |
| `userId` | `String` | FK → `User.id` (cascade delete) |
| `chapterId` | `String` | ví dụ "sm-ch1" — khớp id chương phía `web/app/dac-dinh/data.ts` |
| `exerciseType` | `String` | vocab \| translation \| reorder \| quiz \| judgment \| planning |
| `score` | `Int` | |
| `total` | `Int` | |
| `createdAt` | `DateTime` | Tự động, có index riêng + index kết hợp `[userId,createdAt]` và `[exerciseType,createdAt]` |

**Mục đích:** Ghi lại mỗi lần hoàn thành 1 dạng bài ở `/dac-dinh` — nguồn dữ liệu cho bảng xếp hạng admin (ADR-0015, sửa tiêu chí xếp hạng ở ADR-0016). Chạy song song với `localStorage` phía client, KHÔNG thay thế (logic mở khóa dạng bài tuần tự vẫn dựa vào localStorage). Xếp hạng đếm số cặp (chương, dạng bài) đạt `score=total` trong kỳ — KHÔNG dùng để tính "online" (xem `DacDinhPresence`).

---

### `DacDinhPresence`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `userId` | `String` | PK, FK → `User.id` (cascade delete) — 1 row/user, KHÔNG tích lũy lịch sử |
| `lastSeenAt` | `DateTime` | Ghi đè (upsert) mỗi lần client gửi heartbeat, có index |

**Mục đích:** Presence nhẹ cho `/dac-dinh` — nguồn dữ liệu cho số "đang online" ở admin (ADR-0016). Client gửi `POST /dac-dinh/heartbeat` mỗi 45s trong lúc còn ở trang, không phụ thuộc đang làm bài hay chỉ xem danh sách chương. Khác `DacDinhAttempt` (ghi lịch sử kết quả) — bảng này chỉ track "đang có mặt", không tăng kích thước theo thời gian.

---

### `BannedIdentity`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | `String` (cuid) | PK |
| `email` | `String?` | UNIQUE, email bị cấm |
| `phone` | `String?` | UNIQUE, SĐT bị cấm |
| `createdAt` | `DateTime` | Tự động |

**Mục đích:** Blacklist email/SĐT — ngăn tạo tài khoản mới sau khi bị ban. Khi admin ban user, email và phone của user đó được thêm vào bảng này.

---

## Lưu ý quan trọng

1. ID dùng **cuid** (không phải UUID hay integer)
2. Ảnh lưu dưới dạng **URL MinIO đầy đủ** (e.g. `http://localhost:9000/traotay/posts/xxx.jpg`)
3. `imageLabel` = ảnh thumbnail đại diện cho bài đăng (dùng trong chat banner, notification)
4. User đăng nhập bằng **phone OTP** (Firebase) hoặc **email OTP** (Resend) — đều OTP-first, không có password. User có thể liên kết phương thức còn lại làm dự phòng (link-email cho user phone-only / link-phone cho user email-only)
5. `ChatRoom` unique theo `[buyerId, sellerId]` — 1 cặp user chỉ có 1 room duy nhất. Khi hỏi về bài đăng khác, controller gửi system message "Đang hỏi về: [title]" trong cùng room (Option B — thiết kế có chủ đích). Không cần per-post rooms vì mobile client chỉ render 1 room/cặp.
6. `Post.status = 'deleted_by_admin'` KHÔNG bao giờ được expose ra public listing — backend filter trong mọi public query.
7. Không có bảng `Deal` — flow deal/offer được xử lý qua chat message + `Post.completedWithUserId` + `Post.status = 'done'`.
