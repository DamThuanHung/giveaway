# MODULE: Favorite

## Mô tả
Cho phép user lưu các bài đăng yêu thích để xem lại sau.

## Files liên quan
| Layer | File |
|---|---|
| Controller | `backend/src/favorite/favorite.controller.ts` |
| Service | `backend/src/favorite/favorite.service.ts` |
| Module | `backend/src/favorite/favorite.module.ts` |
| Flutter Service | `app/lib/services/favorite_service.dart` |
| Flutter Screen | `app/lib/screens/favorites_tab.dart` |

## API Endpoints

### POST `/favorite` — Thêm vào yêu thích
**Request body:**
```json
{
  "userId": 1,
  "postId": 2
}
```

---

### DELETE `/favorite` — Xóa khỏi yêu thích
**Request body:**
```json
{
  "userId": 1,
  "postId": 2
}
```

---

### GET `/favorite/:userId` — Lấy danh sách yêu thích
**Response:** Array Post objects đã yêu thích của user

## Lưu ý quan trọng
- **Controller dùng `Number(body.userId)` và `Number(body.postId)`** — đang convert sang integer, nhưng User và Post ID trong DB là **UUID string**. Đây là bug tiềm ẩn cần sửa.
- Model `Favorite` **chưa có trong Prisma schema** — cần tạo trước khi FavoriteService hoạt động được
- Cần thêm bảng `Favorite` với quan hệ nhiều-nhiều giữa `User` và `Post`

## Schema cần bổ sung (đề xuất)
```prisma
model Favorite {
  id        String   @id @default(uuid())
  userId    String
  postId    String
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
  post Post @relation(fields: [postId], references: [id])

  @@unique([userId, postId])
}
```
