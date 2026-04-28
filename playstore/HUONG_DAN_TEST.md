# HƯỚNG DẪN TEST APP TRAO TAY (Phase 2)

> *Đồ cũ người này, Báu vật người kia.*
>
> Cảm ơn bạn đã giúp test app trước khi launch chính thức! Hướng dẫn dưới đây dành cho người chưa quen cài app từ file APK. Đọc kỹ từng bước, không bỏ qua bước nào nhé.

**Phiên bản test:** v1.0.1+2 (build 28/04/2026 — Phase 2)
**Có gì mới so với Phase 1:** slogan + onboarding mới, 34 tỉnh thành theo sáp nhập 2025, sửa bài có ảnh, follow đồng bộ, +30 fixes khác.
**Thời gian dự kiến:** 30-45 phút (golden path) + 20-30 phút (edge cases + PayOS) — TỔNG ~75 phút

> ⚠️ **Tester Phase 1 (đã cài bản cũ):** vui lòng **Settings → Apps → Trao Tay → Storage → Clear Data** trước khi cài bản mới — để xem được màn Onboarding mới + tránh data legacy gây nhầm.

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

## PHẦN B — TEST GOLDEN PATH (~40 phút)

> Đây là 14 luồng quan trọng nhất phải hoạt động được (Test 0 → 13). Test theo thứ tự, mỗi bước nếu gặp lỗi → chụp màn hình + ghi lại bước nào lỗi + báo mình.
>
> 🆕 = test mới hoặc behavior khác Phase 1.

### Test 0 — Cảm nhận Splash + Onboarding (3 phút) ⭐ MỚI

> Test trước khi đăng nhập. Bạn vừa Clear Data, mở app lần đầu sẽ thấy:

1. **Splash screen** (~2.4 giây): logo 🤝 + chữ **"Trao Tay"** + tagline **"Đồ cũ người này, Báu vật người kia"**
2. **3 màn Onboarding** vuốt qua từng slide:
   - Slide 1 (xanh đậm): logo + slogan đầy đủ
   - Slide 2 (xanh dương): "Đăng bán hoặc cho tặng"
   - Slide 3 (cam): "Nhận đồ ngay gần nhà"
3. Slide cuối → bấm **"Bắt đầu ngay"** → vào màn Đăng nhập

**Sau khi đăng nhập + đóng app + mở lại:** Splash chỉ hiện ~0.8s (nhanh hơn nhiều) → vào thẳng Trang chủ.

✅ **Pass nếu:** Slogan đọc rõ trên splash, 3 slide hiển thị đẹp, đóng/mở app nhanh.

📝 **Cho mình feedback:** Slogan có dễ nhớ không? Bạn hiểu app dùng để làm gì sau khi xem 3 slide chứ?

### Test 1 — Đăng nhập bằng Email OTP (3 phút)

> ⚠️ **App KHÔNG có đăng ký bằng password.** Đăng nhập bằng OTP gửi qua email.

1. Ở màn Đăng nhập → chọn tab **"Email"**
2. Nhập email Gmail của bạn (vd: `tencua.ban@gmail.com`)
3. Bấm **Gửi mã** → đợi 30-60 giây
4. **Mở Gmail** trên điện thoại → tìm mail từ `noreply@traotay.com.vn` với subject **"Mã xác nhận OTP - Trao Tay"**
   - ⚠️ Nếu không thấy trong Inbox → check **Spam folder** (mail từ domain mới có thể bị Gmail đẩy vào Spam)
   - Đánh dấu "Not spam" để lần sau vào Inbox
5. Copy mã 6 số → quay lại app → nhập mã → bấm **Xác nhận**
6. (Lần đầu) Màn hoàn tất hồ sơ — điền tên → **Hoàn tất**
7. Vào Trang chủ ✅

✅ **Pass nếu:** Nhận mail OTP trong 1-2 phút, nhập mã → vào Trang chủ + nhận mail welcome (riêng) chào mừng.

❌ **Báo lỗi nếu:**
- Không nhận được mail OTP sau 5 phút (cả Inbox + Spam)
- Mã đúng nhưng app báo sai
- App crash khi nhập mã

### Test 2 — Đăng nhập bằng Số điện thoại (3 phút)

> Test này yêu cầu đăng xuất khỏi email + login lại bằng SĐT để verify cả 2 luồng auth. Nếu không tiện, skip — báo mình "skip Test 2".

