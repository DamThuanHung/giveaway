# CORE FRAMEWORK — Kiến trúc hệ thống

## Tổng quan dự án

**Tên dự án:** Cho và Tặng (Jimoty Clone VN)
**Mô tả:** Ứng dụng mua bán & trao tặng đồ cũ tại Việt Nam, lấy cảm hứng từ Jimoty (Nhật Bản).
**Trạng thái:** Đang phát triển (Development)

---

## Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────┐
│                   CLIENT LAYER                      │
│          Flutter App (Android / iOS)                │
│     Provider (State) + http + socket_io_client      │
└────────────────────┬────────────────────────────────┘
                     │ HTTP REST + WebSocket
                     │ Port 3800 (LAN: 192.168.0.108)
┌────────────────────▼────────────────────────────────┐
│                   API LAYER                         │
│              NestJS (TypeScript)                    │
│   REST Controllers + WebSocket Gateway (Socket.io)  │
│              JWT Authentication                     │
└────────────────────┬────────────────────────────────┘
                     │ Prisma ORM
┌────────────────────▼────────────────────────────────┐
│                  DATA LAYER                         │
│            PostgreSQL (port 5432)                   │
│            Redis (port 6379) — dự phòng             │
└─────────────────────────────────────────────────────┘
```

---

## Backend — NestJS

### Thông tin cơ bản
| Thông số | Giá trị |
|---|---|
| Framework | NestJS v11 |
| Ngôn ngữ | TypeScript |
| Port | `3800` |
| Địa chỉ nội bộ | `http://192.168.0.108:3800` |
| ORM | Prisma v6 |
| Database | PostgreSQL 15 |
| Auth | JWT (secret: `cho_va_tang_dev_secret`, hết hạn: 7 ngày) |
| Upload ảnh | Multer → lưu vào thư mục `./uploads/` |
| Static files | Serve tại `/uploads/` prefix |

### Cấu trúc thư mục backend
```
backend/
├── src/
│   ├── main.ts                  # Entry point, cấu hình app
│   ├── app.module.ts            # Root module
│   ├── app.controller.ts
│   ├── app.service.ts
│   ├── user/                    # Module User (CRUD + Login)
│   ├── post/                    # Module Post (CRUD + Upload ảnh)
│   ├── favorite/                # Module Favorite (yêu thích bài đăng)
│   ├── report/                  # Module Report (báo cáo bài đăng)
│   ├── chat/                    # Module Chat (WebSocket Gateway)
│   └── prisma/                  # PrismaService
├── generated/prisma/            # Prisma client đã generate
├── uploads/                     # Ảnh upload (tạo tự động khi khởi động)
├── docker-compose.yml
├── Dockerfile
├── .env
└── .env.example
```

### API Endpoints

#### User
| Method | Path | Mô tả |
|---|---|---|
| POST | `/user` | Tạo tài khoản mới |
| GET | `/user` | Lấy danh sách users |
| POST | `/user/login` | Đăng nhập, trả về JWT |

#### Post
| Method | Path | Mô tả |
|---|---|---|
| GET | `/post` | Lấy danh sách tất cả bài đăng |
| POST | `/post` | Tạo bài đăng mới (multipart/form-data, tối đa 5 ảnh) |

#### Favorite
| Method | Path | Mô tả |
|---|---|---|
| POST | `/favorite` | Thêm bài đăng vào yêu thích |
| DELETE | `/favorite` | Xóa khỏi yêu thích |
| GET | `/favorite/:userId` | Lấy danh sách yêu thích của user |

#### Report
| Method | Path | Mô tả |
|---|---|---|
| POST | `/report` | Báo cáo bài đăng (chỉ log, chưa lưu DB) |

#### Chat (WebSocket — Socket.io)
| Event (client → server) | Mô tả |
|---|---|
| `sendMessage` | Gửi tin nhắn |

| Event (server → client) | Mô tả |
|---|---|
| `receive_message` | Nhận tin nhắn broadcast |

### Upload ảnh
- Endpoint: `POST /post` với field `images` (multipart)
- Tối đa 5 ảnh/lần
- Tên file: `images-{timestamp}-{random}.{ext}`
- URL truy cập: `http://192.168.0.108:3800/uploads/{filename}`

---

## Frontend — Flutter App

### Thông tin cơ bản
| Thông số | Giá trị |
|---|---|
| Framework | Flutter (SDK ≥ 3.3.0) |
| App name | `cho_va_tang` |
| State management | Provider |
| HTTP Client | `http` package |
| WebSocket | `socket_io_client` |
| Storage | `shared_preferences`, `flutter_secure_storage` |
| Maps | `google_maps_flutter`, `geocoding` |

### Cấu trúc thư mục app
```
app/lib/
├── main.dart                    # Entry point
├── models/
│   ├── post.dart                # Model bài đăng
│   ├── chat_message.dart        # Model tin nhắn
│   └── chat_thread.dart         # Model luồng chat
├── providers/
│   ├── auth_provider.dart       # Quản lý trạng thái đăng nhập
│   ├── post_provider.dart       # Quản lý danh sách bài đăng
│   └── chat_provider.dart       # Quản lý chat
├── screens/
│   ├── app_shell.dart           # Shell chính (bottom nav)
│   ├── home_tab.dart            # Tab trang chủ
│   ├── login_screen.dart        # Màn hình đăng nhập
│   ├── post_detail_screen.dart  # Chi tiết bài đăng
│   ├── favorites_tab.dart       # Tab yêu thích
│   ├── messages_tab.dart        # Tab tin nhắn
│   ├── chat_screen.dart         # Màn hình chat 1-1
│   └── profile_tab.dart         # Tab hồ sơ
├── services/
│   ├── api_service.dart         # Gọi REST API
│   ├── chat_socket_service.dart # Kết nối WebSocket
│   └── favorite_service.dart    # Logic yêu thích
├── widgets/
│   └── post_card.dart           # Widget card bài đăng
├── data/
│   └── vietnam_address_data.dart # Dữ liệu địa chỉ Việt Nam
└── theme/
    └── app_theme.dart           # Theme ứng dụng
```

### Base URL
```dart
// lib/services/api_service.dart
static const String baseUrl = 'http://192.168.0.108:3800';
```
> Khi chạy trên thiết bị thật, đảm bảo điện thoại và máy tính cùng mạng WiFi.

### Luồng xác thực
1. User đăng nhập → `POST /user/login` → nhận `access_token`
2. Token lưu vào `SharedPreferences` với key `auth_token`
3. Mọi request sau đó gửi kèm header: `Authorization: Bearer {token}`

---

## Conventions (Quy ước code)

### Backend
- Toàn bộ ID dùng UUID (string), không dùng integer
- Prisma client được generate ra thư mục `generated/prisma/`
- ValidationPipe bật `whitelist: true` và `forbidNonWhitelisted: true`
- CORS mở toàn bộ (`enableCors()`)

### Flutter
- Tất cả Provider đặt ở `MultiProvider` trong `main.dart`
- API call tập trung trong `ApiService` (static methods)
- Timeout: 15s cho GET/POST thường, 45s cho upload ảnh
