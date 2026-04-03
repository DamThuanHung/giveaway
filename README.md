# Cho và Tặng — Jimoty Clone VN

Ứng dụng mua bán & trao tặng đồ cũ tại Việt Nam.

---

## Yêu cầu hệ thống

| Công cụ | Phiên bản | Dùng cho |
|---|---|---|
| Node.js | >= 18 | Backend |
| npm | >= 9 | Backend |
| Flutter SDK | >= 3.3.0 | Mobile App |
| PostgreSQL | 15 | Database |
| Docker & Docker Compose | Bất kỳ | Tuỳ chọn |

---

## Cấu trúc dự án

```
giveaway/
├── app/          # Flutter mobile app (Android / iOS)
├── backend/      # NestJS REST API + WebSocket
├── docs/         # Tài liệu kỹ thuật
│   ├── CORE_FRAMEWORK.md
│   ├── DATABASE_SCHEMA.md
│   ├── PROJECT_KNOWLEDGE.md
│   └── modules/
│       ├── _index.md
│       ├── user.md
│       ├── post.md
│       ├── favorite.md
│       ├── report.md
│       └── chat.md
└── README.md
```

---

## Hướng dẫn chạy Backend (NestJS)

### Bước 1 — Cài đặt dependencies

```bash
cd backend
npm install
```

### Bước 2 — Cấu hình môi trường

```bash
cp .env.example .env
```

Mở file `.env` và kiểm tra:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/app"
```

### Bước 3 — Khởi động PostgreSQL

**Cách A: Dùng Docker (khuyến nghị)**
```bash
docker-compose up -d postgres
```

**Cách B: PostgreSQL đã cài sẵn trên máy**
- Đảm bảo PostgreSQL đang chạy trên port `5432`
- Tạo database tên `app`:
```sql
CREATE DATABASE app;
```

### Bước 4 — Migrate database & generate Prisma client

```bash
npx prisma migrate dev --name init
npx prisma generate
```

> Nếu chỉ muốn sync schema mà không tạo migration file:
> ```bash
> npx prisma db push
> ```

### Bước 5 — Chạy server

```bash
# Development (auto-reload khi đổi code)
npm run start:dev

# Production
npm run build
npm run start:prod
```

Server khởi động tại: `http://0.0.0.0:3800`

**Kiểm tra server đang chạy:**
```
http://localhost:3800/post
```

---

## Hướng dẫn chạy Backend bằng Docker Compose (toàn bộ stack)

```bash
cd backend
docker-compose up --build
```

Sẽ khởi động: Backend + PostgreSQL + Redis cùng lúc.

> Lưu ý: docker-compose mặc định dùng port `3000`, nhưng code thực tế dùng `3800`.
> Cần sửa `docker-compose.yml` nếu muốn dùng Docker.

---

## Hướng dẫn chạy Flutter App

### Bước 1 — Cài đặt dependencies

```bash
cd app
flutter pub get
```

### Bước 2 — Cấu hình địa chỉ server

Mở file `app/lib/services/api_service.dart`, tìm dòng:

```dart
static const String baseUrl = 'http://192.168.0.108:3800';
```

Đổi IP thành địa chỉ máy tính đang chạy backend:
- **Windows:** Mở `cmd` → chạy `ipconfig` → tìm `IPv4 Address`
- **Mac/Linux:** Mở terminal → chạy `ifconfig` → tìm `inet`

> Điện thoại và máy tính phải **cùng mạng WiFi**.

### Bước 3 — Chạy app

**Trên thiết bị thật (khuyến nghị cho test API):**
```bash
flutter run
```

**Chọn device khi có nhiều thiết bị:**
```bash
flutter devices          # Xem danh sách thiết bị
flutter run -d <device_id>
```

**Chạy trên emulator Android:**
```bash
# Mở Android emulator trước, sau đó:
flutter run
```

---

## Quy trình phát triển thông thường

```
1. Khởi động PostgreSQL (Docker hoặc local)
2. cd backend && npm run start:dev
3. cd app && flutter run
4. Code thay đổi backend → server tự reload
5. Code thay đổi Flutter → hot reload (nhấn r trong terminal)
```

---

## Các lệnh hữu ích

### Backend

| Lệnh | Mô tả |
|---|---|
| `npm run start:dev` | Chạy dev với auto-reload |
| `npm run build` | Build production |
| `npm run lint` | Kiểm tra lỗi code |
| `npm run test` | Chạy unit tests |
| `npx prisma studio` | Mở GUI quản lý database |
| `npx prisma migrate dev` | Tạo và chạy migration mới |
| `npx prisma generate` | Regenerate Prisma client |
| `npx prisma db push` | Sync schema không tạo migration |

### Flutter

| Lệnh | Mô tả |
|---|---|
| `flutter pub get` | Cài dependencies |
| `flutter run` | Chạy app |
| `flutter build apk` | Build APK Android |
| `flutter build ios` | Build iOS |
| `flutter clean` | Xóa build cache |
| `flutter analyze` | Phân tích lỗi code |

---

## Kiểm tra kết nối

Sau khi backend chạy, test các endpoint này:

```bash
# Lấy danh sách bài đăng
curl http://localhost:3800/post

# Đăng ký tài khoản
curl -X POST http://localhost:3800/user \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","name":"Test User"}'

# Đăng nhập
curl -X POST http://localhost:3800/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

---

## Tài liệu kỹ thuật

| File | Nội dung |
|---|---|
| [docs/CORE_FRAMEWORK.md](docs/CORE_FRAMEWORK.md) | Kiến trúc hệ thống, API endpoints, cấu trúc thư mục |
| [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) | Schema database, mô tả từng bảng và cột |
| [docs/PROJECT_KNOWLEDGE.md](docs/PROJECT_KNOWLEDGE.md) | Thuật ngữ, business rules, các TODO cần làm |
| [docs/modules/_index.md](docs/modules/_index.md) | Danh sách tất cả modules |
| [docs/modules/user.md](docs/modules/user.md) | Module User |
| [docs/modules/post.md](docs/modules/post.md) | Module Post |
| [docs/modules/favorite.md](docs/modules/favorite.md) | Module Favorite |
| [docs/modules/report.md](docs/modules/report.md) | Module Report |
| [docs/modules/chat.md](docs/modules/chat.md) | Module Chat / WebSocket |

---

## Xử lý lỗi thường gặp

### Backend không start được
- Kiểm tra PostgreSQL đã chạy chưa
- Kiểm tra file `.env` đã có `DATABASE_URL` chưa
- Chạy `npx prisma generate` nếu báo lỗi Prisma client

### Flutter không kết nối được backend
- Kiểm tra `baseUrl` trong `api_service.dart` đúng IP chưa
- Kiểm tra điện thoại và máy tính cùng WiFi
- Kiểm tra firewall Windows có chặn port `3800` không:
  ```
  Windows Defender Firewall → Allow an app → thêm Node.js
  ```

### Ảnh không hiển thị
- Kiểm tra thư mục `backend/uploads/` tồn tại
- Kiểm tra URL ảnh đúng format: `http://{IP}:3800/uploads/{filename}`
