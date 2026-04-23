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
| `password` | `String?` | Bcrypt hashed, nullable |
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

**Relations:** posts, favorites, notifications, chatAsBuyer, chatAsSeller, sentMessages, blockedUsers, blockedByUsers, followers, following, dealsAsOwner, dealsAsRequester, reviewsGiven, reviewsReceived, reports

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
| `status` | `String` | `"available"` / `"done"` |
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
| `authorId` | `String?` | FK → `User.id` |
| `createdAt` | `DateTime` | Tự động |
| `updatedAt` | `DateTime` | Tự động |

**Indexes:** status, province, listingType, itemCategory, authorId, createdAt, postType, bumpedAt, (status+listingType), (status+itemCategory)

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
| `deal` | DealService | Yêu cầu nhận / chấp nhận / từ chối |
| `review` | ReviewService / DealService | Nhận đánh giá mới / deal hoàn thành |
| `follow` | FollowService | Có người follow mình |
| `favorite` | FavoriteService | Có người thích bài của mình |
| `new_post` | FollowService | Người mình follow đăng bài mới |
| `deal_reminder` | NotificationCronService | Deal pending > 24h chưa xử lý (cron mỗi giờ) |
| `post_reminder` | NotificationCronService | Bài đăng 7 ngày không có tương tác (cron 9:00) |
| `keyword_alert` | KeywordAlertService | Có bài đăng mới khớp từ khóa theo dõi |
| `welcome` | NotificationCronService | Chào mừng sau 1 ngày đăng ký (cron 10:00) |
| `daily_digest` | NotificationCronService | Bản tin cuối ngày 20:00 |

---

### `Deal`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | `String` (cuid) | PK |
| `postId` | `String` | FK → `Post.id` |
| `requesterId` | `String` | FK → `User.id` (người xin nhận) |
| `ownerId` | `String` | FK → `User.id` (người đăng) |
| `status` | `String` | `"pending"` / `"accepted"` / `"rejected"` / `"completed"` / `"cancelled"` |
| `message` | `String?` | Lời nhắn kèm deal |
| `createdAt` | `DateTime` | Tự động |
| `updatedAt` | `DateTime` | Tự động |

---

### `Review`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | `String` (cuid) | PK |
| `dealId` | `String` | FK → `Deal.id` |
| `reviewerId` | `String` | FK → `User.id` |
| `revieweeId` | `String` | FK → `User.id` |
| `rating` | `Int` | 1–5 sao |
| `comment` | `String?` | Nhận xét |
| `createdAt` | `DateTime` | Tự động |

**Unique:** `[dealId, reviewerId]` — mỗi deal chỉ review 1 lần

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
4. User có thể đăng nhập bằng **phone** (Firebase OTP) hoặc **email+password** — không bắt buộc có cả hai
5. `ChatRoom` unique theo `[buyerId, sellerId]` — tức 1 cặp user chỉ có 1 room duy nhất bất kể bài đăng
