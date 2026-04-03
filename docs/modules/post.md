# MODULE: Post

## Mô tả
Quản lý bài đăng mua bán / tặng đồ: tạo mới, xem danh sách, upload ảnh.

## Files liên quan
| Layer | File |
|---|---|
| Controller | `backend/src/post/post.controller.ts` |
| Service | `backend/src/post/post.service.ts` |
| Module | `backend/src/post/post.module.ts` |
| Flutter Provider | `app/lib/providers/post_provider.dart` |
| Flutter Model | `app/lib/models/post.dart` |
| Flutter Widget | `app/lib/widgets/post_card.dart` |
| Flutter Screen | `app/lib/screens/post_detail_screen.dart` |
| Flutter API call | `app/lib/services/api_service.dart` |

## API Endpoints

### GET `/post` — Lấy danh sách bài đăng
**Response:** Array Post objects

---

### POST `/post` — Tạo bài đăng mới
**Content-Type:** `multipart/form-data`

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
| `images` | File[] | Không | Tối đa 5 ảnh |

**Response:** Post object vừa tạo (status 201)

## Cơ chế upload ảnh
1. Multer nhận file, lưu vào `backend/uploads/`
2. Tên file: `images-{timestamp}-{random}.{ext}` (đảm bảo không trùng)
3. Lưu vào DB: mảng filename (không phải full URL)
4. Truy cập ảnh: `http://192.168.0.108:3800/uploads/{filename}`

## DB Model
Xem [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md) — bảng `Post`

## Lưu ý
- Các field địa chỉ và `itemCategory`, `listingType` **chưa có trong Prisma schema** — cần migrate thêm
- Timeout upload từ Flutter: **45 giây** (dành cho mạng WiFi chậm)
- Hiện chưa có auth guard — ai cũng có thể POST tạo bài
