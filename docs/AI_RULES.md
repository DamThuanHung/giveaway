# AI RULES — Trao Tay-specific (Decision Log + project conventions)

> **⚠️ 2026-05-08 update:** Universal AI working rules đã chuyển sang
> [`docs/standards/AI_WORKING_RULES.md`](standards/AI_WORKING_RULES.md)
> (gộp authoritative từ 23+ memory feedback).
>
> File này GIỮ LẠI cho:
> - **Decision Log Trao Tay-specific** (quyết định reject pattern + lý do)
> - **Project conventions** chỉ áp dụng dự án này (UI tokens AppTheme,
>   UX patterns Vietnamese context)
> - **Lịch sử rule evolution** trước khi chuẩn hóa universal
>
> Nếu rule mới có tính universal → ghi vào `AI_WORKING_RULES.md`, KHÔNG
> ghi vào file này.

> **Mục đích cũ:** Quy định cách AI hành xử trong mọi prompt để đảm bảo app ngày càng
> đồng nhất hơn. File này được AI đọc và tự cập nhật theo thời gian.

---

## 1. Checklist bắt buộc TRƯỚC khi viết code

Trước mỗi task có liên quan đến UI/code, AI PHẢI tự hỏi:

```
□ Đã đọc docs/UI_DESIGN_SYSTEM.md chưa?
□ Đã đọc docs/UX_PATTERNS.md chưa?
□ Màu sắc / spacing có dùng token từ AppTheme không?
□ Component này đã có pattern mẫu trong UI_DESIGN_SYSTEM chưa?
□ Flow này có conflict với UX_PATTERNS không?
□ Backend endpoint đã tồn tại chưa? (đọc CORE_FRAMEWORK.md)
□ DB schema đã có field cần thiết chưa? (đọc DATABASE_SCHEMA.md)
```

Nếu bất kỳ câu nào chưa rõ → **hỏi user trước khi code**.

---

## 2. Quy tắc viết code Flutter

### Bắt buộc
- **LUÔN** import `AppTheme` khi cần màu, không hardcode hex
- **LUÔN** dùng `Theme.of(context).textTheme.*` cho typography
- **LUÔN** xử lý 3 state: loading, error, success (không chỉ viết happy path)
- **LUÔN** có `errorBuilder` cho `Image.network`
- **LUÔN** dùng `ListView.builder` hoặc `GridView.builder` cho list

### Cấm
- Hardcode màu hex trực tiếp trong widget (dùng AppTheme token)
- Dùng `print()` — dùng logger hoặc xóa trước khi commit
- Dùng `ListView(children: [...])` cho list > 5 item
- Dùng `Alert Dialog` cho thông báo đơn giản (dùng SnackBar)
- Đặt business logic trong `build()` method

---

## 3. Quy tắc viết code NestJS

### Bắt buộc
- Mọi endpoint cần auth → **phải có JwtAuthGuard**
- Dùng DTO + `class-validator` cho mọi input
- Trả về lỗi theo format: `{ statusCode, message, error }`
- Mọi ID là UUID string — không dùng integer id

### Cấm
- Logic nghiệp vụ trong Controller (để trong Service)
- Raw SQL (dùng Prisma query)
- Hardcode giá trị config (dùng `.env`)

---

## 4. Cơ chế tự học — Khi nào cập nhật docs

### Trigger tự động (AI tự nhận diện)
AI PHẢI đề xuất cập nhật docs khi phát hiện:

| Sự kiện | File cần cập nhật |
|---|---|
| User mô tả màu/font/spacing mới | `docs/UI_DESIGN_SYSTEM.md` |
| User mô tả flow/pattern UX mới | `docs/UX_PATTERNS.md` |
| Thêm endpoint API mới | `docs/CORE_FRAMEWORK.md` |
| Thêm/đổi DB table, column | `docs/DATABASE_SCHEMA.md` |
| Logic nghiệp vụ mới (rule, formula) | `docs/PROJECT_KNOWLEDGE.md` |
| Module mới được tạo | `docs/modules/_index.md` + `docs/modules/<name>.md` |
| Pattern code mới được xác nhận | `docs/AI_RULES.md` (section 5) |

### Cách đề xuất (cuối response)
```
---
📝 ĐỀ XUẤT CẬP NHẬT TÀI LIỆU
[X] docs/UI_DESIGN_SYSTEM.md — Thêm pattern: <mô tả ngắn>
[ ] docs/UX_PATTERNS.md — Thêm flow: <mô tả ngắn>
Gõ "lưu" để tôi cập nhật tự động.
---
```

---

## 5. Pattern đã xác nhận (Accumulated Knowledge)

> Section này được AI tự cập nhật sau khi user xác nhận một pattern mới.
> Format: `[Ngày xác nhận] Pattern — Nguồn`

