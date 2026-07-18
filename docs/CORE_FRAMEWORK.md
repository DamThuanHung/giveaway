# CORE FRAMEWORK — Kiến trúc hệ thống

## Tổng quan dự án

**Tên dự án:** Trao Tay (Cho và Tặng)
**Mô tả:** Ứng dụng trao tặng & mua bán đồ cũ tại Việt Nam
**Trạng thái:** Đang phát triển — chạy local bằng Docker Compose (postgres + minio + nestjs)

---

## Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────┐
│                   CLIENT LAYER                      │
│          Flutter App (Android / iOS)                │
│     Provider (State) + http + socket_io_client      │
└────────────────────┬────────────────────────────────┘
                     │ HTTP REST + WebSocket
┌────────────────────▼────────────────────────────────┐
│                   API LAYER                         │
│              NestJS (TypeScript)                    │
│   REST Controllers + WebSocket Gateway (Socket.io)  │
│      JWT Auth + Firebase Phone Auth                 │
└────────────────────┬────────────────────────────────┘
                     │ Prisma ORM
┌────────────────────▼────────────────────────────────┐
│                  DATA LAYER                         │
│     PostgreSQL (Docker) + MinIO (S3 self-hosted)    │
└─────────────────────────────────────────────────────┘
```

---

## Backend — NestJS

### Thông tin cơ bản

| Thông số | Giá trị |
|---|---|
| Framework | NestJS v11 |
| Ngôn ngữ | TypeScript |
| Port | `process.env.PORT` (mặc định `3800`) |
| Local URL | `http://localhost:3800` (Docker) / `http://192.168.x.x:3800` (LAN) |
| ORM | Prisma v6 |
| Database | PostgreSQL 15 (Docker container `traotay_db`) |
| Auth | JWT (biến `JWT_SECRET`) + OTP qua SĐT (Firebase) hoặc Email (Resend) |
| Upload ảnh | MinIO S3-compatible (biến `MINIO_*`, container `traotay_storage`) |

### Biến môi trường bắt buộc

| Biến | Mô tả |
|---|---|
| `NODE_ENV` | `development` \| `production`. Production tự disable toàn bộ `/dev/*` endpoint + tắt static `/uploads` |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key cho JWT (≥64 ký tự random) |
| `PORT` | Port server (mặc định 3800) |
| `BASE_URL` | Public URL của server (fallback cho PayOS nếu không có `PUBLIC_URL`) |
| `PUBLIC_URL` | URL public cho PayOS webhook/redirect (ngrok khi dev, domain khi production). Bắt buộc nếu `BASE_URL` là LAN IP |
| `CORS_ORIGIN` | Comma-separated origin cho REST + 2 WebSocket gateway. Production: `https://traotay.com.vn,https://www.traotay.com.vn`. Rỗng khi dev → reflect mọi origin |
| `ADMIN_EMAILS` | Comma-separated email có role admin. Rỗng = không ai là admin (không có fallback hardcode) |
| `FCM_SERVICE_ACCOUNT` | JSON credentials Firebase Cloud Messaging |
| `RESEND_API_KEY` | Resend API key để gửi OTP email. Production thiếu → server throw khi gửi OTP |
| `DEV_SECRET` | Secret bổ sung cho `/dev/*` (chỉ check khi `NODE_ENV !== 'production'`) |
| `MINIO_ENDPOINT` | MinIO host (e.g. `minio` trong Docker, `localhost` ngoài) |
| `MINIO_PORT` | MinIO port (mặc định `9000`) |
| `MINIO_USE_SSL` | `true` nếu MinIO qua HTTPS (production), `false` dev |
| `MINIO_ACCESS_KEY` | MinIO access key |
| `MINIO_SECRET_KEY` | MinIO secret key |
| `MINIO_BUCKET` | Tên bucket (mặc định `traotay`) |
| `MINIO_PUBLIC_URL` | Public URL để tạo link ảnh (e.g. `http://localhost:9000`, prod `https://s3.traotay.com.vn`) |
| `PAYOS_CLIENT_ID` | Client ID cổng PayOS (từ my.payos.vn → Kênh thanh toán) |
| `PAYOS_API_KEY` | API Key PayOS |
| `PAYOS_CHECKSUM_KEY` | Checksum Key PayOS (để verify webhook) |

### Cấu trúc thư mục backend

