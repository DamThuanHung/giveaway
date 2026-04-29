# Data Safety Form — Trao Tay

> Nội dung điền vào **Google Play Console → App content → Data safety**.
> Mỗi mục Google hỏi → click checkbox + chọn dropdown theo hướng dẫn dưới.

---

## 0. Section đầu — Câu hỏi tổng

| Câu hỏi | Trả lời |
|---|---|
| Does your app collect or share any of the required user data types? | **Yes** |
| Is all of the user data collected by your app encrypted in transit? | **Yes** (HTTPS/TLS) |
| Do you provide a way for users to request that their data be deleted? | **Yes** (in-app + email) |
| Does your app comply with Google Play Families Policy? | **No** (app cho 13+, không target trẻ em) |

---

## 1. Personal info (Thông tin cá nhân)

### 1.1 Name (Tên)
- ✅ **Collected**
- Optional or required: **Required** (lúc đăng ký) — actually optional, chỉ tên hiển thị
- Cập nhật chính xác hơn: **Optional** (user có thể đăng ký bằng email/SĐT, chưa cần tên)
- ❌ **Not shared** (không gửi cho bên thứ ba)
- Purposes: **App functionality**, **Account management**

### 1.2 Email address
- ✅ **Collected** — Required
- ❌ **Not shared** với bên ngoài (Resend chỉ là email delivery service, processing on our behalf)
- Purposes: **App functionality** (đăng nhập OTP, thông báo tài khoản), **Account management**

### 1.3 User IDs
- ✅ **Collected** (User.id, FCM token)
- Required
- ❌ **Not shared** với bên thứ ba có quyền sử dụng riêng
- Purposes: **App functionality** (push notification, định danh phiên), **Account management**

### 1.4 Phone number
- ✅ **Collected** (Firebase Phone Auth)
- Required (đăng nhập SĐT)
- ✅ **Shared** với Google (Firebase Auth) — purpose: **Account management** (xác minh OTP)
- Purposes: **App functionality**, **Account management**

### 1.5 Address (Địa chỉ)
- ❌ **Not collected** (chỉ collect khu vực ở Location section, không lưu địa chỉ chi tiết của user — chỉ địa chỉ ITEM ở post)

### 1.6 Other personal info
- ❌ **Not collected**

---

## 2. Location (Vị trí)

### 2.1 Approximate location (Vị trí ước chừng)
- ✅ **Collected** (province/tỉnh thành của bài đăng)
- **Optional** (user có thể chọn province thủ công, không cần GPS)
- ❌ **Not shared**
- Purposes: **App functionality** (lọc bài theo khu vực)

### 2.2 Precise location (Vị trí chính xác)
- ✅ **Collected** (lat/lng khi user pick trên map cho bài đăng)
- **Optional** (user có thể bỏ qua, chỉ cần province)
- ❌ **Not shared**
- Purposes: **App functionality** (hiển thị khoảng cách, tìm bài gần đó trong bán kính)

---

## 3. Financial info

### 3.1 User payment info (Thông tin thanh toán)
- ❌ **Not collected** — Trao Tay KHÔNG lưu số thẻ/CVV. PayOS xử lý toàn bộ flow thanh toán qua trang riêng, redirect về app khi xong.

### 3.2 Purchase history (Lịch sử mua hàng)
- ✅ **Collected** (BumpOrder: gói Plus 5k / VIP 15k user đã mua)
- Required (cần để xác định bài đang được boost)
- ❌ **Not shared**
- Purposes: **App functionality** (kích hoạt boost), **Fraud prevention** (chống double-pay)

### 3.3 Credit score / Other financial info
- ❌ **Not collected**

---

## 4. Health and fitness
- ❌ **Not collected**

---

## 5. Messages (Tin nhắn)

### 5.1 Emails
- ❌ **Not collected** (Trao Tay không truy cập email user)

### 5.2 SMS or MMS
- ❌ **Not collected**

### 5.3 Other in-app messages
- ✅ **Collected** (chat giữa người mua / người bán)
- Required (lưu lịch sử chat)
- ❌ **Not shared**
- Purposes: **App functionality** (chat 1-1)

---

## 6. Photos and videos

### 6.1 Photos
- ✅ **Collected** (avatar, ảnh bài đăng, ảnh trong chat)
- **Optional** (post có thể không có ảnh; chat có thể không gửi ảnh)
- ❌ **Not shared**
- Purposes: **App functionality**

### 6.2 Videos
- ❌ **Not collected** (chưa hỗ trợ video)

---

## 7. Audio files
- ❌ **Not collected**

---

## 8. Files and docs
- ❌ **Not collected**

---

## 9. Calendar
- ❌ **Not collected**

---

## 10. Contacts
- ❌ **Not collected**

---

## 11. App activity

### 11.1 App interactions
- ✅ **Collected** (Firebase Analytics — screen views, button taps, session length)
- **Optional** (user có thể opt-out qua Analytics consent — nếu chưa làm thì để Required)
- ✅ **Shared** với Google (Firebase Analytics) — purpose: **Analytics**
- Purposes: **Analytics**

