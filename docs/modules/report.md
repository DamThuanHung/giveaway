# MODULE: Report

## Mô tả
Cho phép user báo cáo bài đăng vi phạm nội quy.

## Files liên quan
| Layer | File |
|---|---|
| Controller | `backend/src/report/report.controller.ts` |
| Service | *(chưa có — chưa implement)* |
| Flutter API | `app/lib/services/api_service.dart` → `reportPost()` |

## API Endpoints

### POST `/report` — Báo cáo bài đăng
**Request body:**
```json
{
  "postId": "uuid-cua-bai-dang",
  "reason": "Nội dung không phù hợp"
}
```
**Response:**
```json
{
  "message": "Report received",
  "data": { "postId": "...", "reason": "..." }
}
```

## Trạng thái hiện tại
- Controller chỉ `console.log` dữ liệu và trả về response giả
- **Chưa lưu vào DB**
- **Chưa có ReportService**
- Flutter gọi endpoint `POST /post/report` (sai path — đúng là `POST /report`)

## Việc cần làm
1. Tạo `ReportService` và model `Report` trong Prisma
2. Sửa Flutter `api_service.dart`: đổi URL từ `/post/report` → `/report`
3. Thêm luồng xử lý (email admin, dashboard quản lý vi phạm...)
