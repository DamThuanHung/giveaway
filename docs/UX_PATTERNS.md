# UX PATTERNS — Quy tắc trải nghiệm người dùng

> **Mục đích:** Đảm bảo mọi tính năng đều nhất quán về luồng người dùng, phản hồi UI,
> và hành vi tương tác. AI phải đọc file này trước khi thiết kế bất kỳ flow nào.

---

## 1. Nguyên tắc UX cốt lõi

| # | Nguyên tắc | Áp dụng |
|---|---|---|
| 1 | **Phản hồi tức thì** | Mọi action phải có visual feedback trong 100ms |
| 2 | **Trạng thái rõ ràng** | Luôn hiển thị: loading / empty / error / success |
| 3 | **Khôi phục lỗi dễ dàng** | Mọi lỗi phải có nút "Thử lại" hoặc hướng dẫn tiếp theo |
| 4 | **Tối thiểu bước thao tác** | Mục tiêu ≤ 3 tap cho mọi action phổ biến |
| 5 | **Không mất dữ liệu** | Khi back, form phải giữ nguyên dữ liệu đã nhập |
| 6 | **Optimistic UI** | Cập nhật UI ngay, rollback nếu API lỗi |

---

## 2. Patterns trạng thái màn hình

### Vòng đời màn hình chuẩn
```
[Mở màn hình]
    → Hiển thị Skeleton / Loading
    → Gọi API
    ├── Thành công → Render dữ liệu (+ Empty State nếu list rỗng)
    └── Thất bại  → Error State + nút Thử lại
```

### Skeleton Loading (ưu tiên hơn CircularProgressIndicator cho list)
- Dùng `shimmer` effect (màu `#E2E5EA` → `#F7F8FA`) cho card list
- Skeleton shape phải match layout thực tế
- Không dùng skeleton cho action nhỏ (button submit) — dùng spinner trong nút

### Pull-to-refresh
- **BẮT BUỘC** cho mọi list màn hình (PostList, FavoriteList, MessageList)
- `RefreshIndicator` bao ngoài cùng

---

## 3. Form Patterns

### Quy tắc form
1. **Validate inline** — hiển thị lỗi ngay khi blur khỏi field, không chờ submit
2. **Disable nút submit** khi form chưa hợp lệ hoặc đang loading
3. **Giữ dữ liệu** khi navigate back (dùng Provider hoặc lưu state)
4. **Keyboard actions**: `TextInputAction.next` cho field giữa, `TextInputAction.done` cho field cuối
5. **Ảnh upload**: preview ngay sau khi chọn, có nút xóa từng ảnh

### Thứ tự trường trong form đăng bài
1. Tiêu đề (bắt buộc)
2. Mô tả (bắt buộc)
3. Loại đăng (`give` / `sell`) — dạng toggle/chip chọn 1
4. Giá (chỉ hiện khi `sell`, ẩn khi `give`)
5. Danh mục (dropdown)
6. Địa chỉ (tỉnh → quận → phường → chi tiết)
7. Ảnh (tối đa 5, có preview)

### Validation messages
| Field | Điều kiện lỗi | Message |
|---|---|---|
| Tiêu đề | Rỗng | "Vui lòng nhập tiêu đề" |
| Tiêu đề | < 5 ký tự | "Tiêu đề quá ngắn (tối thiểu 5 ký tự)" |
| Giá | Không phải số | "Giá phải là số" |
| Giá | < 0 | "Giá không hợp lệ" |
| Ảnh | Không có ảnh | "Vui lòng chọn ít nhất 1 ảnh" |

---

## 4. Navigation Patterns

### Back navigation
- **Hardware back (Android)**: Đóng keyboard nếu đang mở → rồi mới back
- **Back button AppBar**: Luôn có `<` icon, tap → `Navigator.pop()`
- **Khi form có dữ liệu chưa lưu**: Hiển thị dialog xác nhận "Bạn có muốn thoát? Dữ liệu sẽ mất."

### Dialog xác nhận (Confirmation Dialog)
```
[Dialog xác nhận]
Tiêu đề: ngắn gọn, rõ action
Nội dung: mô tả hệ quả
Nút trái: "Hủy" (OutlinedButton)
Nút phải: "Xác nhận" hoặc "Xóa" (ElevatedButton, màu error nếu destructive)
```
- Dùng cho: Xóa bài đăng, Đăng xuất, Hủy form có dữ liệu
- **KHÔNG** dùng cho: Thêm yêu thích (optimistic, không cần confirm)