### 11.2 In-app search history
- ❌ **Not collected** (search query chỉ qua URL param, không lưu DB)

### 11.3 Installed apps
- ❌ **Not collected**

### 11.4 Other user-generated content
- ✅ **Collected** (post title/description, reviews, reports)
- Required (post phải có title + description)
- ❌ **Not shared**
- Purposes: **App functionality**

### 11.5 Other actions
- ❌ **Not collected**

---

## 12. Web browsing history
- ❌ **Not collected**

---

## 13. App info and performance

### 13.1 Crash logs
- ✅ **Collected** (Firebase Crashlytics)
- Required
- ✅ **Shared** với Google (Crashlytics) — purpose: **App functionality** (debug crash) + **Analytics**
- Purposes: **Analytics**, **App functionality**

### 13.2 Diagnostics
- ✅ **Collected** (Firebase Performance Monitoring nếu có; Analytics device info)
- Required
- ✅ **Shared** với Google
- Purposes: **Analytics**, **App functionality**

### 13.3 Other app performance data
- ❌ **Not collected**

---

## 14. Device or other IDs
- ✅ **Collected** (Android Advertising ID qua Firebase Analytics; FCM device token)
- Required
- ✅ **Shared** với Google (Firebase) — purpose: **Analytics**, **App functionality** (push)
- Purposes: **Analytics**, **App functionality**

---

## 15. Security practices (Phần cuối)

| Câu hỏi | Trả lời |
|---|---|
| Is all of the user data collected by your app encrypted in transit? | **Yes** — HTTPS/TLS cho mọi API; WSS cho socket chat. Cloudflare proxied. |
| Do you provide a way for users to request that their data be deleted? | **Yes** — User có thể xóa tài khoản trong app (Profile → Cài đặt → Xóa tài khoản); cũng nhận yêu cầu qua email `damhungtpt@gmail.com` |
| Has your app's data collection and security practices been independently validated against a global security standard? | **No** (chưa có audit độc lập kiểu SOC 2 / ISO 27001) |
| Do you handle children's data per the Families Policy? | **No** — app target 13+, không quảng bá cho trẻ em |

---

## 16. Cách user xóa data

Khi điền câu "Provide a way for users to request that their data be deleted":

> Người dùng có thể xóa tài khoản trực tiếp trong ứng dụng: tab **Hồ sơ → Xóa tài khoản**. Toàn bộ dữ liệu (tên, email, SĐT, ảnh, bài đăng, tin nhắn, giao dịch, đánh giá, thông báo) bị xóa **ngay lập tức**. Email/SĐT được giải phóng để đăng ký tài khoản mới.
>
> Ngoài ra, user có thể gửi yêu cầu xóa qua email `damhungtpt@gmail.com` — xử lý trong 30 ngày.
>
> Ngoại lệ: dữ liệu giao dịch (BumpOrder, hóa đơn PayOS) giữ lại tối đa 90 ngày dạng ẩn danh để tuân thủ kê khai thuế và phòng chống gian lận.

**URL cho web (Google bắt buộc):**
```
https://traotay.com.vn/delete-account.html
```

Page có hướng dẫn 4 bước xóa trong app + email yêu cầu thay thế. Đã deploy.

---

## 17. Tóm tắt bảng "Data shared / Data collected" mà Console sẽ hiện

### Data shared with third parties (Google Firebase chỉ)
- User IDs (FCM token, Android Advertising ID)
- App interactions
- Crash logs + Diagnostics

### Data collected (toàn bộ)
- Name, Email, Phone, User IDs
- Approximate location, Precise location (optional)
- Purchase history
- In-app messages
- Photos
- App interactions, Other user-generated content
- Crash logs, Diagnostics
- Device IDs

### Security
- ✅ Encrypted in transit
- ✅ Users can request data deletion

---

## ⚠️ Lưu ý quan trọng

1. **Photos KHÔNG share** — vì MinIO tự host trên EC2 của mình, không phải bên thứ 3.
2. **Phone Auth & FCM bắt buộc khai "shared with Google"** — vì Firebase processing on Google's servers.
3. **PayOS** — KHÔNG cần khai vào Data Safety (PayOS có form riêng của họ; user nhập số thẻ trực tiếp trên trang PayOS, app Trao Tay không thấy).
4. **Crashlytics + Analytics** — Google yêu cầu khai shared. Nếu sau này tắt Crashlytics/Analytics thì sửa lại.
5. **Resend (email OTP)** — service provider on our behalf, không tính là sharing (giống như AWS hosting).

---

## Sau khi submit

Google sẽ duyệt 1-2 ngày. Nếu họ phát hiện app làm khác form đã khai → reject. Vì vậy phải khai đúng + đầy đủ.

Khi ra mắt feature mới (vd: thêm video, voice message, location tracking liên tục) → vào lại Data Safety update.