1. Tab **Cá nhân** → cuộn xuống → **Đăng xuất**
2. Màn Đăng nhập → chọn tab **"Số điện thoại"**
3. Nhập SĐT (vd: `0912345678`, app tự thêm `+84`)
4. Bấm **Gửi mã**
5. Đợi tin nhắn SMS có 6 số → nhập mã
6. (Lần đầu) Hỏi tên → điền → vào Trang chủ

✅ **Pass nếu:** Nhận SMS trong vòng 1 phút, nhập mã → vào app OK.

❌ **Báo lỗi nếu:** Không nhận SMS sau 2 phút, hoặc mã sai liên tục.

> 💡 **Khôi phục cho test sau**: đăng xuất rồi đăng nhập lại bằng email gốc cho test 3-10.

### Test 3 — Đăng tin với category grid + map "Vị trí của tôi" (5 phút) 🆕

1. Ở trang chủ → bấm tab **Đăng tin** (giữa thanh dưới, có dấu +)
2. Điền form:
   - **Tiêu đề:** "Test bài đăng đầu tiên"
   - **Mô tả:** "Đây là bài test, không phải bán đồ thật"
   - **Hình thức:** chọn **Cho tặng** (free)
3. **Danh mục — TEST GRID MỚI 🆕:**
   - Tap trường "Danh mục" → mở **bottom sheet GRID 4 CỘT** (KHÔNG còn dropdown 18 dòng dài)
   - Phải thấy **5 sections**: Đồ gia dụng / Cá nhân / Giải trí / Phương tiện & BĐS / Khác
   - Tap **"Mẹ & Bé"** hoặc **"Đồ nghề"** (loại lạ) → close + label hiện đúng
4. **Giá:** 0
5. **Vị trí — TEST 34 TỈNH + GPS 🆕:**
   - Bấm **"Ghim vị trí món đồ"** → vào màn map
   - Tap dropdown thành phố trên cùng → bottom sheet **34 tỉnh** sắp xếp **A-Z**
   - Test search: gõ `"binh duong"` → KHÔNG ra (vì đã sáp nhập vào TP.HCM)
   - Đóng → bấm nút tròn 📍 góc trên-phải **"Vị trí của tôi"**
   - Lần đầu: cấp quyền → map bay về vị trí thực
   - Nếu bạn đã từ chối quyền → hiện **dialog đẹp** với nút "Mở Cài đặt"
6. **Thêm ảnh:**
   - Tap nút **"Thêm ảnh"** → chọn **Camera** hoặc **Thư viện**
   - Chọn 1-3 ảnh
7. Bấm **Đăng**
8. Quay lại Trang chủ → tìm bài vừa đăng

✅ **Pass nếu:**
- Category grid hiển thị đẹp với icon + animation, label đúng
- Filter 34 tỉnh sort A-Z, search "lao cai" ra "Lào Cai"
- "Vị trí của tôi" bay đúng GPS
- Bài lên trang chủ + xem được ảnh đầy đủ

❌ **Báo lỗi nếu:**
- Upload ảnh treo > 30 giây
- Vẫn còn các tỉnh "Hà Nam", "Bến Tre", "Bình Dương" (đã sáp nhập)
- "Vị trí của tôi" không bay được dù đã cấp quyền

### Test 4 — Sửa bài có thay ảnh (3 phút) 🆕

> Đây là bug Phase 1 đã fix: trước đây sửa bài KHÔNG cho thay ảnh, giờ có rồi.

1. Tab **Cá nhân** → **Bài đăng của tôi** → bấm vào bài Test 3 → tap **Sửa**
2. **Đầu form** phải có section **"Ảnh (X/10)"** với row scroll horizontal:
   - Mỗi ảnh có nút **X (xoá)** góc trên-phải
   - Cuối row có nút **"+ Thêm ảnh"**
3. **Test xoá ảnh:** tap X trên 1 ảnh → ảnh biến mất khỏi row
4. **Test thêm ảnh:** tap "+ Thêm ảnh" → chọn camera/gallery → ảnh mới hiện với badge **"Mới"** (góc dưới)
5. Đổi tiêu đề thành "Test sửa bài có ảnh"
6. Bấm **Lưu** (góc phải trên) → đợi upload ảnh mới (~5-10s)
7. Quay lại Trang chủ → bài cập nhật tiêu đề + ảnh mới ✓

✅ **Pass nếu:** Xoá/thêm ảnh smooth, lưu xong DB cập nhật đúng.

