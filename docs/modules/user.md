# MODULE: User

## Mô tả
Quản lý tài khoản người dùng: đăng ký/đăng nhập bằng OTP (SĐT hoặc Email), profile, avatar.

> **Lưu ý (22/04/2026):** App chỉ dùng OTP-only auth. Đăng ký = đăng nhập (tạo user tự động nếu chưa tồn tại). Không còn màn hình đăng ký riêng, không còn mật khẩu.

## Files liên quan
| Layer | File |
|---|---|
| Controller | `backend/src/user/user.controller.ts` |
| Service | `backend/src/user/user.service.ts` |
| Module | `backend/src/user/user.module.ts` |
| Flutter Screen | `app/lib/screens/auth/phone_login_screen.dart` — màn hình auth duy nhất |
| Flutter Provider | `app/lib/providers/auth_provider.dart` |
| Flutter API call | `app/lib/services/api_service.dart` |

## Luồng Auth (OTP-only)

```
Màn hình đăng nhập (PhoneLoginScreen)
├── Tab SĐT  → Firebase verifyPhoneNumber → OTP → loginWithPhone(idToken)
└── Tab Email → sendEmailLoginOtp → OTP → loginWithEmailOtp(email, otp)

Sau khi thành công:
├── isNewUser = true → CompleteProfileScreen (nhập tên)
└── isNewUser = false → AppShell
```

## API Endpoints

Xem đầy đủ tại [CORE_FRAMEWORK.md](../CORE_FRAMEWORK.md) — section `User — /user`

### Endpoint đáng chú ý

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| POST | `/user/phone-login` | — | Đăng nhập/đăng ký SĐT (Firebase idToken) → `isNewUser` |
| POST | `/user/email-login/send` | — | Gửi OTP đến email (tạo user nếu chưa có) |
| POST | `/user/email-login/verify` | — | Xác nhận OTP email → JWT + `isNewUser` |
| GET | `/user/me` | JWT | Thông tin user hiện tại |
| PATCH | `/user/:id` | JWT | Cập nhật profile (tên, v.v.) |
| POST | `/user/avatar` | JWT | Upload avatar (Cloudinary) |
| DELETE | `/user/me` | JWT | **Xóa tài khoản** |
| POST | `/user/block/:blockedId` | JWT | Chặn user |
| DELETE | `/user/block/:blockedId` | JWT | Bỏ chặn user |

## Tính năng xóa tài khoản (thêm 21/04/2026)

**Endpoint:** `DELETE /user/me` — cần JWT

**Logic xóa (Prisma transaction theo đúng thứ tự FK):**
1. Xóa `Notification` của user
2. Xóa `Favorite` của user
3. Xóa `Follow` (cả followerId và followingId)
4. Xóa `BlockedUser` (cả blockerId và blockedId)
5. Xóa `Review` (cả reviewerId và revieweeId)
6. Xóa `Deal` (cả requesterId và ownerId)
7. Xóa `Message` của user
8. Xóa `ChatRoom` (cả buyerId và sellerId)
9. Xóa `Post` của user
10. Xóa `User`

**Flutter — `AuthProvider.deleteAccount()`:**
- Gọi `ApiService.deleteAccount()` → `DELETE /user/me`
- Nếu thành công: clear toàn bộ state (`_isAuthenticated`, `_userId`, v.v.) → `notifyListeners()`
- UI: nút "Xóa tài khoản" trong `my_profile_screen.dart` với 2-step confirmation dialog

## DB Model
Xem [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md) — bảng `User`

## AuthProvider methods

| Method | Mô tả |
|---|---|
| `loginWithPhone(idToken)` | Đăng nhập SĐT, set `isNewUser` |
| `loginWithEmailOtp(email, otp)` | Đăng nhập email OTP, set `isNewUser`, gọi `_sendFcmToken()` |
| `loadFromPrefs()` | Auto-login từ SharedPreferences, gọi `_sendFcmToken()` |
| `logout()` | Clear state + prefs |
| `deleteAccount()` | Xóa tài khoản, clear state |

## Lưu ý
- JWT token hiệu lực **7 ngày**
- Token lưu vào `SharedPreferences` key `auth_token` phía Flutter
- Sau login phải gọi `_sendFcmToken()` để cập nhật FCM token cho push notification
- Email OTP: backend tự tạo user mới nếu email chưa tồn tại, `isNewUser=true`
- SĐT OTP: user mới được tạo tên tạm `User_XXXX` (4 số cuối SĐT), đổi tên qua CompleteProfileScreen
