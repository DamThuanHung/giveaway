# ADR-0016 — Sửa lỗi thiết kế thống kê /dac-dinh: DacDinhPresence + xếp hạng theo dạng bài

**Ngày:** 2026-07-17
**Trạng thái:** Accepted
**Người quyết định:** Team (Hùng + Claude)

## Bối cảnh

Sau khi deploy ADR-0015 (bảng `DacDinhAttempt` + trang admin thống kê), anh Hùng test và cảm thấy
số liệu "chưa đúng". Rà lại phát hiện 2 lỗi thiết kế thật (không phải bug code):

1. **"Online" bị đếm thiếu nghiêm trọng.** Online count cũ đếm `userId` phân biệt có
   `DacDinhAttempt.createdAt` trong N phút gần nhất — nhưng `DacDinhAttempt` chỉ được ghi khi
   người dùng **hoàn thành xong** 1 dạng bài (bấm hết câu cuối). Người đang làm dở 1 bài Trắc
   nghiệm nhiều câu (có thể mất 5-10 phút) hoàn toàn không phát tín hiệu nào trong suốt thời
   gian đó — online count có thể hiện 0 dù đang có người thật sự hoạt động.
2. **Bảng xếp hạng bỏ qua 2 dạng bài mới.** Định nghĩa "hoàn thành 1 chương" = có attempt
   `exerciseType="quiz"` đạt điểm tuyệt đối — chọn "quiz" vì đây là dạng duy nhất chắc chắn có ở
   mọi chương (xem ADR-0015). Hệ quả: người hoàn thành cả 6 dạng bài (kể cả 🎯 Tình huống & Tính
   toán, 📋 Lập kế hoạch mới thêm) không được ghi nhận gì hơn người chỉ làm mỗi Trắc nghiệm rồi
   dừng — không phản ánh đúng nỗ lực học sâu hơn.

Ngoài ra, trang admin không có số liệu nền (tổng lượt làm bài / tổng người từng thử toàn thời
gian) để phân biệt "chưa ai dùng tính năng" với "có lỗi ngầm khiến số liệu trống".

## Quyết định

**1. Bảng `DacDinhPresence` mới** — 1 row/user, chỉ có `userId` (PK) + `lastSeenAt`. Ghi đè
(upsert) mỗi lần client gửi heartbeat, KHÔNG tích lũy lịch sử (khác hẳn `DacDinhAttempt`).

Client (`web/app/dac-dinh/page.tsx`) gọi `POST /dac-dinh/heartbeat` (JWT) ngay khi mount +
lặp lại mỗi 45 giây trong suốt thời gian còn ở trang `/dac-dinh` (không phụ thuộc đang làm bài
hay chỉ đang xem danh sách chương) — dừng khi unmount.

`GET /admin/dac-dinh/online` đổi sang đếm `DacDinhPresence` có `lastSeenAt >= now - N phút`
thay vì đếm `DacDinhAttempt`.

**2. Đổi tiêu chí xếp hạng** từ "số chương đạt 100% ở Trắc nghiệm" sang "số cặp (chương, dạng
bài) đạt điểm tuyệt đối trong kỳ" — bỏ điều kiện lọc `exerciseType="quiz"`, đếm mọi tổ hợp
`chapterId + exerciseType` riêng biệt mà user đạt `score=total`. Người hoàn thành nhiều dạng bài
hơn (không chỉ nhiều chương hơn) sẽ xếp hạng cao hơn — phản ánh đúng công sức học sâu.

**3. Thêm 2 số liệu nền** vào response của `GET /admin/dac-dinh/online`: `totalAttempts` (tổng
số row `DacDinhAttempt` toàn thời gian) và `totalUsers` (tổng số user phân biệt từng có ít nhất
1 attempt) — không lọc theo thời gian, giúp admin phân biệt "tính năng chưa ai dùng" với "có lỗi".

## Lý do chọn phương án này

- **Bảng riêng cho presence thay vì thêm cột vào `User`** (ví dụ tái dùng `User.lastActiveAt` có
  sẵn): `lastActiveAt` là tín hiệu hoạt động TOÀN APP (mọi request), không riêng cho `/dac-dinh`
  — dùng chung sẽ không trả lời được đúng câu hỏi "bao nhiêu người ĐANG LÀM BÀI ĐẶC ĐỊNH".
- **Không ghi heartbeat vào `DacDinhAttempt`** (ví dụ thêm 1 dòng "heartbeat" giả với
  `exerciseType="heartbeat"`): sẽ làm phình bảng rất nhanh (ping mỗi 45s × nhiều user đồng thời)
  và làm phức tạp mọi query đếm/xếp hạng trên bảng đó (phải lọc bỏ heartbeat ở mọi nơi). Tách
  bảng riêng giữ mỗi bảng có 1 trách nhiệm rõ ràng: `DacDinhAttempt` = lịch sử kết quả,
  `DacDinhPresence` = trạng thái hiện tại.
- **`DacDinhPresence` chỉ 1 row/user (upsert, không insert)**: không tăng kích thước theo thời
  gian dù có bao nhiêu heartbeat — khác PostView/AdminActionLog vốn tích lũy log theo ngày.
- **Đếm theo cặp (chương, dạng bài) thay vì theo chương**: cân nhắc phương án nặng hơn (trọng số
  theo độ khó từng dạng bài — planning > judgment > quiz > ...) nhưng quyết định chưa cần thiết
  ở giai đoạn này, có thể nâng cấp sau nếu cần phân biệt tinh hơn.

## Hậu quả

- Cần `prisma db push` production sau khi deploy backend (bảng mới, không có data cũ cần
  migrate).
- Field response `chaptersCompleted` của leaderboard đổi ý nghĩa (không còn là "số chương" mà là
  "số dạng bài hoàn thành 100%") — đã đổi tên field tương ứng trong response để tránh nhầm lẫn,
  frontend admin page cũng cập nhật theo.
- Heartbeat mỗi 45s × số user đang mở `/dac-dinh` tạo thêm traffic nhỏ tới backend — chấp nhận
  được vì đây là tính năng phụ trợ, lượng user đồng thời hiện tại rất nhỏ; nếu sau này scale lớn
  cần cân nhắc tăng chu kỳ heartbeat hoặc chuyển sang WebSocket presence thật.
- "Online" giờ đã phản ánh đúng người đang có mặt tại trang, nhưng vẫn có độ trễ tối đa 45s +
  cửa sổ N phút cấu hình — không phải real-time tuyệt đối, chấp nhận được cho mục đích xem tổng
  quan của admin.
