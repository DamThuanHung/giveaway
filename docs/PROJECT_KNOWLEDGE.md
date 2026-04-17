# PROJECT KNOWLEDGE — Thuật ngữ & Business Rules

## Tên gọi dự án

| Tên | Ý nghĩa |
|---|---|
| **Trao Tay** | Tên thương hiệu (domain: traotay.com.vn) |
| **Cho và Tặng** | Tên nội bộ / package name (`cho_va_tang`) |
| **Jimoty Clone VN** | Tên dev ban đầu, lấy cảm hứng từ Jimoty Nhật Bản |

---

## Thuật ngữ nghiệp vụ

### Bài đăng (Post)
- Đơn vị nội dung trung tâm
- `listingType: give` = tặng miễn phí, `price = 0`
- `listingType: sell` = bán có giá
- `status: available` = còn → `status: done` = đã trao tặng/bán xong
- `postType: item` = đồ vật thông thường (default)
- `postType: realestate` = bất động sản (thêm fields: area, bedrooms, subType, priceUnit)
- `postType: service` = dịch vụ/thợ (thêm fields: priceUnit, serviceArea)
- Tối đa 5 ảnh/bài, lưu URL Cloudinary
- `imageLabel` = URL ảnh thumbnail đại diện (dùng trong chat banner, notification)

### Người dùng (User)
- Đăng nhập bằng **SĐT** (Firebase OTP) — flow chính
- Đăng nhập bằng **email + password** — flow dự phòng
- Đăng nhập bằng **email OTP** — không cần nhớ mật khẩu
- Token JWT có hiệu lực **7 ngày**, lưu `SharedPreferences` key `auth_token`
- User phone-only không có `email/password`, chỉ có `phone`

### Chat (ChatRoom + Message)
- Chat **1-1** theo room, mỗi cặp `[buyerId, sellerId]` chỉ có 1 room duy nhất
- "buyer" = người hỏi/xin nhận, "seller" = người đăng bài
- Room gắn với 1 `postId` (bài đăng đang hỏi)
- Tin nhắn lưu vào DB, có trạng thái `isRead`
- Push notification khi nhận tin nhắn mới (FCM)
- Notification body: `Bạn nhận được tin nhắn mới từ "{tên}" về bài viết "{tiêu đề}"`

### Deal (Giao dịch)
- Flow xin nhận đồ qua chat (không phải nút riêng)
- `status`: `pending` → `accepted` / `rejected` → `done`
- Sau `done` → có thể để lại `Review` (đánh giá 1–5 sao)

### Notification
- `type: "chat"` — tin nhắn mới
- `type: "deal"` — cập nhật deal
- `type: "system"` — thông báo hệ thống
- `data` = JSON string chứa context: `{ roomId, postTitle, postImageLabel }`
- Tap notification → navigate đến màn hình tương ứng

### Follow
- User có thể follow user khác
- Feed riêng chứa bài đăng từ người đang follow (`GET /follow/feed`)

---

## Business Rules quan trọng

### Upload ảnh
- Ảnh upload lên **Cloudinary CDN** (không lưu local)
- Trong DB lưu **URL đầy đủ** (`https://res.cloudinary.com/...`)
- `imageLabel` = URL ảnh đầu tiên, dùng cho thumbnail

### Xác thực
- Header: `Authorization: Bearer {token}`
- Dev endpoints: header `x-dev-secret: {DEV_SECRET}`

### Trạng thái bài đăng
| Status | Hiển thị |
|---|---|
| `available` | Bình thường, có thể nhắn tin |
| `done` | Hiển thị badge "Đã trao tặng", nút nhắn tin bị disable |

### Danh mục (itemCategory)
`electronics`, `furniture`, `clothing`, `kitchen`, `books`, `toys`, `sports`, `vehicles`, `beauty`, `pets`, `tools`, `food`, `baby`, `music`, `realestate`, `service`, `other` (17 danh mục)

### Test accounts
- Email: `1@test.com` → `10@test.com`
- Password: `123456`
- Tạo lại bằng: `POST /notification/dev/reset-test-data` (header `x-dev-secret`)

---

## Luồng chính của ứng dụng

```
[App khởi động]
    ├── Lần đầu → OnboardingScreen → PhoneLoginScreen
    └── Đã login → AppShell (5 tabs)

[Đăng nhập]
    SĐT: nhập số → Firebase OTP → POST /user/phone-login → JWT
    Email: POST /user/login (email + password) → JWT

[Xem bài đăng]
    GET /post (filter) → HomeTab → PostDetailScreen

[Nhắn tin]
    PostDetailScreen → "Nhắn tin" → POST /chat/room → ChatScreen (WebSocket)

[Deal flow]
    Thỏa thuận trong chat → owner đổi status bài thành "done"

[Thông báo]
    FCM push (background) + in-app NotificationsScreen
```

---

## Deployment

| Môi trường | URL |
|---|---|
| Production backend | `https://giveaway-production-e88c.up.railway.app` |
| Production DB | Railway PostgreSQL |
| CDN ảnh | Cloudinary (`traotay/` folder) |
| Domain (tương lai) | `traotay.com.vn` (đăng ký tại TenTen.vn) |