### Deep link flow từ FCM notification
| `data.type` | Màn hình đích |
|---|---|
| `chat` / `deal` (có roomId) | `ChatScreen` (fetch room, tìm đối phương) |
| `review` | `MyReviewsScreen` (tab Cá nhân → push) |
| `deal` (không có roomId) | `DealsScreen` |
- Cold-start (app bị tắt): `PendingFcmMessage` lưu message → `AppShell.initState` xử lý
- Background: `FirebaseMessaging.onMessageOpenedApp` xử lý
- Foreground: hiển thị local notification (flutter_local_notifications), không navigate tự động

---

## 5. Patterns tương tác phổ biến

### Yêu thích (Favorite)
- Tap ❤ → **Optimistic update** (đổi icon ngay)
- API lỗi → rollback icon + hiện SnackBar lỗi
- Icon: `Icons.favorite_border` (chưa thích) → `Icons.favorite` màu `error` (đã thích)

### Chia sẻ bài đăng (Share)
- Tap Share icon → `Share.share(url)` (dùng package `share_plus`)
- URL share format: `https://app.chovatang.vn/post/{postId}` (placeholder, cập nhật khi có domain)

### Báo cáo bài đăng (Report)
- Tap ⋮ (more) trên bài đăng → Bottom sheet
- Chọn "Báo cáo" → Dialog chọn lý do → Confirm → SnackBar "Đã gửi báo cáo"
- **KHÔNG** navigate sang màn hình mới chỉ để báo cáo

### Xem ảnh fullscreen
- Tap ảnh trong `PostDetailScreen` → Mở fullscreen viewer
- Vuốt xuống → đóng viewer
- Nhiều ảnh → swipe ngang để xem tiếp

### Xem tất cả bài đăng của user
- Tap avatar / tên người đăng → Mở `UserProfileScreen`
- Hiển thị: ảnh đại diện, tên, ngày tham gia, danh sách bài đăng

---

## 6. Chat UX Patterns

### Màn hình danh sách chat (MessageTab)
- Sắp xếp: tin nhắn mới nhất lên trên
- Item: avatar (48px) + tên + preview tin cuối + thời gian
- Badge số tin chưa đọc: góc trên-phải avatar, màu `primary`

### Màn hình chat (ChatScreen)
- Tin nhắn của mình: bên phải, background `primary`, text trắng
- Tin nhắn đối phương: bên trái, background `#F0F2F5`, text đen
- Timestamp: hiển thị theo nhóm (chỉ hiện khi cách nhau > 5 phút)
- Input: `TextField` + nút gửi, nằm cố định phía dưới (trên keyboard)
- Scroll to bottom khi nhận/gửi tin mới
- Hiển thị "đang gõ..." khi đối phương typing

---

## 7. Onboarding & Authentication UX

### Login Screen
- Không redirect ngay khi mở app — kiểm tra token trước
- Nếu token hết hạn → silent redirect tới Login (không để màn hình trắng)
- Sau login thành công → navigate replace (không push) sang Home

### Register Flow (khi có)
- Single screen, không wizard nhiều bước (quá ít field)
- Sau register → auto login → navigate Home

### Guest Mode
- User chưa login vẫn xem được danh sách bài đăng và chi tiết
- Khi tap "Yêu thích", "Chat", "Đăng tin" → hiện bottom sheet mời đăng nhập

---

## 8. Performance UX

### Image lazy loading
- Dùng `cached_network_image` (package) thay vì `Image.network` trực tiếp
- Cache ảnh để giảm reload khi scroll lại

### List performance
- `ListView.builder` (KHÔNG `ListView` với `children`) cho mọi list > 5 item
- `GridView.builder` cho grid
- Pagination: load 20 items/page, auto-load khi scroll gần cuối (80% list)

### Tránh jank
- Không tính toán nặng trong `build()`
- Dùng `const` constructor khi widget không thay đổi
- Tránh `setState` toàn màn hình khi chỉ cần update một phần nhỏ

---

## 9. Ngôn ngữ & Text trong App

### Tone of voice
- Thân thiện, gần gũi, ngắn gọn
- Dùng "bạn" (không "quý khách")
- Tránh thuật ngữ kỹ thuật

### Format hiển thị
| Loại | Format |
|---|---|
| Giá tiền | `1.500.000 đ` (dấu chấm phân nghìn, không dùng VND) |
| Thời gian gần | `5 phút trước`, `2 giờ trước`, `hôm qua` |
| Thời gian xa | `15/03/2025` |
| Địa chỉ ngắn | `Quận 1, TP.HCM` |

### Labels chuẩn
| Hành động | Label |
|---|---|
| Đăng nhập | "Đăng nhập" |
| Tạo tài khoản | "Đăng ký" |
| Đăng bài mới | "Đăng tin" |
| Lưu yêu thích | "Yêu thích" |
| Hủy | "Hủy" |
| Xác nhận | "Xác nhận" |
| Tiếp theo | "Tiếp theo" |
| Hoàn thành | "Hoàn tất" |
