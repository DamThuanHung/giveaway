# Play Store Data Safety Form — Trao Tay

> Template trả lời từng câu hỏi của Google Play Console → **Data safety** form.
> Soạn dựa trên dữ liệu Trao Tay thực tế thu thập (audit từ codebase 2026-04-25).
>
> Vào Console → App content → **Data safety** → trả lời 5 section sau.

---

## Section 1 — Data collection and security

### 1.1 Does your app collect or share any of the required user data types?
**Yes**

### 1.2 Is all of the user data collected by your app encrypted in transit?
**Yes** — Tất cả request qua HTTPS (TLS 1.2+) khi production, MinIO ảnh qua HTTPS (`s3.traotay.com.vn`).

### 1.3 Do you provide a way for users to request that their data be deleted?
**Yes** — User vào **Hồ sơ → Xóa tài khoản** trong app. Backend xóa sạch posts, deals, reviews, messages, favorites, follows; ẩn danh hóa user (xóa email/phone/avatar/fcmToken/password). Endpoint `DELETE /user/me`.

---

## Section 2 — Data types collected

Tick các loại dưới đây trong form.

### 📍 Location
| Data type | Collected | Shared | Optional | Purpose |
|---|---|---|---|---|
| **Approximate location** | ✅ | ❌ | ✅ Optional | App functionality (lọc bài gần user, hiện trên bản đồ) |
| Precise location | ❌ | — | — | Không thu thập GPS chính xác — chỉ tỉnh/quận user tự chọn |

### 👤 Personal info
| Data type | Collected | Shared | Optional | Purpose |
|---|---|---|---|---|
| **Name** | ✅ | ❌ | ❌ Required | Account management (hiển thị tên trong post, chat) |
| **Email address** | ✅ | ❌ | ✅ Optional | Account management + Communications (OTP, thông báo) |
| **User IDs** | ✅ | ❌ | ❌ Required | Account management |
| **Phone number** | ✅ | ❌ | ✅ Optional | Account management (OTP đăng nhập SĐT) |
| **Address** | ❌ | — | — | User chỉ chọn khu vực (tỉnh/quận/phường), không nhập địa chỉ chi tiết riêng tư |

### 💬 Messages
| Data type | Collected | Shared | Optional | Purpose |
|---|---|---|---|---|
| **In-app messages** | ✅ | ❌ | — | App functionality (chat giữa người mua-bán) |

### 📷 Photos and videos
| Data type | Collected | Shared | Optional | Purpose |
|---|---|---|---|---|
| **Photos** | ✅ | ❌ | ✅ Optional | App functionality (ảnh bài đăng, avatar) |

### 💰 Financial info
| Data type | Collected | Shared | Optional | Purpose |
|---|---|---|---|---|
| **Purchase history** | ✅ | ❌ | — | App functionality (lịch sử mua gói Bump qua PayOS) |
| Credit card info | ❌ | — | — | **KHÔNG lưu** — PayOS xử lý hoàn toàn, app chỉ nhận webhook xác nhận |

### 📱 App activity
| Data type | Collected | Shared | Optional | Purpose |
|---|---|---|---|---|
| **App interactions** | ✅ | ❌ | — | Analytics (Firebase Analytics — đo retention, feature usage) |
| **In-app search history** | ✅ | ❌ | — | App functionality (gợi ý tìm kiếm) |
| Other user-generated content | ✅ | ❌ | — | App functionality (bài đăng, review, comment) |

### 🔧 App info and performance
| Data type | Collected | Shared | Optional | Purpose |
|---|---|---|---|---|
| **Crash logs** | ✅ | ❌ | — | Analytics (Firebase Crashlytics — fix bug) |
| **Diagnostics** | ✅ | ❌ | — | Analytics (Firebase Performance) |

### 🆔 Device or other IDs
| Data type | Collected | Shared | Optional | Purpose |
|---|---|---|---|---|
| **Device or other IDs** | ✅ | ❌ | — | App functionality (FCM push token cho thông báo) |

---

## Section 3 — Data sharing

**Trao Tay KHÔNG bán hoặc chia sẻ data với third party** (ngoài service providers thiết yếu).

Service providers (data processor, không phải sharing theo định nghĩa Google):
- **Firebase (Google)** — FCM push, Analytics, Crashlytics, Authentication
- **PayOS** — Cổng thanh toán QR (chỉ orderId + amount + description, không personal info)
- **Resend** — Gửi email OTP (chỉ email + OTP code)
- **MinIO/AWS** (self-hosted) — Lưu trữ ảnh

---

## Section 4 — Security practices

Tick các option sau:

✅ **Data is encrypted in transit** — HTTPS/TLS toàn bộ
✅ **You can request that data be deleted** — Endpoint `DELETE /user/me` + UI "Xóa tài khoản"
❌ Committed to follow Google Play Families Policy — Trao Tay là Everyone (13+), chưa target trẻ em

---

## Section 5 — Privacy policy URL

```
https://damthuanhung.github.io/giveaway/privacy.html
```

(Sau khi deploy AWS xong, đổi sang `https://traotay.com.vn/privacy`.)

---

## Quick paste cheatsheet — copy nhanh khi điền form

**Mô tả mục đích thu thập (nếu Google hỏi):**
```
Trao Tay thu thập thông tin tối thiểu để cung cấp dịch vụ marketplace:
tên + email/SĐT cho đăng nhập, ảnh + nội dung do user tự đăng, vị trí
khu vực (tỉnh/quận) để lọc bài gần user, lịch sử thanh toán Bump (gói
boost trả phí qua PayOS). Mọi data được mã hóa trong khi truyền và user
có quyền xóa toàn bộ thông qua chức năng "Xóa tài khoản" trong app.
```

**Privacy policy URL:**
```
https://damthuanhung.github.io/giveaway/privacy.html
```

**Support email:**
```
damhungtpt@gmail.com
```

**Website:**
```
https://traotay.com.vn
```

---

## Lưu ý quan trọng

1. **Honest declaration** — Google audit data safety vs actual app behavior. Khai sai → app bị remove.
2. **Update khi thay đổi** — Khi thêm data type mới (vd: bật Sentry → thêm "Crash logs" nếu chưa tick), update form.
3. **Re-submit sau 7 ngày** — Mọi thay đổi data safety cần Google review lại.

---

## Lịch sử update

| Ngày | Thay đổi |
|---|---|
| 2026-04-25 | Tạo template từ codebase audit |
