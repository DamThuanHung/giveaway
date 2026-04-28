# HƯỚNG DẪN TEST APP TRAO TAY

> Cảm ơn bạn đã giúp test app trước khi launch chính thức! Hướng dẫn dưới đây dành cho người chưa quen cài app từ file APK. Đọc kỹ từng bước, không bỏ qua bước nào nhé.

**Phiên bản test:** v1.0.0 (build 28/04/2026)
**Thời gian dự kiến:** 30-45 phút (golden path) + 20-30 phút (edge cases + PayOS) — TỔNG ~75 phút

**🙏 Phần PayOS (Test 18) yêu cầu thanh toán THẬT 5k hoặc 15k — mình HOÀN ĐỦ + tip thêm 10k cảm ơn sau khi test.**

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

## PHẦN B — TEST GOLDEN PATH (30 phút)

> Đây là 10 luồng quan trọng nhất phải hoạt động được. Test theo thứ tự, mỗi bước nếu gặp lỗi → chụp màn hình + ghi lại bước nào lỗi + báo mình.

### Test 1 — Đăng ký bằng Email (5 phút)

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

### Test 2 — Đăng nhập bằng Số điện thoại (3 phút)

> Test này đăng xuất tài khoản email trước, rồi tạo tài khoản mới bằng SĐT để verify cả 2 luồng auth. Nếu không có 2 SĐT, skip phần này — báo mình "skip Test 2".

1. Tab Cá nhân → kéo xuống → **Đăng xuất**
2. Quay lại màn login → chọn **Đăng nhập bằng SĐT**
3. Nhập SĐT của bạn → **Gửi mã**
4. Đợi tin nhắn SMS có 6 số → nhập mã
5. (Lần đầu) Hỏi tên + thông tin → điền → vào trang chủ

✅ **Pass nếu:** Nhận SMS trong vòng 1 phút, nhập mã → vào app OK

❌ **Báo lỗi nếu:** Không nhận SMS sau 2 phút, mã sai liên tục

### Test 3 — Đăng tin có ảnh (5 phút)

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
- Lỗi "Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP" (đã fix nhưng nếu vẫn gặp thì báo gấp)

### Test 4 — Sửa / Xoá bài đăng (3 phút)

1. Tab **Cá nhân** → bấm **Bài đăng của tôi**
2. Bấm vào bài Test 3 → bấm icon **3 chấm** hoặc **Sửa** (góc phải)
3. **Sửa:** đổi tiêu đề thành "Test sửa bài" → bấm **Lưu** → quay lại danh sách check tiêu đề mới
4. Vào lại bài → bấm **Xoá** → confirm
5. Bài biến mất khỏi list

✅ **Pass nếu:** Sửa lưu thành công, xoá xong bài không còn

### Test 5 — Lưu bài (Favorites) (2 phút)

1. Quay lại trang chủ → tìm 1 bài (không phải bài mình)
2. Bấm icon **♡ (trái tim)** trên bài → chuyển thành **♥ (đỏ)**
3. Tab **Cá nhân** → **Đã lưu** (hoặc Favorites)
4. Bài vừa lưu hiện trong danh sách
5. Bấm tim lần nữa để bỏ lưu → bài biến mất khỏi list

✅ **Pass nếu:** Lưu/bỏ lưu mượt, list cập nhật ngay

### Test 6 — Đổi Avatar (2 phút)

1. Tab **Cá nhân** → bấm vào avatar (vòng tròn trên đầu)
2. Chọn ảnh từ Gallery (chụp tự do)
3. Đợi upload — avatar hiển thị ảnh mới

✅ **Pass nếu:** Avatar update ngay, không lỗi

❌ **Báo lỗi nếu:** Lỗi "Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP" (đặc biệt với ảnh chụp Realme/Samsung mới — đã fix HEIC bug nhưng cần verify)

### Test 7 — Tab Tìm kiếm + Filter (3 phút)

1. Bấm tab **Tìm kiếm** (kính lúp)
2. Gõ keyword bất kỳ → xem kết quả
3. Thử **filter theo loại** (Cho tặng / Bán) ở thanh trên
4. Thử **filter theo danh mục** (Đồ điện tử / Quần áo / ...)
5. Bấm vào 1 bài → xem chi tiết → ảnh load nhanh không?
6. Bấm nút **Quay lại** → có về tab Tìm kiếm không?

✅ **Pass nếu:** Search ra kết quả, filter hoạt động, mở chi tiết được, back về OK

### Test 8 — Tab Tin nhắn (1 phút)

