# HƯỚNG DẪN TEST APP TRAO TAY

> Cảm ơn bạn đã giúp test app trước khi launch chính thức! Hướng dẫn dưới đây dành cho người chưa quen cài app từ file APK. Đọc kỹ từng bước, không bỏ qua bước nào nhé.

**Phiên bản test:** v1.0.0 (build 26/04/2026)
**Thời gian dự kiến:** 30-45 phút (bao gồm cài đặt + test cơ bản)

---

## PHẦN A — CÀI ĐẶT APP (5-10 phút)

### Bước 1 — Tải file APK về điện thoại

Có 3 cách tuỳ bạn:

**Cách 1: Tải từ Google Drive (khuyên dùng)**
- Mở link Drive mình gửi trên điện thoại Android
- Bấm icon **⬇ Tải xuống** (góc phải trên màn hình)
- Đợi ~1 phút (file 26 MB)

**Cách 2: Truyền qua Zalo/Telegram**
- Mình gửi file `app-release.apk` qua tin nhắn
- Bạn bấm vào file → **Lưu / Tải xuống**

**Cách 3: Truyền qua USB**
- Cắm điện thoại vào laptop qua cáp USB
- Copy file vào folder `Download` của điện thoại

### Bước 2 — Cho phép cài app từ nguồn không xác định

Đây là bước quan trọng vì Android mặc định chỉ cho cài app từ Play Store.

**Trên Android 8 trở lên (đa số điện thoại hiện nay):**
1. Mở app **Files** (Quản lý tệp) hoặc **Chrome** (nơi bạn đã tải file)
2. Tìm file `app-release.apk` trong folder Download
3. Bấm vào file → màn hình hiện cảnh báo "Cài đặt bị chặn vì lý do bảo mật"
4. Bấm nút **Cài đặt** hoặc **Settings**
5. Bật toggle **Cho phép từ nguồn này** / **Allow from this source**
6. Quay lại màn cài đặt → bấm **Cài đặt** lần nữa

**Trên Android 7 trở xuống (điện thoại cũ):**
1. Vào **Cài đặt** → **Bảo mật** (Security)
2. Tìm mục **Nguồn không xác định** (Unknown sources) → BẬT
3. Quay lại file APK → bấm **Cài đặt**

### Bước 3 — Cài đặt và mở app

1. Sau khi nhấn **Cài đặt** → đợi 10-30 giây
2. Hiện thông báo "Đã cài đặt ứng dụng"
3. Bấm nút **Mở** để khởi động app
4. Hoặc tìm icon **Trao Tay** (logo xanh, icon hình chiếc lá) trên màn hình chính

**Nếu gặp lỗi cài đặt:**
- "Ứng dụng không được cài đặt" → Có thể máy đã có app cũ → vào Cài đặt → Apps → tìm Trao Tay → Gỡ cài đặt → thử lại
- "Phân tích gói tin thất bại" → File APK tải bị lỗi → tải lại file mới
- Báo mình kèm chụp màn hình lỗi

---

## PHẦN B — TEST GOLDEN PATH (15 phút)

> Đây là 7 luồng quan trọng nhất phải hoạt động được. Test theo thứ tự, mỗi bước nếu gặp lỗi → chụp màn hình + ghi lại bước nào lỗi + báo mình.

### Test 1 — Đăng ký tài khoản mới (5 phút)

1. Mở app → màn welcome → bấm **Bắt đầu** hoặc tương tự
2. Ở màn login → chọn **Đăng ký bằng Email**
3. Điền:
   - **Tên:** tên thật bạn
   - **Email:** email Gmail bạn dùng (mình sẽ kiểm tra mail welcome)
   - **Mật khẩu:** đặt 1 mật khẩu mới (≥ 6 ký tự, không dùng mật khẩu Gmail)
4. Bấm **Đăng ký**
5. **Kiểm tra email Gmail** trong vòng 1-2 phút → có nhận được mail "Chào mừng bạn đến Trao Tay" không?

