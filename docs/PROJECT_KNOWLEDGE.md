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
- Tối đa 5 ảnh/bài, lưu URL MinIO đầy đủ
- `imageLabel` = URL ảnh thumbnail đại diện (dùng trong chat banner, notification)

### Người dùng (User)
- Đăng nhập bằng **SĐT** (Firebase OTP) — flow chính
- Đăng nhập bằng **email OTP** (Resend) — không cần mật khẩu, hỗ trợ đăng ký mới
- `isNewUser: true` được trả về khi OTP thành công lần đầu (tự động tạo tài khoản)
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
- Flow xin nhận đồ qua chat (deal card trong tin nhắn)
- `status`: `pending` → `accepted` / `rejected` / `completed` / `cancelled`
  - `accepted`: người bán đồng ý, bài chuyển sang `reserved`, các deal pending khác bị `rejected`
  - `completed`: giao dịch hoàn thành, bài chuyển sang `done`
  - `cancelled`: người nhận tự hủy
- Sau `completed` → người nhận có thể để lại `Review` (đánh giá 1–5 sao)

### Notification
- `type: "chat"` → mở `ChatScreen` (roomId)
- `type: "deal"` → mở `ChatScreen` (roomId) hoặc `DealsScreen`
- `type: "review"` → mở `MyReviewsScreen`
- `type: "follow"` / `"favorite"` / `"new_post"` / `"keyword_alert"` → in-app only
- `type: "deal_reminder"` / `"post_reminder"` / `"welcome"` / `"daily_digest"` → in-app only
- `data` = JSON string chứa context: `{ roomId, dealId, postId, followerId, ... }`
- FCM push notification kèm theo mọi loại type (trừ một số loại reminder)
- Tap notification (FCM) → navigate đúng màn hình theo `data.type`

### Follow
- User có thể follow user khác
- Feed riêng chứa bài đăng từ người đang follow (`GET /follow/feed`)

---

## Business Rules quan trọng

### Upload ảnh
- Ảnh upload lên **MinIO** (self-hosted S3, container `traotay_storage`)
- Trong DB lưu **URL đầy đủ** (`http://localhost:9000/traotay/posts/...`)
- `imageLabel` = URL ảnh đầu tiên, dùng cho thumbnail

### Đẩy bài lên đầu (Bump Post)
- Miễn phí, không giới hạn số lần — chỉ cooldown **24 giờ** giữa 2 lần bump
- API trả về `{ ok, bumpedAt, nextBumpAt }` — `nextBumpAt` dùng để tính thời gian còn lại
- Sort danh sách: `bumpedAt DESC NULLS LAST` → `createdAt DESC` (bài chưa bump xuống cuối)
- Badge "Nổi bật" hiện khi `bumpedAt` trong vòng 24h tính từ thời điểm hiện tại

### Xác thực
- Header: `Authorization: Bearer {token}`
- Dev endpoints: header `x-dev-secret: {DEV_SECRET}`

### Trạng thái bài đăng
| Status | Hiển thị |
|---|---|
| `available` | Bình thường, có thể nhắn tin |
| `reserved` | Đã được chấp nhận deal, đang chờ hoàn thành |
| `done` | Đã trao tặng/bán xong, nút bị disable |

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
    SplashScreen → kiểm tra token
    ├── Có token → AppShell (5 tabs)
    └── Không có → PhoneLoginScreen / EmailLoginScreen

[Đăng nhập]
    SĐT: nhập số → Firebase OTP → POST /user/phone-login → JWT
    Email: POST /user/email-login/send → nhập OTP → POST /user/email-login/verify → JWT
    (isNewUser = true → tự tạo tài khoản)

[Xem bài đăng]
    GET /post (filter) → HomeTab → PostDetailScreen

[Nhắn tin / Deal]
    PostDetailScreen → "Nhắn tin" → POST /chat/room → ChatScreen (WebSocket)
    Trong chat → deal card → owner accept/reject/complete

[Review]
    Deal completed → người nhận nhận noti → tap noti → MyReviewsScreen
    Người nhận viết review: POST /review (dealId + rating + comment)
    Người bán nhận FCM: "X đã đánh giá bạn ⭐⭐⭐⭐⭐"

[Thông báo]
    FCM push (foreground: local notification, background/killed: FCM)
    Tap notification → navigate theo data.type
    In-app: NotificationsScreen (grouped by date)
```

---

## Deployment

| Môi trường | Giá trị |
|---|---|
| Local backend | `http://localhost:3800` (Docker) |
| Local DB | PostgreSQL container `traotay_db` |
| Local storage | MinIO container `traotay_storage` (`http://localhost:9000`) |
| Flutter baseUrl | `http://192.168.0.108:3800` (IP máy trên wifi) |
| Domain | `traotay.com.vn` (đăng ký tại TenTen.vn) — chưa trỏ |