```
backend/src/
├── main.ts
├── app.module.ts
├── auth/                    # JwtAuthGuard, JwtStrategy
├── user/                    # Đăng ký, đăng nhập, profile
├── post/                    # Bài đăng (CRUD, upload ảnh)
├── chat/                    # WebSocket Gateway + REST rooms
├── notification/            # Thông báo + FCM push + /dev endpoints
├── favorite/                # Yêu thích bài đăng
├── follow/                  # Follow user
├── deal/                    # Giao dịch (xin nhận đồ)
├── review/                  # Đánh giá sau deal
├── report/                  # Báo cáo bài đăng
├── cloudinary/              # Upload ảnh lên MinIO (class vẫn giữ tên CloudinaryService)
├── fcm/                     # Firebase Cloud Messaging service
├── admin/                   # Quản trị
└── prisma/                  # PrismaService
```

---

## API Endpoints

### User — `/user`

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| POST | `/user/phone-login` | — | Đăng nhập SĐT (Firebase idToken) |
| POST | `/user/email-login/send` | — | Gửi OTP đăng nhập qua email |
| POST | `/user/email-login/verify` | — | Xác nhận OTP → trả JWT |
| POST | `/user/admin-login/send` | — | Gửi OTP cho ADMIN_EMAILS (cho /admin) |
| POST | `/user/link-email/send` | JWT | Gửi OTP liên kết email dự phòng |
| POST | `/user/link-email/confirm` | JWT | Xác nhận liên kết email dự phòng |
| POST | `/user/link-phone` | JWT | Liên kết SĐT dự phòng (Firebase idToken) |
| GET | `/user/me` | JWT | Lấy thông tin user hiện tại |
| GET | `/user/:id` | — | Lấy thông tin user theo ID |
| PATCH | `/user/:id` | JWT | Cập nhật profile (name, avatar) |
| POST | `/user/avatar` | JWT | Upload avatar (MinIO) |
| POST | `/user/dev/login` | — | Đăng nhập dev (cần `{ email, secret: DEV_SECRET }`, disable ở prod) |
| POST | `/user/block/:blockedId` | JWT | Chặn user |
| DELETE | `/user/block/:blockedId` | JWT | Bỏ chặn user |
| GET | `/user/blocked/list` | JWT | Danh sách đã chặn |
| GET | `/user/block/check/:targetId` | JWT | Kiểm tra có chặn không |
| DELETE | `/user/me` | JWT | Xóa tài khoản (xóa toàn bộ dữ liệu liên quan) |

### Post — `/post`

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| GET | `/post` | — | Lấy danh sách bài đăng (filter: category, province, listingType, status, search) |
| GET | `/post/my` | JWT | Bài đăng của mình |
| GET | `/post/user/:userId` | — | Bài đăng của user khác |
| GET | `/post/my/stats` | JWT | Thống kê bài đăng của mình |
| GET | `/post/:id` | — | Chi tiết bài đăng |
| POST | `/post` | JWT | Tạo bài đăng mới (multipart, tối đa 5 ảnh) |
| PATCH | `/post/:id` | JWT | Cập nhật bài đăng |
| PATCH | `/post/:id/status` | JWT | Đổi trạng thái (`available`/`done`) |
| POST | `/post/:id/bump` | JWT | Đẩy bài đăng lên đầu (cooldown 24h, free Tier 1) |
| DELETE | `/post/:id` | JWT | Xóa bài đăng |

### Bump — `/bump`

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| POST | `/bump/:postId/order` | JWT | Tạo đơn PayOS — body: `{ package: "plus_3d" \| "vip_7d" }` |
| POST | `/bump/webhook` | — | PayOS callback webhook (verify signature) |
| GET | `/bump/:postId/status` | — | Trạng thái boost hiện tại + thời gian còn lại |
| GET | `/bump/return?postId=` | — | Redirect về `traotay://bump/success` sau thanh toán |
| GET | `/bump/cancel?postId=` | — | Redirect về `traotay://bump/cancel` sau huỷ |
| POST | `/bump/dev/boost` | DEV_SECRET | Boost thủ công 1 bài (không PayOS) — body: `{ secret, userEmail, tier: 2\|3, postId? }`. Dùng để test E2E khi chưa có PayOS keys thật |