1. Bấm tab **Tin nhắn**
2. Nếu chưa chat với ai → màn hiện "Chưa có tin nhắn nào" hoặc tương tự (đúng)

✅ **Pass nếu:** Hiện màn rỗng đẹp, không crash

### Test 9 — Tab Cá nhân (3 phút)

1. Bấm tab **Cá nhân** / **Tôi**
2. Kiểm tra hiển thị:
   - Avatar (đã đổi ở Test 6)
   - Tên bạn
   - Email / SĐT
   - Số bài đăng
3. Các mục con: **Bài đăng của tôi** / **Đã lưu** / **Đổi mật khẩu** / **Liên kết email** (nếu đăng nhập SĐT)
4. Mỗi mục bấm vào, không crash là OK

✅ **Pass nếu:** Hiển thị đúng thông tin, các mục con không lỗi

### Test 10 — Đăng xuất + Đóng app + Mở lại (3 phút)

1. Tab Cá nhân → kéo xuống tìm nút **Đăng xuất** → bấm
2. App trở về màn login
3. Đăng nhập lại bằng email/SĐT
4. **Đóng hoàn toàn app** (vuốt lên + khoá app)
5. Mở lại app từ icon

✅ **Pass nếu:**
- Đăng xuất → đăng nhập lại OK
- Đóng app + mở lại → tự đăng nhập, vào thẳng trang chủ (không phải nhập mật khẩu lại)

❌ **Báo lỗi nếu:** Phải đăng nhập lại mỗi lần mở app

---

## PHẦN C — TEST EDGE CASES (15-30 phút, nice-to-have)

### Test 11 — Mạng yếu / mất mạng

1. Bật chế độ **Máy bay** (Airplane mode) trên điện thoại
2. Mở app, thử pull to refresh trang chủ
3. Tắt máy bay → bấm **Thử lại** trên màn lỗi

✅ **Pass nếu:**
- Khi mất mạng: app hiện icon Wifi gạch chéo + "Không thể tải dữ liệu" + nút "Thử lại" (KHÔNG hiện "Không có bài đăng" — đó là sai)
- Khi có mạng: bấm Thử lại → load lại data

### Test 12 — Upload nhiều ảnh

1. Đăng 1 bài mới với **10 ảnh** cùng lúc (số tối đa)
2. Đợi upload xong → xem có lỗi không

✅ **Pass nếu:** 10 ảnh upload hết, hiện trong bài chi tiết

### Test 13 — Map view (bản đồ)

1. Tab Tìm kiếm hoặc trang chủ → tìm icon **bản đồ** 🗺️ hoặc nút "Xem trên bản đồ"
2. Bản đồ load → hiện các bài đăng dưới dạng pin/marker
3. Bấm vào 1 marker → preview bài
4. Zoom in/out, di chuyển bản đồ

✅ **Pass nếu:** Bản đồ load < 5 giây, marker rõ, không bị lag khi zoom

### Test 14 — Filter theo khoảng cách (GPS)

1. Tab Tìm kiếm → tìm icon **vị trí** / **GPS** / **Quanh tôi**
2. Lần đầu: app xin quyền truy cập vị trí → cho phép
3. Chọn bán kính 5km / 10km / 20km
4. Kết quả hiện các bài trong bán kính đó

✅ **Pass nếu:**
- App xin quyền vị trí (popup Android)
- Sau khi cho phép → tìm thấy bài gần (giả sử trong bán kính có bài)

❌ **Báo lỗi nếu:** App không xin quyền + thấy "Không có bài" dù gần đúng có bài

### Test 15 — Tin nhắn 2 chiều (cần 2 thiết bị / 2 acc)

> Phần này skip nếu chỉ có 1 máy. Cần người khác cùng cài app.

1. Người A đăng 1 bài (vd cái áo cho)
2. Người B vào xem bài → bấm nút **Nhắn tin**
3. Hai người gửi tin nhắn qua lại 5-10 lần
4. Test gửi nhanh liên tục (spam) → có bị mất tin không?

✅ **Pass nếu:** Tin nhắn 2 chiều hiện gần như real-time (< 2 giây)

### Test 16 — Push notification

1. Cho phép app gửi thông báo khi hỏi (popup quyền lần đầu)
2. **Đóng app** (kéo lên thoát task) — để app KHÔNG đang mở
3. Có người gửi tin cho bạn → có nhận được noti banner trên đỉnh màn hình không?
4. Bấm vào noti → app mở đúng cuộc trò chuyện

✅ **Pass nếu:** Noti hiện khi app đóng, bấm vào mở đúng chỗ