❌ **Báo lỗi nếu:**
- KHÔNG có section "Ảnh" trong màn Sửa bài
- Lưu xong bài bị mất hết ảnh (chỉ còn text)
- Lỗi "Bài đăng phải có ít nhất 1 ảnh" dù còn ảnh

### Test 4b — Xoá bài (1 phút)

1. Vào lại bài → bấm icon 3 chấm góc phải → **Xoá**
2. Confirm → bài biến mất khỏi "Bài đăng của tôi"

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

### Test 7 — Tab Tìm kiếm + Filter 34 tỉnh + post detail category (3 phút) 🆕

1. Bấm tab **Tìm kiếm** (kính lúp)
2. Gõ keyword bất kỳ → xem kết quả
3. **Filter province 🆕:** tap icon vị trí trên đầu trang chủ (hoặc filter trong tab Tìm kiếm)
   - Phải thấy **34 tỉnh** chia 3 vùng (Bắc/Trung/Nam), mỗi vùng sort **A-Z**
   - KHÔNG còn các tỉnh đã sáp nhập: Hà Nam, Bến Tre, Bình Dương, Yên Bái, ...
   - Chọn **"Toàn miền Bắc"** → kết quả chỉ tỉnh phía Bắc
4. Thử filter loại / danh mục
5. Bấm vào 1 bài → màn chi tiết:
   - **Phải thấy chip xanh nhỏ** với icon + tên category ngay dưới tiêu đề 🆕
   - Ảnh load nhanh
6. Bấm Quay lại → về tab Tìm kiếm

✅ **Pass nếu:** Filter ra đúng vùng, post detail có chip category rõ ràng.

### Test 8 — Chat realtime + gửi ảnh (5 phút) 🆕

> Cần 2 thiết bị (hoặc nhờ em/bạn cùng cài app, đăng nhập acc khác).

1. Mở 1 bài đăng của user khác → bấm **"Nhắn tin"** → vào màn chat
2. Gửi tin nhắn text → người kia nhận realtime ✓
3. **Test gửi ảnh 🆕:** Bên trái ô nhập có **icon máy ảnh 📷**
   - Tap → bottom sheet 2 lựa chọn:
     - 📷 **"Chụp ảnh"** → mở camera → chụp → tự upload + gửi
     - 🖼️ **"Chọn từ thư viện"** → gallery → chọn → gửi
4. Trong bubble chat → **tap vào ảnh** → zoom fullscreen ✓
5. Người nhận thấy ảnh + nhận push notification "🖼️ [Hình ảnh]"

✅ **Pass nếu:** Cả camera + gallery đều work, ảnh hiện trong bubble + zoom được.

### Test 9 — Theo dõi + sync trạng thái (3 phút) 🆕

> Verify follow button đồng nhất giữa 2 chỗ.

1. Mở 1 bài của user khác → vào post detail
2. Trong khu vực "Người đăng" có nút chip **"Theo dõi"** (icon `+`) — KHÔNG còn chip có dấu `+` thừa trước
3. Tap **"Xem trang cá nhân →"** → vào profile họ
4. Header có nút outlined trắng **"Theo dõi"** (cùng text, cùng icon `+`)
5. Tap nút này → đổi sang **"Đang theo dõi"** (icon ✓)
6. Bấm **back** → quay về post detail
7. **CHECK:** chip seller info giờ phải hiển thị **"Đang theo dõi"** (icon ✓) — sync đúng ✓

✅ **Pass nếu:** Cả 2 nút theo dõi (chip + outlined) cùng text/icon. Sau follow ở profile, post detail tự cập nhật.

### Test 10 — Tab Tin nhắn (1 phút)

1. Bấm tab **Tin nhắn**
2. Hiện danh sách chat (nếu có) hoặc empty state "Chưa có tin nhắn nào"

✅ **Pass nếu:** Hiển thị đúng, không crash.

### Test 11 — Tab Cá nhân (hiện CẢ email + SĐT) (3 phút) 🆕

1. Bấm tab **Cá nhân** / **Tôi**
2. Kiểm tra header:
   - Avatar (có thể đổi qua icon máy ảnh)
   - Tên bạn
   - **Phải thấy CẢ 2 dòng** (nếu có): 📞 SĐT và ✉️ Email — không phải chỉ 1 cái 🆕
   - Trust badges (Đã xác minh SĐT / X deal thành công)