✅ **Pass nếu:**
- Đăng ký xong tự vào trang chủ
- Có nhận mail welcome trong inbox (hoặc spam)

❌ **Báo lỗi nếu:**
- App treo / crash khi bấm Đăng ký
- Lỗi "Email đã tồn tại" dù bạn chưa đăng ký bao giờ
- Không nhận mail welcome sau 5 phút

### Test 2 — Đăng tin có ảnh (5 phút)

1. Ở trang chủ → bấm tab **Đăng tin** (giữa thanh dưới, có dấu +)
2. Điền form:
   - **Tiêu đề:** "Test bài đăng đầu tiên"
   - **Mô tả:** "Đây là bài test, không phải bán đồ thật"
   - **Hình thức:** chọn **Cho tặng** (free)
   - **Loại:** chọn **Đồ điện tử** hoặc bất kỳ
   - **Giá:** 0
   - **Khu vực:** chọn tỉnh/quận của bạn
3. **Thêm ảnh:**
   - Bấm vào ô ảnh đầu tiên
   - Chọn 1-3 ảnh từ Gallery (ảnh bất kỳ, có thể chụp ngay)
   - Đợi upload (có thể thấy thanh tiến trình)
4. Bấm **Đăng**
5. Quay lại trang chủ → cuộn xuống xem có thấy bài vừa đăng không

✅ **Pass nếu:** Bài hiện ra ở trang chủ, bấm vào xem được ảnh đầy đủ

❌ **Báo lỗi nếu:**
- Upload ảnh treo > 30 giây
- Đăng xong không thấy bài đâu
- Ảnh trong bài bị lỗi load (icon hỏng)

### Test 3 — Tab Tìm kiếm (3 phút)

1. Bấm tab **Tìm kiếm** (kính lúp)
2. Gõ vào ô tìm kiếm: "test" hoặc keyword bất kỳ
3. Xem kết quả hiện ra
4. Thử bấm vào 1 bài → mở chi tiết → ảnh load có nhanh không?
5. Bấm nút **Quay lại** → có về tab Tìm kiếm không?

✅ **Pass nếu:** Search ra kết quả, mở chi tiết được, back về OK

❌ **Báo lỗi nếu:** Search không trả kết quả, app treo khi back

### Test 4 — Tab Tin nhắn (1 phút)

1. Bấm tab **Tin nhắn**
2. Nếu chưa chat với ai → màn hiện "Chưa có tin nhắn nào" hoặc tương tự (đúng)

✅ **Pass nếu:** Hiện màn rỗng đẹp, không crash

### Test 5 — Tab Cá nhân (3 phút)

1. Bấm tab **Cá nhân** / **Tôi**
2. Kiểm tra hiển thị:
   - Avatar (mặc định nếu chưa upload)
   - Tên bạn
   - Email
   - Số bài đăng (nên là 1 — bài Test 2)
3. Bấm **Bài đăng của tôi** → có thấy bài Test 2 không?
4. Bấm vào bài → có sửa/xoá được không?

✅ **Pass nếu:** Hiển thị đúng thông tin, vào "Bài đăng của tôi" thấy bài đã đăng

### Test 6 — Đăng xuất + Đăng nhập lại (3 phút)

1. Tab Cá nhân → kéo xuống tìm nút **Đăng xuất** → bấm
2. App trở về màn login
3. Bấm **Đăng nhập bằng Email**
4. Nhập email + mật khẩu vừa tạo ở Test 1
5. Bấm **Đăng nhập** → vào lại trang chủ

✅ **Pass nếu:** Đăng xuất → đăng nhập lại OK, vẫn thấy bài đã đăng ở "Bài đăng của tôi"

### Test 7 — Đóng app + mở lại (1 phút)

1. Đóng hoàn toàn app (vuốt lên + khoá app)
2. Mở lại app từ icon
3. Có tự đăng nhập không? Hay phải nhập mật khẩu lại?

