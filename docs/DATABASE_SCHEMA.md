# DATABASE SCHEMA — Cấu trúc cơ sở dữ liệu

## Thông tin kết nối

| Thông số | Giá trị |
|---|---|
| Engine | PostgreSQL 15 |
| Host | `localhost` (dev) / `postgres` (docker) |
| Port | `5432` |
| Database | `app` |
| User | `postgres` |
| Password | `postgres` |
| Connection string | `postgresql://postgres:postgres@localhost:5432/app` |

---

## ORM: Prisma v6

- Schema file: `backend/generated/prisma/schema.prisma`
- Output client: `backend/generated/prisma/`
- Regenerate client: `npx prisma generate`
- Migrate DB: `npx prisma migrate dev`
- Xem DB qua GUI: `npx prisma studio`

---

## Tables

### `User`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | `String` (UUID) | PK, auto-generate |
| `email` | `String` | UNIQUE, dùng để đăng nhập |
| `password` | `String` | Bcrypt hashed |
| `name` | `String?` | Nullable, tên hiển thị |
| `avatar` | `String?` | Nullable, URL ảnh đại diện |
| `createdAt` | `DateTime` | Tự động set khi tạo |

**Relations:**
- `posts Post[]` — Một user có nhiều bài đăng

---

### `Post`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | `String` (UUID) | PK, auto-generate |
| `title` | `String` | Tiêu đề bài đăng |
| `description` | `String` | Mô tả chi tiết |
| `price` | `Float` | Giá (0 = tặng miễn phí) |
| `images` | `String[]` | Mảng tên file ảnh (lưu filename, không lưu full URL) |
| `createdAt` | `DateTime` | Tự động set khi tạo |
| `userId` | `String` (UUID) | FK → `User.id` |

**Relations:**
- `user User` — Mỗi bài đăng thuộc về một user

**Lưu ý từ code [từ code]:**
- Khi tạo post, client gửi thêm các field: `itemCategory`, `province`, `district`, `ward`, `addressDetail`, `listingType` — nhưng các cột này **chưa có trong Prisma schema** hiện tại. Cần migrate thêm.

---

## Enums (dự kiến — chưa trong schema)

> Các giá trị này được dùng trong Flutter app nhưng chưa được định nghĩa trong DB schema.

### `listingType`
- `sell` — Bán
- `give` — Tặng miễn phí

### `itemCategory`
- `other` — Khác (default)
- *(còn lại chưa xác nhận)*

---

## Lưu ý quan trọng

1. **Favorite** — FavoriteService tồn tại trong code nhưng model `Favorite` chưa có trong Prisma schema. Cần bổ sung.
2. **Chat message** — ChatGateway hiện dùng broadcast realtime, chưa lưu tin nhắn vào DB.
3. **Report** — ReportController chỉ `console.log`, chưa có model DB.
4. Tất cả ID dùng **UUID string**, không phải integer auto-increment.