3. Các mục con: Bài đăng của tôi / Đã lưu / Liên kết email/SĐT / Đổi mật khẩu / ...
4. Bấm thử mỗi mục, không crash

✅ **Pass nếu:** Email + SĐT hiển thị đầy đủ với icon, các mục con không lỗi.

### Test 12 — Login redirect intent (2 phút) 🆕

> Verify bug fix: trước đây login từ prompt giữa flow → reset stack về Home tab → mất context.

1. Tab Cá nhân → **Đăng xuất**
2. Vào tab **Trang chủ** (chưa login) → tap vào 1 bài bất kỳ → vào post detail
3. Tap **❤️ (yêu thích)** → snackbar `"Vui lòng đăng nhập"` → bấm **"Đăng nhập"**
4. Login bằng email OTP
5. **Phải thấy:** App QUAY LẠI ĐÚNG bài đang xem (KHÔNG về Home tab) ✓

✅ **Pass nếu:** Sau login app về post detail, không reset Home.

### Test 13 — Đóng app + Mở lại (1 phút)

1. **Đóng hoàn toàn app** (vuốt lên + xoá khỏi recent)
2. Mở lại app từ icon
3. Splash hiện ~0.8s (nhanh, không 2.4s như user mới)
4. Vào thẳng Trang chủ (không phải đăng nhập lại)

✅ **Pass nếu:** Mở app nhanh + giữ session login.

❌ **Báo lỗi nếu:** Phải đăng nhập lại mỗi lần mở app.

---

## PHẦN C — TEST EDGE CASES (15-30 phút, nice-to-have)

### Test 14 — Mạng yếu / mất mạng

1. Bật chế độ **Máy bay** (Airplane mode) trên điện thoại
2. Mở app, thử pull to refresh trang chủ
3. Tắt máy bay → bấm **Thử lại** trên màn lỗi

✅ **Pass nếu:**
- Khi mất mạng: app hiện icon Wifi gạch chéo + "Không thể tải dữ liệu" + nút "Thử lại" (KHÔNG hiện "Không có bài đăng" — đó là sai)
- Khi có mạng: bấm Thử lại → load lại data

### Test 15 — Upload nhiều ảnh

1. Đăng 1 bài mới với **10 ảnh** cùng lúc (số tối đa)
2. Đợi upload xong → xem có lỗi không

✅ **Pass nếu:** 10 ảnh upload hết, hiện trong bài chi tiết

### Test 16 — Map view (bản đồ)

1. Tab Tìm kiếm hoặc trang chủ → tìm icon **bản đồ** 🗺️ hoặc nút "Xem trên bản đồ"
2. Bản đồ load → hiện các bài đăng dưới dạng pin/marker
3. Bấm vào 1 marker → preview bài
4. Zoom in/out, di chuyển bản đồ

✅ **Pass nếu:** Bản đồ load < 5 giây, marker rõ, không bị lag khi zoom

### Test 17 — Filter theo khoảng cách (GPS)

1. Tab Tìm kiếm → tìm icon **vị trí** / **GPS** / **Quanh tôi**
2. Lần đầu: app xin quyền truy cập vị trí → cho phép
3. Chọn bán kính 5km / 10km / 20km
4. Kết quả hiện các bài trong bán kính đó

✅ **Pass nếu:**
- App xin quyền vị trí (popup Android)
- Sau khi cho phép → tìm thấy bài gần (giả sử trong bán kính có bài)

❌ **Báo lỗi nếu:** App không xin quyền + thấy "Không có bài" dù gần đúng có bài

### Test 18 — Tin nhắn 2 chiều stress test (cần 2 thiết bị / 2 acc)

> Phần này skip nếu chỉ có 1 máy. Cần người khác cùng cài app.

1. Người A đăng 1 bài (vd cái áo cho)
2. Người B vào xem bài → bấm nút **Nhắn tin**
3. Hai người gửi tin nhắn qua lại 5-10 lần
4. Test gửi nhanh liên tục (spam) → có bị mất tin không?

✅ **Pass nếu:** Tin nhắn 2 chiều hiện gần như real-time (< 2 giây)

### Test 19 — Push notification

1. Cho phép app gửi thông báo khi hỏi (popup quyền lần đầu)
2. **Đóng app** (kéo lên thoát task) — để app KHÔNG đang mở
3. Có người gửi tin cho bạn → có nhận được noti banner trên đỉnh màn hình không?
4. Bấm vào noti → app mở đúng cuộc trò chuyện