### Chat — `/chat`

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| POST | `/chat/room` | JWT | Tạo hoặc lấy room chat với người bán |
| GET | `/chat/rooms` | JWT | Danh sách room chat của mình |
| GET | `/chat/unread-count` | JWT | Số tin nhắn chưa đọc |
| POST | `/chat/room/:roomId/read` | JWT | Đánh dấu đã đọc |
| GET | `/chat/room/:roomId` | JWT | Thông tin room |
| GET | `/chat/room/:roomId/messages` | JWT | Lịch sử tin nhắn |

#### Chat WebSocket Events (Socket.io)

| Event | Hướng | Mô tả |
|---|---|---|
| `join` | client → server | Vào room (`{ roomId }`) |
| `sendMessage` | client → server | Gửi tin nhắn (`{ roomId, text, senderId }`) |
| `receive_message` | server → client | Nhận tin nhắn mới |
| `messages_read` | server → client | Tin nhắn đã được đọc |

### Notification — `/notification`

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| GET | `/notification` | JWT | Danh sách thông báo |
| GET | `/notification/unread-count` | JWT | Số thông báo chưa đọc |
| PATCH | `/notification/:id/read` | JWT | Đánh dấu đã đọc |
| PATCH | `/notification/read-all` | JWT | Đánh dấu tất cả đã đọc |
| POST | `/notification/fcm-token` | JWT | Lưu FCM token |

#### Dev endpoints (cần body `{ secret: DEV_SECRET }`)

| Method | Path | Mô tả |
|---|---|---|
| POST | `/notification/dev/reset-test-data` | Xóa sạch + tạo 10 acc test |
| POST | `/notification/dev/seed-chat` | Tạo room chat test |
| POST | `/notification/dev/seed-posts` | Seed bài đăng cho userId |
| POST | `/notification/dev/seed-notifications` | Tạo tất cả loại noti để test |
| POST | `/notification/dev/setup-test` | Setup full test data |
| POST | `/notification/dev/clear-notifications` | Xóa notification của userId |
| POST | `/notification/dev/reset-reviews` | Xóa hết reviews test, tạo lại đúng 1 cái |
| POST | `/notification/dev/test-review` | Tạo deal + review + gửi FCM |
| POST | `/notification/dev/test-keyword-alert` | Trigger keyword alert |
| POST | `/notification/dev/user-debug` | Xem 5 noti gần nhất + keywords |
| POST | `/notification/dev/find-user` | Tìm user theo email/phone |
| POST | `/notification/test-push` | Gửi FCM test thô |

### Favorite — `/favorite`

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| POST | `/favorite` | JWT | Thêm yêu thích (`{ postId }`) |
| DELETE | `/favorite` | JWT | Xóa yêu thích (`{ postId }`) |
| GET | `/favorite/:userId` | — | Danh sách yêu thích |

### Dac Dinh — `/dac-dinh` (luyện thi Đặc định kỹ năng, web-only — ADR-0015)

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| POST | `/dac-dinh/attempt` | JWT | Ghi 1 lần hoàn thành dạng bài (`{ chapterId, exerciseType, score, total }`) — best-effort, chạy song song với localStorage phía client |
| POST | `/dac-dinh/heartbeat` | JWT | Ping presence (không tham số) — client gọi mỗi 45s trong lúc còn ở trang, dùng cho số "online" admin — ADR-0016 |

Thống kê admin — `GET /admin/dac-dinh/online?minutes=10` (trả `onlineCount`, `totalAttempts`, `totalUsers`) và `GET /admin/dac-dinh/leaderboard?period=day|week|month|year&limit=20` (xếp theo số cặp chương+dạng bài đạt 100%; trả thêm `participantCount` = số user duy nhất có ít nhất 1 lượt làm bài trong kỳ, kể cả chưa đạt 100%) (đều AdminGuard), nằm chung trong `AdminController`/`AdminService` như mọi domain admin khác (không có module riêng).

### Follow — `/follow`

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| POST | `/follow/:userId` | JWT | Follow user |
| DELETE | `/follow/:userId` | JWT | Unfollow user |
| GET | `/follow/:userId/status` | JWT | Kiểm tra đang follow không |
| GET | `/follow/:userId/followers` | — | Danh sách followers |
| GET | `/follow/:userId/following` | — | Danh sách đang follow |
| GET | `/follow/:userId/counts` | — | Số lượng follow |
| GET | `/follow/feed` | JWT | Feed bài đăng từ người đang follow |

