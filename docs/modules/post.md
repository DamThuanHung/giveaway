# MODULE: Post

## Mô tả
Quản lý bài đăng mua bán / tặng đồ: tạo mới, xem danh sách, upload ảnh lên Cloudinary.

## Files liên quan
| Layer | File |
|---|---|
| Controller | `backend/src/post/post.controller.ts` |
| Service | `backend/src/post/post.service.ts` |
| Module | `backend/src/post/post.module.ts` |
| Cloudinary Service | `backend/src/cloudinary/cloudinary.service.ts` |
| Flutter Screen (tạo bài) | `app/lib/screens/post/create_post_tab.dart` |
| Flutter Screen (bài của tôi) | `app/lib/screens/post/my_posts_screen.dart` |
| Flutter Screen (chi tiết) | `app/lib/screens/post_detail_screen.dart` |
| Flutter Shell | `app/lib/screens/app_shell.dart` |
| Flutter API call | `app/lib/services/api_service.dart` |

## API Endpoints

### POST `/post` — Tạo bài đăng mới
**Content-Type:** `multipart/form-data` | Auth: JWT bắt buộc

**Fields:**
| Field | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `title` | string | Có | Tiêu đề bài đăng |
| `description` | string | Có | Mô tả chi tiết |
| `price` | number | Có | Giá (0 = miễn phí) |
| `itemCategory` | string | Không | Danh mục (default: `other`) |
| `province` | string | Không | Tỉnh/Thành phố |
| `district` | string | Không | Quận/Huyện |
| `ward` | string | Không | Phường/Xã |
| `addressDetail` | string | Không | Địa chỉ chi tiết |
| `listingType` | string | Không | `sell` hoặc `give` |
| `images` | File[] | Không | Tối đa 10 ảnh (Multer memoryStorage) |

**Response:** Post object vừa tạo (status 201)

**Lỗi có thể xảy ra:**
- `400 Bad Request` — Upload ảnh thất bại (kèm message từ Cloudinary)

---

### GET `/post` — Danh sách bài đăng
**Query params:** `page`, `limit`, `search`, `province`, `listingType`, `itemCategory`, `postType`, `minPrice`, `maxPrice`, `status`, `lat`, `lng`, `radius`, `sortBy`

### GET `/post/my` — Bài đăng của mình (JWT)
### GET `/post/user/:userId` — Bài đăng của user khác
### GET `/post/my/stats` — Thống kê bài đăng (JWT)
### GET `/post/:id` — Chi tiết bài đăng
### PATCH `/post/:id` — Cập nhật bài đăng (JWT)
### PATCH `/post/:id/status` — Đổi trạng thái (JWT): `available` / `done`
### DELETE `/post/:id` — Xóa bài đăng (JWT)

---

## Cơ chế upload ảnh (Cloudinary)

1. Flutter gửi ảnh dưới dạng `multipart/form-data`, field name: `images`
2. NestJS nhận qua `FilesInterceptor('images', 10, { storage: memoryStorage() })`
3. Với mỗi file: gọi `CloudinaryService.uploadBuffer(buffer, 'traotay/posts')`
4. `CloudinaryService.configure()` được gọi **trước mỗi lần upload** (không phải trong constructor)
5. Cloudinary trả về `secure_url` → lưu vào DB
6. Transformation: `width: 1200, crop: limit, quality: auto:good, fetch_format: auto`

> **Quan trọng:** `cloudinary.config()` phải gọi trong method `configure()` được invoke trước mỗi `uploadBuffer()`, không phải trong constructor của service. Lý do: NestJS DI không đảm bảo env vars được load khi constructor chạy trong mọi môi trường (Railway deploy).

## Flutter — Luồng đăng bài

### `ApiService.createPost()` — return `Future<String?>`
- `null` = thành công
- `String` = thông báo lỗi cụ thể từ server

**Lý do đổi từ `bool`:** Cần hiển thị message lỗi thực tế từ server (ví dụ: "Upload ảnh thất bại: must supply api_key") thay vì chỉ biết thất bại hay không.

### SnackBar sau khi đăng bài thành công
- SnackBar "Đăng tin thành công!" được show tại **`AppShell`** (parent scaffold), **KHÔNG** show trong `CreatePostTab`
- Lý do: `Navigator.pop(context, true)` xóa scaffold của `CreatePostTab` trước khi SnackBar kịp hiển thị
- Pattern: `CreatePostTab` gọi `Navigator.pop(context, true)` → `AppShell` nhận `result == true` → show SnackBar

### MyPostsScreen — Tap vào bài để xem chi tiết
- Mỗi `_PostItem` được bọc trong `GestureDetector` → navigate đến `PostDetailScreen`
- Truyền: `isFavorite: false, onToggleFavorite: () async {}`

## Bugs đã fix (21/04/2026)
- **Overflow trong PostDetailScreen:** `firstWhere()` crash khi category không tìm thấy → bọc try/catch; datetime text bọc `Flexible`; "Bài đăng khác..." bọc `Expanded`
- **MyPostsScreen không navigate:** Thiếu GestureDetector → đã thêm
- **SnackBar không hiện:** Đã move lên AppShell

## DB Model
Xem [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md) — bảng `Post`