[17/04/2026] Cuối mỗi session PHẢI cập nhật docs + roadmap + memory trước khi kết thúc — Xác nhận bởi user
[17/04/2026] Đầu mỗi session PHẢI đọc CLAUDE.md + toàn bộ docs theo thứ tự quy định — Xác nhận bởi user
[17/04/2026] Không tự ý làm bất cứ điều gì khi chưa được user đồng ý — Xác nhận bởi user
[17/04/2026] Không dùng thuật ngữ kỹ thuật tiếng Anh khi giao tiếp với user — Xác nhận bởi user
[17/04/2026] Luôn đề xuất trước, không hỏi ngược — Xác nhận bởi user
[17/04/2026] Deal flow diễn ra trong chat, không có nút "Yêu cầu nhận" riêng — Xác nhận bởi user
[17/04/2026] Không hoàn thành giai đoạn sau khi chưa xong giai đoạn trước trong roadmap — Xác nhận bởi user
[21/04/2026] Trước khi viết bất kỳ dòng code nào phải đánh giá rủi ro và liệt kê các callers/side effects bị ảnh hưởng — Xác nhận bởi user
[21/04/2026] Đánh giá dựa trên dữ liệu thực tế (grep/read file), không đoán hay suy luận khi chưa đủ cơ sở — Xác nhận bởi user
[21/04/2026] `cloudinary.config()` phải gọi ngay trước mỗi lần upload (method `configure()`), không gọi trong constructor NestJS service — Xác nhận qua fix thực tế
[21/04/2026] Trong NestJS controller phải dùng `BadRequestException` (từ `@nestjs/common`), không dùng `throw new Error()` — throw Error cho ra 500 thay vì 400 — Xác nhận qua fix thực tế
[21/04/2026] SnackBar phải show từ parent Scaffold, không show rồi Navigator.pop ngay — pop sẽ xóa Scaffold trước khi SnackBar kịp hiển thị — Xác nhận qua fix thực tế
[21/04/2026] Khi đổi return type của hàm API trong Flutter phải kiểm tra TẤT CẢ callers trước — Xác nhận bởi user (đã vi phạm, may chỉ có 1 caller)
[21/04/2026] Railway "Redeploy" dùng config cũ, KHÔNG nhận variable mới — muốn variable mới có hiệu lực phải push commit mới lên GitHub hoặc dùng "Apply X changes"
[21/04/2026] Railway Raw Editor: key=value KHÔNG được có dấu cách trước `=` (ví dụ `DEV_SECRET =value` sẽ tạo key `DEV_SECRET ` có space, không nhận được) — Xác nhận qua debug thực tế
[21/04/2026] Railway "Apply X changes" áp dụng TẤT CẢ pending changes kể cả xóa service — nếu có service deletion trong queue thì sẽ hiện Destructive Changes dialog, phải gõ tên service để confirm — đây là flow đúng, không cần Cancel
[21/04/2026] FCM token chỉ được lưu vào DB khi app đang chạy trên điện thoại thật + user đã đăng nhập + app đã build lại sau khi đổi server URL
[22/04/2026] NestJS Dockerfile: `npm install --ignore-scripts` trước, `COPY . .` rồi mới `npx prisma generate` — nếu prisma generate chạy trước COPY thì schema chưa có → build lỗi
[22/04/2026] NestJS compile ra `dist/src/main.js` (không phải `dist/main.js`) khi không có `rootDir` trong tsconfig — CMD phải là `node dist/src/main`
[22/04/2026] `.env.docker` phải gitignore nếu chứa FCM private key hoặc secrets thật — commit file mẫu không có secret vào git lần đầu là đủ
[24/04/2026] ADB screencap không được pipe qua PowerShell `>` redirect — PowerShell auto convert LF → CRLF làm corrupt PNG. Dùng `adb shell screencap -p /sdcard/x.png` rồi `adb pull` sang máy — Xác nhận qua fix thực tế
[24/04/2026] MSYS Git Bash tự convert đường dẫn Unix `/sdcard/...` thành `C:/Program Files/Git/sdcard/...` khi gọi adb. Fix: dùng PowerShell (không có path translation) hoặc set `MSYS_NO_PATHCONV=1` (chỉ ảnh hưởng destination path adb) — Xác nhận qua fix thực tế
[24/04/2026] Claude Code giới hạn ảnh ≤ 2000px mỗi chiều trong session có nhiều ảnh ("many-image threshold"). Screenshot Android 1240x2772 sẽ fail. Resize xuống 1600px max chiều dài bằng PowerShell System.Drawing HighQualityBicubic — lưu bản preview riêng, giữ file gốc cho Play Store
[24/04/2026] Flutter app không expose text qua uiautomator dump — toàn bộ UI hierarchy chỉ có `FlutterView`, không có text/content-desc. Để tap chính xác phải đọc source Dart (Expanded, EdgeInsets, Row flex) và tính tọa độ từ layout
[24/06/2026] Web phải nén ảnh client-side trước khi upload, mirror logic mobile (`app/lib/services/image_compress.dart`: resize 1920px, JPEG quality 80, skip nếu đã nhỏ <500KB) — web trước đây gửi thẳng ảnh gốc 2-6MB gây chờ ~5s khi đăng bài. Nén phải chạy ngay lúc CHỌN ảnh (`onFilesPicked`), trước check giới hạn 5MB — không phải lúc Submit, vì nén lúc Submit sẽ để limit 5MB reject ảnh gốc to trước khi kịp nén (mobile không có hard cap lúc chọn nên nén được mọi ảnh dù gốc to cỡ nào). Dùng `createImageBitmap(file, {imageOrientation:"from-image"})` để giữ đúng hướng ảnh chụp dọc từ điện thoại — Xác nhận qua fix thực tế + verify bằng Playwright thật (ảnh test 6MB giảm còn ~1.2MB, giữ đúng orientation)