### Deal — `/deal`

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| POST | `/deal` | JWT | Tạo deal (xin nhận đồ) |
| GET | `/deal/incoming` | JWT | Deal nhận được (owner) |
| GET | `/deal/outgoing` | JWT | Deal đã gửi (requester) |
| PATCH | `/deal/:id/status` | JWT | Cập nhật trạng thái deal |

### Review — `/review`

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| POST | `/review` | JWT | Tạo đánh giá sau deal |
| GET | `/review/check/:dealId` | JWT | Kiểm tra đã review chưa |
| GET | `/review/user/:userId` | — | Đánh giá của user |

### Report — `/report`

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| POST | `/report` | JWT | Báo cáo bài đăng |

---

## Frontend — Flutter App

### Thông tin cơ bản

| Thông số | Giá trị |
|---|---|
| Framework | Flutter (SDK ≥ 3.3.0) |
| Package name | `cho_va_tang` |
| State management | Provider |
| HTTP Client | `http` package |
| WebSocket | `socket_io_client` |
| Storage | `shared_preferences`, `flutter_secure_storage` |
| Push notifications | `firebase_messaging` (FCM) |
| Image cache | `cached_network_image` |
| WebView | `webview_flutter` (PayOS thanh toán) |

### Base URL

```dart
// app/lib/services/api_service.dart
static const String baseUrl = 'http://192.168.0.108:3800'; // IP máy trên LAN wifi
// isLocal = true khi baseUrl chứa localhost / 192.168 / 10.0 → hiện tab Dev login
```

### Cấu trúc màn hình

```
app/lib/screens/
├── app_shell.dart               # Shell chính (bottom nav 5 tabs)
├── splash_screen.dart           # Màn hình khởi động (kiểm tra token)
├── home_tab.dart                # Trang chủ — danh sách bài đăng + filter
├── search_tab.dart              # Tìm kiếm
├── messages_tab.dart            # Danh sách chat
├── profile_tab.dart             # Hồ sơ cá nhân
├── notifications_screen.dart    # Thông báo in-app
├── chat_screen.dart             # Chat 1-1 (WebSocket)
├── post_detail_screen.dart      # Chi tiết bài đăng
├── user_profile_screen.dart     # Hồ sơ user khác
├── post/
│   ├── create_post_tab.dart        # Đăng bài mới
│   ├── my_posts_screen.dart        # Bài đăng của tôi + nút Đẩy bài
│   ├── bump_package_screen.dart    # Chọn gói boost (Free/Plus/VIP) + PayOSWebView
│   └── edit_post_screen.dart       # Sửa bài đăng
├── deal/
│   └── deals_screen.dart           # Danh sách giao dịch
├── profile/
│   └── my_reviews_screen.dart      # Đánh giá nhận được
├── admin/
│   └── admin_dashboard_screen.dart # Quản trị: Stats/Posts/Users/Reports/Doanh thu
└── auth/
    ├── phone_login_screen.dart     # Đăng nhập SĐT (Firebase OTP)
    └── email_login_screen.dart     # Đăng nhập email OTP
```

### Bottom Navigation (5 tabs)

| Tab | Icon | Label |
|---|---|---|
| 0 | home | Trang chủ (badge thông báo) |
| 1 | search | Tìm kiếm |
| 2 | add_circle | Đăng tin (mở CreatePostTab) |
| 3 | chat_bubble | Tin nhắn (badge unread) |
| 4 | person | Cá nhân |

### Luồng xác thực

1. App mở → `SplashScreen` → kiểm tra `auth_token` trong `SharedPreferences`
2. Có token hợp lệ → `AppShell`
3. Không có → `PhoneLoginScreen` (OTP SĐT) hoặc `EmailLoginScreen` (OTP Email)
4. Đăng nhập thành công → lưu `auth_token` + `user_id` → `AppShell`
5. Đăng ký người dùng mới → tự động khi OTP thành công lần đầu (isNewUser = true)

---

## Conventions

### Backend
- ID dùng **cuid** (không phải UUID hay integer)
- Prisma schema tại `backend/prisma/schema.prisma`
- ValidationPipe: `whitelist: true`
- CORS mở toàn bộ

### Flutter
- Tất cả Provider đặt ở `MultiProvider` trong `main.dart`
- API call tập trung trong `ApiService` (static methods)
- Timeout: 15s GET/POST thường, 45s upload ảnh
- Màu sắc: luôn dùng `AppTheme.*`, không hardcode hex