✅ **Pass nếu:** Noti hiện khi app đóng, bấm vào mở đúng chỗ

### Test 20 — Tab Thông báo (badge realtime) 🆕

1. Sau khi có người nhắn tin / có activity → tab **Thông báo** (chuông) hiện badge đỏ **NGAY** (KHÔNG cần kéo refresh) 🆕
2. Vào tab → list noti hiển thị
3. Bấm vào 1 noti → mở đúng nội dung (vd vào chat room)

✅ **Pass nếu:** Badge cập nhật real-time tự động, không phải refresh.

> 💡 Bug Phase 1: badge chỉ fire khi vào tab. Fix Phase 2: NotificationModule restructured → badge realtime.

---

## PHẦN D — TEST THANH TOÁN PAYOS (10 phút, mình hoàn tiền 100%)

> 🙏 **Quan trọng:** Phần này yêu cầu thanh toán THẬT qua app banking để verify PayOS. **Mình hoàn lại đủ số tiền + tip thêm 10k cảm ơn** sau khi bạn báo đã trả. Số tiền nhỏ (5k hoặc 15k) nhưng đây là luồng critical bắt buộc test — không có tester thì luồng PayOS không catch bug được.

### Test 21 — Boost bài đăng PayOS (gói Plus 3 ngày, 5,000đ)

1. Vào tab **Cá nhân** → **Bài đăng của tôi** → chọn 1 bài đã đăng (hoặc đăng bài mới ở Test 3)
2. Bấm vào bài → tìm nút **Boost / Đẩy bài lên top**
3. Chọn gói **Plus 3 ngày — 5,000đ**
4. Bấm **Thanh toán** → 🆕 **Phải hiện AlertDialog confirm** "Bạn sắp trả 5.000đ — Đồng ý?" (chống vô tình bấm)
5. Bấm **Đồng ý** → app mở WebView PayOS
6. Trong WebView:
   - Hiện QR code + thông tin chuyển khoản
   - **Mở app ngân hàng (Vietcombank / MB Bank / Techcombank...)** → quét QR → confirm chuyển 5,000đ
7. Đợi 10-15 giây sau khi chuyển → app tự đóng WebView (🆕 polling tăng từ 6s lên 15s cho 3G yếu)
8. Hiện loading "Đang xác nhận thanh toán..."
9. Sau ~5-10 giây → hiện popup **"Đã kích hoạt gói Plus 3 ngày!"**
10. Quay lại trang chủ → tìm bài vừa boost → có badge **PLUS** màu xanh + bài lên top

✅ **Pass nếu:**
- AlertDialog confirm hiện trước khi mở PayOS 🆕
- Chuyển tiền thành công qua app ngân hàng
- App báo kích hoạt thành công trong vòng 30 giây
- Bài có badge Plus + lên top feed

❌ **Báo lỗi nếu:**
- KHÔNG có dialog confirm → mở thẳng PayOS (lỗi UX)
- WebView không load
- Chuyển tiền xong nhưng app không báo gì sau 1-2 phút
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

**Về thương hiệu (mới ở Phase 2):**
- Slogan **"Đồ cũ người này, Báu vật người kia"** — bạn cảm thấy thế nào? Có dễ nhớ? Có gợi cảm xúc không?
- Tên "Trao Tay" có dễ nhớ không? Có khác biệt với Shopee/Lazada không?
- 3 màn Onboarding — bạn hiểu app dùng để làm gì sau khi xem xong chứ?
- Logo xanh có đẹp không?

**Về sản phẩm:**
- Cảm giác chung khi dùng app: dễ hay khó dùng?
- Tính năng nào hữu ích nhất / dở nhất?
- Bạn có muốn dùng app này thật khi launch không? Vì sao?
- Bạn nghĩ tệp user nào sẽ thích nhất? (sinh viên / mẹ bỉm sữa / dân văn phòng / ...)

Cứ nhắn tự nhiên thoải mái, không cần format, mình ghi nhận hết.

---

## CẢM ƠN BẠN!

Cảm ơn bạn đã dành thời gian giúp mình test app. Sau khi launch chính thức trên Play Store, mình sẽ ưu tiên các bạn được Closed Testing tiếp với phiên bản mới nhất.

Có gì khúc mắc cứ inbox mình bất cứ lúc nào:
👉 https://www.facebook.com/vaykhap.troi/
