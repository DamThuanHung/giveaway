# CORE FRAMEWORK — Kiến trúc hệ thống

## Tổng quan dự án

**Tên dự án:** Trao Tay (Cho và Tặng)
**Mô tả:** Ứng dụng trao tặng & mua bán đồ cũ tại Việt Nam
**Trạng thái:** Đang phát triển — deployed trên Railway

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
│     PostgreSQL (Railway) + Cloudinary CDN           │
└─────────────────────────────────────────────────────┘
```

---

## Backend — NestJS

### Thông tin cơ bản

| Thông số | Giá trị |
|---|---|
| Framework | NestJS v11 |
| Ngôn ngữ | TypeScript |
| Port | `process.env.PORT` (Railway tự set) |
| Production URL | `https://giveaway-production-e88c.up.railway.app` |
| ORM | Prisma v6 |
| Database | PostgreSQL (Railway) |
| Auth | JWT (biến `JWT_SECRET`) + Firebase Phone Auth |
| Upload ảnh | Cloudinary CDN (biến `CLOUDINARY_*`) |

### Biến môi trường bắt buộc

| Biến | Mô tả |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Railway) |
| `JWT_SECRET` | Secret key cho JWT |
| `PORT` | Port server (Railway tự set) |
| `BASE_URL` | Public URL của server |
| `FCM_SERVICE_ACCOUNT` | JSON credentials Firebase Cloud Messaging |
| `DEV_SECRET` | Secret để gọi `/dev/*` endpoints |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary config |
| `CLOUDINARY_API_KEY` | Cloudinary config |
| `CLOUDINARY_API_SECRET` | Cloudinary config |

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
├── cloudinary/              # Upload ảnh lên Cloudinary
├── fcm/                     # Firebase Cloud Messaging service
├── admin/                   # Quản trị
└── prisma/                  # PrismaService
```

---

## API Endpoints

### User — `/user`

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| POST | `/user` | — | Tạo tài khoản (email + password) |
| POST | `/user/login` | — | Đăng nhập email + password |
| POST | `/user/phone-login` | — | Đăng nhập SĐT (Firebase idToken) |
| POST | `/user/email-login/send` | — | Gửi OTP đăng nhập qua email |
| POST | `/user/email-login/verify` | — | Xác nhận OTP → trả JWT |
| POST | `/user/forgot-password/send` | — | Gửi OTP quên mật khẩu |
| POST | `/user/forgot-password/reset` | — | Đặt lại mật khẩu bằng OTP |
| POST | `/user/link-email/send` | JWT | Gửi OTP liên kết email |
| POST | `/user/link-email/confirm` | JWT | Xác nhận liên kết email |
| GET | `/user/me` | JWT | Lấy thông tin user hiện tại |
| GET | `/user/:id` | — | Lấy thông tin user theo ID |
| PATCH | `/user/:id` | JWT | Cập nhật profile |
| POST | `/user/avatar` | JWT | Upload avatar (Cloudinary) |
| POST | `/user/change-password` | JWT | Đổi mật khẩu |
| POST | `/user/block/:blockedId` | JWT | Chặn user |
| DELETE | `/user/block/:blockedId` | JWT | Bỏ chặn user |
| GET | `/user/blocked/list` | JWT | Danh sách đã chặn |
| GET | `/user/block/check/:targetId` | JWT | Kiểm tra có chặn không |

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
| DELETE | `/post/:id` | JWT | Xóa bài đăng |

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

#### Dev endpoints (cần header `x-dev-secret`)

| Method | Path | Mô tả |
|---|---|---|
| POST | `/notification/dev/reset-test-data` | Xóa sạch + tạo 10 acc test |
| POST | `/notification/dev/seed-chat` | Tạo room chat test |
| POST | `/notification/dev/clear-notifications` | Xóa notification của userId |

### Favorite — `/favorite`

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| POST | `/favorite` | JWT | Thêm yêu thích (`{ postId }`) |
| DELETE | `/favorite` | JWT | Xóa yêu thích (`{ postId }`) |
| GET | `/favorite/:userId` | — | Danh sách yêu thích |

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

### Base URL

```dart
// app/lib/services/api_service.dart
static const String baseUrl = 'https://giveaway-production-e88c.up.railway.app';
```

### Cấu trúc màn hình

```
app/lib/screens/
├── app_shell.dart               # Shell chính (bottom nav 5 tabs)
├── home_tab.dart                # Trang chủ — danh sách bài đăng + filter
├── search_tab.dart              # Tìm kiếm
├── post_create_screen.dart      # Đăng bài mới
├── favorites_tab.dart           # Yêu thích
├── messages_tab.dart            # Danh sách chat
├── chat_screen.dart             # Chat 1-1
├── notifications_screen.dart    # Thông báo
├── profile_tab.dart             # Hồ sơ cá nhân
├── post_detail_screen.dart      # Chi tiết bài đăng
├── user_profile_screen.dart     # Hồ sơ user khác
├── login_screen.dart            # Đăng nhập email
├── phone_login_screen.dart      # Đăng nhập SĐT (Firebase OTP)
├── register_screen.dart         # Đăng ký
└── onboarding_screen.dart       # Onboarding (lần đầu mở app)
```

### Bottom Navigation (5 tabs)

| Tab | Icon | Label |
|---|---|---|
| 0 | home | Trang chủ |
| 1 | search | Tìm kiếm |
| 2 | add_circle | Đăng tin (FAB style) |
| 3 | favorite | Yêu thích |
| 4 | person | Hồ sơ |

### Luồng xác thực

1. App mở → kiểm tra `auth_token` trong `SharedPreferences`
2. Có token → `AppShell` (home)
3. Không có → `OnboardingScreen` (lần đầu) hoặc `PhoneLoginScreen`
4. Đăng nhập thành công → lưu `auth_token` + `user_id` → `AppShell`

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