---

## 6. Decision Log — Quyết định kiến trúc

> Ghi lại các quyết định quan trọng để AI không đề xuất lại phương án đã bị từ chối.

| Ngày | Quyết định | Lý do | Người xác nhận |
|---|---|---|---|
| 17/04/2026 | Deal flow diễn ra trong chat (deal card) | Trải nghiệm liền mạch hơn khi chat trực tiếp | user |
| 22/04/2026 | Nút "Tôi muốn nhận" được thêm lại vào chi tiết bài cho tặng | User cần CTA rõ ràng ngay trên màn hình chi tiết | user |
| 17/04/2026 | Roadmap phải theo mục tiêu vận hành, không phải logic kỹ thuật | User cần app vận hành được, không chỉ feature complete | user |
| 17/04/2026 | Không làm giai đoạn sau khi chưa xong giai đoạn trước | Đảm bảo chất lượng từng bước | user |
| 22/04/2026 | Chuyển toàn bộ hạ tầng sang Docker self-host (Railway + Cloudinary bỏ hẳn) | Tự chủ dữ liệu + tiết kiệm chi phí | user |
| 22/04/2026 | Giữ Firebase (FCM + Phone OTP) và Resend — không thay thế | FCM/APNs bắt buộc ở OS level; Resend deliverability tốt hơn Gmail SMTP | user |
| 22/04/2026 | CloudinaryService được refactor thành MinIO, giữ nguyên class name + interface | Không cần sửa callers (post.controller, user.controller) | code thực tế |

---

## 7. Quy tắc giao tiếp với user

### Đề xuất trước khi hỏi (BẮT BUỘC)
Khi gặp tình huống chưa rõ hoặc có nhiều lựa chọn, AI PHẢI:
1. Tự phân tích các phương án dựa trên code + docs thực tế
2. Đưa ra **đề xuất cụ thể** kèm lý do ngắn gọn
3. Hỏi user xác nhận — **không hỏi suông** kiểu "Bạn muốn làm gì?"

**Sai:** "Bạn muốn dùng approach nào?"
**Đúng:** "Tôi đề xuất làm X vì Y. Bạn đồng ý không?"

### Không hỏi lại ở mỗi bước nhỏ
- Khi user đã đồng ý hướng đi → tự làm đến cùng, không hỏi lại từng bước
- Chỉ dừng khi gặp rủi ro cao (xóa data, push code, thay đổi không rollback được)

---

## 8. Quy tắc khi gặp conflict

Khi có conflict giữa các nguồn:
1. **Code thực tế** > Tài liệu cũ
2. **User nói trực tiếp** > AI suy luận
3. **File docs mới hơn** > File docs cũ hơn
4. Khi không chắc → **hỏi user**, ghi rõ `[cần xác nhận]`

---

## 9. Tự làm trước khi bảo user làm

Mọi việc AI có thể tự làm được thì PHẢI tự làm — không được hướng dẫn user làm thay.

| Không được làm | Phải làm |
|---|---|
| "Bạn chạy lệnh `flutter run -d chrome`" | Tự chạy lệnh luôn |
| "Bạn tạo file X với nội dung..." | Tự tạo file luôn |
| "Bạn mở PowerShell và gõ..." | Tự chạy qua Bash tool |
| "Bạn thêm dòng này vào..." | Tự edit file luôn |

**Ngoại lệ** — chỉ hướng dẫn user khi:
- Cần quyền Admin / BIOS (AI không có quyền hệ thống)
- Cần thao tác vật lý (cắm dây, bấm nút máy)
- Cần tài khoản/credential của user (Railway, Firebase console...)
- Hành động có rủi ro cao cần user xác nhận trước

---

## 10. Khi user nói "làm X"

AI phải ngầm hiểu và thực hiện:

| User nói | AI ngầm hiểu thêm |
|---|---|
| "Tạo màn hình [X]" | + Xử lý 3 state + Pull-to-refresh + Consistent AppBar |
| "Thêm tính năng yêu thích" | + Optimistic UI + Rollback khi lỗi |
| "Làm form đăng bài" | + Inline validation + Disable submit khi loading + Giữ data khi back |
| "Thêm API [X]" | + DTO validation + JwtAuthGuard nếu cần auth + Prisma service |
| "Sửa UI [X]" | + Check UI_DESIGN_SYSTEM trước + Không hardcode màu |
