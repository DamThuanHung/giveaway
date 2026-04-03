# MODULE: User

## Mô tả
Quản lý tài khoản người dùng: đăng ký, đăng nhập, lấy danh sách.

## Files liên quan
| Layer | File |
|---|---|
| Controller | `backend/src/user/user.controller.ts` |
| Service | `backend/src/user/user.service.ts` |
| Module | `backend/src/user/user.module.ts` |
| Flutter Provider | `app/lib/providers/auth_provider.dart` |
| Flutter API call | `app/lib/services/api_service.dart` |

## API Endpoints

### POST `/user` — Đăng ký tài khoản
**Request body:**
```json
{
  "email": "user@example.com",
  "password": "123456",
  "name": "Nguyễn Văn A"
}
```
**Response:** User object vừa tạo

---

### POST `/user/login` — Đăng nhập
**Request body:**
```json
{
  "email": "user@example.com",
  "password": "123456"
}
```
**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
> Token được lưu vào `SharedPreferences` key `auth_token` phía Flutter.

---

### GET `/user` — Lấy danh sách users
**Response:** Array user objects

## DB Model
Xem [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md) — bảng `User`

## Lưu ý
- Mật khẩu được hash bằng **bcrypt** trước khi lưu
- JWT token hiệu lực **7 ngày**
- Hiện chưa có middleware guard bảo vệ route — mọi route đều public