✅ **Pass nếu:** Tự đăng nhập, vào thẳng trang chủ

❌ **Báo lỗi nếu:** Phải đăng nhập lại mỗi lần mở app

---

## PHẦN C — TEST EDGE CASES (15 phút, optional nhưng quan trọng)

### Test 8 — Mạng yếu / mất mạng

1. Bật chế độ **Máy bay** (Airplane mode) trên điện thoại
2. Mở app, thử pull to refresh trang chủ
3. Tắt máy bay → mở lại app

✅ **Pass nếu:** App hiện thông báo "Lỗi kết nối" đẹp, không crash. Khi có mạng → tự load lại data

### Test 9 — Upload nhiều ảnh

1. Đăng 1 bài mới với **10 ảnh** cùng lúc (số tối đa)
2. Đợi upload xong → xem có lỗi không

✅ **Pass nếu:** 10 ảnh upload hết, hiện trong bài chi tiết

### Test 10 — Tin nhắn (cần 2 người)

> Phần này test sau cùng nếu có thể. Cần 1 người khác cùng cài app.

1. Người A đăng 1 bài
2. Người B vào xem bài → bấm nút **Nhắn tin**
3. Hai người gửi tin nhắn qua lại 5-10 lần
4. Test gửi nhanh liên tục (spam) → có bị mất tin không?

✅ **Pass nếu:** Tin nhắn 2 chiều hiện gần như real-time (< 2 giây)

### Test 11 — Đẩy thông báo (push notification)

1. Cho phép app gửi thông báo khi hỏi (popup quyền)
2. Có người gửi tin cho bạn → có nhận được noti không?
3. Bấm vào noti → có mở đúng cuộc trò chuyện không?

✅ **Pass nếu:** Noti hiện khi app đang đóng, bấm vào mở đúng chỗ

---

## PHẦN D — BÁO LỖI & FEEDBACK

### Cách báo lỗi hiệu quả

Mỗi lỗi gặp phải, hãy gửi mình:

**1. Chụp màn hình** (rõ nhất là chụp ngay khi gặp lỗi)
   - Android: Bấm đồng thời nút Nguồn + Giảm âm lượng
   - Hoặc vuốt 3 ngón tay xuống (1 số máy)

**2. Mô tả ngắn:**
   - **Đang làm gì:** "Đang đăng bài, đến bước upload ảnh"
   - **Hiện lỗi gì:** "App đứng yên 30 giây rồi tự thoát"
   - **Bước lặp lại:** Có thể tái hiện lỗi không? (lặp lại 3 lần đều lỗi / chỉ 1 lần)

**3. Thông tin máy:**
   - Tên điện thoại (vd "Samsung A52")
   - Phiên bản Android (Cài đặt → Giới thiệu điện thoại → Phiên bản Android)

### Format gửi báo lỗi

Copy template dưới rồi điền + gửi qua Zalo/Messenger:

```
[BUG] Tóm tắt lỗi 1 dòng

Đang làm:
Hiện lỗi:
Tái hiện được không:
Máy: Samsung A52, Android 12
Ảnh: (đính kèm)
```

### Feedback ngoài bug

Sau khi test xong, mình rất muốn nghe ý kiến của bạn:
- Cảm giác chung khi dùng app: dễ hay khó dùng?
- Tính năng nào hữu ích nhất / dở nhất?
- Bạn có muốn dùng app này thật khi launch không? Vì sao?
- Tên "Trao Tay" có dễ nhớ không? Logo xanh có đẹp không?

Cứ nhắn tự nhiên thoải mái, không cần format, mình ghi nhận hết.

---

## CẢM ƠN BẠN!

Cảm ơn bạn đã dành thời gian giúp mình test app. Sau khi launch chính thức trên Play Store, mình sẽ ưu tiên các bạn được Closed Testing tiếp với phiên bản mới nhất.

Có gì khúc mắc cứ nhắn mình bất cứ lúc nào.

— Hùng (damhungtpt@gmail.com)
