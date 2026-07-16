# ADR-0015 — DacDinhAttempt: bảng tracking kết quả làm bài /dac-dinh

**Ngày:** 2026-07-17
**Trạng thái:** Accepted
**Người quyết định:** Team (Hùng + Claude)

## Bối cảnh

Anh muốn trang Admin có thêm mục thống kê cho tính năng `/dac-dinh` (luyện thi Đặc định kỹ
năng): số người đang online làm bài, và bảng xếp hạng số chương hoàn thành 100% theo ngày/tuần.

Hiện tại điểm số (`bestScores`) chỉ lưu trong `localStorage` trên trình duyệt của từng người
dùng — server hoàn toàn không biết ai đang làm bài hay đạt được gì. Cần một nguồn dữ liệu phía
server để admin truy vấn.

## Quyết định

Tạo bảng `DacDinhAttempt`:
- `id` cuid
- `userId` (FK → User, cascade delete)
- `chapterId` string (ví dụ "sm-ch1") — khớp id chương phía `web/app/dac-dinh/data.ts`
- `exerciseType` string — khớp union `ExerciseType` phía web (vocab/translation/reorder/quiz/judgment/planning)
- `score`, `total` int
- `createdAt` datetime, có index riêng + index kết hợp `[userId, createdAt]` và `[exerciseType, createdAt]`

Client (`web/app/dac-dinh/page.tsx`) gọi `POST /dac-dinh/attempt` (yêu cầu đăng nhập) song song
với việc lưu `localStorage` mỗi khi hoàn thành 1 dạng bài — **không thay thế** localStorage (vẫn
cần cho logic mở khóa client-side hoạt động ngay cả khi mất mạng tạm thời), chỉ ghi thêm để admin
truy vấn.

**Định nghĩa "hoàn thành 1 chương"** cho mục đích xếp hạng: có ít nhất 1 attempt
`exerciseType="quiz"` với `score === total` ở chương đó. Chọn "quiz" làm mốc vì đây là dạng bài
duy nhất chắc chắn có mặt ở toàn bộ 25/25 chương (2 dạng mới Tình huống & Tính toán / Lập kế
hoạch chưa phủ đều mọi chương — xem ADR nội dung liên quan trong `docs/modules/dac-dinh.md`),
tránh xếp hạng bị lệch vì khác biệt độ phủ nội dung giữa các chương.

**Định nghĩa "online"**: proxy đơn giản — đếm số `userId` phân biệt có `attempt.createdAt` trong
N phút gần nhất (mặc định 10 phút), không phải presence real-time qua WebSocket.

Endpoint admin: `GET /admin/dac-dinh/online?minutes=10` và
`GET /admin/dac-dinh/leaderboard?period=day|week&limit=20`, thêm vào `AdminController`/
`AdminService` hiện có, dùng chung `computeSince()` (đã export từ `admin.service.ts`) để đảm bảo
mốc ngày/tuần tính theo giờ Việt Nam (UTC+7) nhất quán với các thống kê admin khác.

## Lý do chọn phương án này

- **Không dùng WebSocket presence thật**: tốn thêm hạ tầng + traffic liên tục cho một tính năng
  phụ trợ (luyện thi), trong khi proxy "hoạt động N phút gần nhất" đủ chính xác cho mục đích xem
  tổng quan của admin.
- **Không thay thế localStorage bằng server làm nguồn sự thật duy nhất**: logic mở khóa dạng bài
  tuần tự cần hoạt động mượt ngay trên client, không nên phụ thuộc round-trip mạng mỗi lần chuyển
  màn hình.
- **Không tạo module Nest riêng cho phần thống kê admin**: theo đúng pattern hiện có,
  `AdminService` đã là service tổng hợp querying trực tiếp Prisma cho mọi domain (posts/users/
  revenue/...), thêm 2 method mới vào đây nhất quán hơn tạo thêm 1 lớp trừu tượng.
- **So sánh `score === total` không làm được trực tiếp trong Prisma `where`** (không so sánh được
  2 cột với nhau) — chấp nhận fetch rồi lọc ở tầng application, vì đây là truy vấn admin không
  phải hot path, khối lượng dữ liệu nhỏ.

## Hậu quả

- Cần `prisma db push` production sau khi deploy backend (bảng mới, không có data cũ cần migrate).
- Nếu 1 chương chưa có nội dung "quiz" (hiện tại không có trường hợp nào, nhưng có thể xảy ra
  trong tương lai nếu cấu trúc nội dung đổi) thì chương đó vĩnh viễn không tính vào bảng xếp hạng
  — cần nhớ lại giả định này nếu sau này đổi cấu trúc `data.ts`.
- Xếp hạng hiện chỉ đếm số chương, không phân biệt độ khó — 1 chương ngắn (ví dụ sm-ch5 chỉ 8 câu)
  và 1 chương dài (hy-ch4 tới 48 câu) có trọng số như nhau. Có thể tinh chỉnh sau nếu cần.
