# PROJECT KNOWLEDGE — Thuật ngữ & Business Rules

## Tên gọi dự án

| Tên | Ý nghĩa |
|---|---|
| **Cho và Tặng** | Tên chính thức của dự án (tên package: `cho_va_tang`) |
| **Jimoty Clone VN** | Tên nội bộ khi phát triển, lấy cảm hứng từ app Jimoty của Nhật Bản |
| **SERVER JIMOTY** | Tên server backend xuất hiện trong log khi khởi động |

---

## Thuật ngữ nghiệp vụ

### Bài đăng (Post)
- Là đơn vị nội dung trung tâm của ứng dụng
- Một bài đăng có thể là: **bán đồ** (`listingType: sell`) hoặc **tặng miễn phí** (`listingType: give`)
- Mỗi bài đăng có tối đa **5 ảnh**
- Giá = `0` thường tương đương "tặng miễn phí"

### Người dùng (User)
- Xác thực bằng email + mật khẩu (bcrypt)
- JWT token có hiệu lực **7 ngày**
- Token lưu phía client trong `SharedPreferences` với key `auth_token`

### Yêu thích (Favorite)
- User có thể lưu bài đăng vào danh sách yêu thích
- Logic nghiệp vụ nằm trong `FavoriteService` nhưng **chưa có DB schema**

### Báo cáo (Report)
- User báo cáo bài đăng vi phạm
- Hiện tại chỉ ghi log, **chưa lưu vào DB** và chưa có luồng xử lý

### Chat
- Nhắn tin realtime qua **Socket.io WebSocket**
- Hiện tại là **broadcast toàn bộ** (gửi 1 người, tất cả nhận được)
- Chưa có tính năng chat 1-1 thực sự (chưa lưu DB)

---

## Business Rules quan trọng

### Upload ảnh
- Ảnh được lưu vật lý trên server tại thư mục `backend/uploads/`
- Trong DB, chỉ lưu **filename** (vd: `images-1234567890-123456789.jpg`)
- Để hiển thị ảnh: ghép `baseUrl + '/uploads/' + filename`
- Thư mục `uploads/` được tạo tự động khi server khởi động nếu chưa tồn tại

### JWT Authentication
- Secret key: `cho_va_tang_dev_secret` (hardcode cho dev, nên đổi trước khi production)
- Token expiry: `7d` (7 ngày)
- Header format: `Authorization: Bearer {token}`

### Địa chỉ mạng nội bộ
- Backend lắng nghe tại `0.0.0.0:3800`
- IP hiện tại: `192.168.0.108` — **đây là IP máy tính dev, thay đổi theo mạng WiFi**
- Khi đổi mạng: cần cập nhật `baseUrl` trong `app/lib/services/api_service.dart`

### Loại bài đăng (listingType)
| Giá trị | Ý nghĩa |
|---|---|
| `sell` | Bán (có giá) |
| `give` | Tặng miễn phí |

### Danh mục sản phẩm (itemCategory)
| Giá trị | Ý nghĩa |
|---|---|
| `other` | Khác (default) |
| *(chưa đầy đủ)* | Cần xác nhận thêm với owner |

---

## Luồng chính của ứng dụng

```
[App khởi động]
    │
    ├── AuthProvider.isAuth == true → HomeTab
    └── AuthProvider.isAuth == false → LoginScreen

[Đăng nhập]
    POST /user/login → nhận access_token → lưu SharedPreferences

[Xem bài đăng]
    GET /post → danh sách → PostCard → PostDetailScreen

[Đăng bài mới]
    Chọn ảnh (ImagePicker) → điền form → POST /post (multipart) → upload ảnh

[Chat]
    Kết nối WebSocket → emit 'sendMessage' → nhận 'receive_message'
```

---

## Những điểm cần phát triển tiếp (Known TODOs)

| # | Vấn đề | Ưu tiên |
|---|---|---|
| 1 | Thêm cột địa chỉ vào Prisma schema (province, district, ward, addressDetail, itemCategory, listingType) | Cao |
| 2 | Tạo model `Favorite` trong Prisma schema | Cao |
| 3 | Lưu tin nhắn chat vào DB | Trung bình |
| 4 | Implement chat 1-1 (hiện đang broadcast) | Trung bình |
| 5 | Tạo model `Report` và lưu vào DB | Thấp |
| 6 | Chuyển JWT secret sang biến môi trường `.env` | Cao (bảo mật) |
| 7 | Auth middleware / Guard cho các route cần login | Cao |