### Test 17 — Tab Thông báo

1. Sau khi có người nhắn tin / có activity → tab **Thông báo** (chuông) hiện badge đỏ
2. Vào tab → list noti hiển thị
3. Bấm vào 1 noti → mở đúng nội dung (vd vào chat room)

✅ **Pass nếu:** Badge cập nhật real-time, list noti đầy đủ, click hoạt động

---

## PHẦN D — TEST THANH TOÁN PAYOS (10 phút, mình hoàn tiền 100%)

> 🙏 **Quan trọng:** Phần này yêu cầu thanh toán THẬT qua app banking để verify PayOS. **Mình hoàn lại đủ số tiền + tip thêm 10k cảm ơn** sau khi bạn báo đã trả. Số tiền nhỏ (5k hoặc 15k) nhưng đây là luồng critical bắt buộc test — không có tester thì luồng PayOS không catch bug được.

### Test 18 — Boost bài đăng (gói Plus 3 ngày, 5,000đ)

1. Vào tab **Cá nhân** → **Bài đăng của tôi** → chọn 1 bài đã đăng (hoặc đăng bài mới ở Test 3)
2. Bấm vào bài → tìm nút **Boost / Đẩy bài lên top**
3. Chọn gói **Plus 3 ngày — 5,000đ**
4. Bấm **Thanh toán** → app mở WebView PayOS
5. Trong WebView:
   - Hiện QR code + thông tin chuyển khoản
   - **Mở app ngân hàng (Vietcombank / MB Bank / Techcombank...)** → quét QR → confirm chuyển 5,000đ
6. Đợi 5-10 giây sau khi chuyển → app tự đóng WebView
7. Hiện loading "Đang xác nhận thanh toán..."
8. Sau ~5 giây → hiện popup **"Đã kích hoạt gói Plus 3 ngày!"**
9. Quay lại trang chủ → tìm bài vừa boost → có badge **PLUS** màu xanh + bài lên top

✅ **Pass nếu:**
- Chuyển tiền thành công qua app ngân hàng
- App báo kích hoạt thành công trong vòng 30 giây
- Bài có badge Plus + lên top feed

❌ **Báo lỗi nếu:**
- WebView không load
- Chuyển tiền xong nhưng app không báo gì sau 1 phút
- Bài không có badge / không lên top

### Sau khi test xong — báo mình để hoàn tiền

Inbox FB mình kèm:
```
[ĐÃ TEST PAYOS]
Gói đã mua: Plus 3 ngày (5k) hoặc VIP 7 ngày (15k)
Số tiền: 5.000 hoặc 15.000 đ
Số tài khoản nhận: <STK ngân hàng của bạn>
Tên ngân hàng: <vd Vietcombank, MB Bank>
Tên chủ TK: <tên đầy đủ>
```

Mình chuyển khoản lại trong 1-2 ngày: **đủ số tiền đã trả + 10.000đ cảm ơn**.

**Lưu ý:** chỉ cần test 1 trong 2 gói (Plus 5k hoặc VIP 15k). Khuyên dùng **Plus 3 ngày 5,000đ** vì rẻ hơn.

---

## PHẦN E — TÍNH NĂNG NÂNG CAO (skip nếu thiếu thời gian)

Mình KHÔNG yêu cầu test các phần dưới — chỉ liệt kê để bạn biết app có những gì. Nếu rảnh + thấy thú vị thì thử, nhận xét tự nhiên cũng được.

- 🔔 **Theo dõi từ khoá:** Cá nhân → Theo dõi từ khoá → thêm vd "iPhone" → khi có bài mới khớp sẽ noti
- 👤 **Follow user:** Vào profile người khác → bấm Theo dõi → bài mới của họ sẽ ưu tiên hiện cho bạn
- ⛔ **Block / Report:** Trong chat → 3 chấm → Chặn người dùng / Báo cáo
- 🔄 **Đổi mật khẩu:** Cá nhân → Đổi mật khẩu → nhập cũ + mới
- 📨 **Liên kết email** (chỉ user đăng SĐT): Cá nhân → Liên kết email dự phòng
- ⭐ **Đánh giá người mua/bán:** sau khi hoàn thành 1 giao dịch (request → accept → complete) — cần 2 người

---

## PHẦN F — BÁO LỖI & FEEDBACK

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

Copy template dưới rồi điền + gửi qua Messenger/Zalo:

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

Có gì khúc mắc cứ inbox mình bất cứ lúc nào:
👉 https://www.facebook.com/vaykhap.troi/
