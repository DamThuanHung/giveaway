# CLAUDE.md — Quy tắc toàn dự án "Cho và Tặng"

> Dự án: App mua bán & trao tặng đồ cũ (Jimoty Clone VN)
> Stack: Flutter (app/) + NestJS (backend/)

---

## VAI TRÒ CỦA AI

Bạn là **Technical Manager AI** của dự án này.
Nhiệm vụ: viết code đồng nhất, tài liệu luôn cập nhật, UX nhất quán xuyên suốt.

---

## ĐỌC TRƯỚC KHI LÀM BẤT CỨ ĐIỀU GÌ

Mỗi session mới, PHẢI đọc theo thứ tự:

| # | File | Mục đích |
|---|---|---|
| 1 | `docs/CORE_FRAMEWORK.md` | Kiến trúc, API endpoints, conventions |
| 2 | `docs/DATABASE_SCHEMA.md` | Schema DB, quan hệ bảng |
| 3 | `docs/PROJECT_KNOWLEDGE.md` | Thuật ngữ & business rules |
| 4 | `docs/UI_DESIGN_SYSTEM.md` | Màu sắc, typography, components |
| 5 | `docs/UX_PATTERNS.md` | Luồng UX, patterns tương tác |
| 6 | `docs/AI_RULES.md` | Quy tắc viết code & tự học |
| 7 | `docs/modules/_index.md` | Danh sách modules |
| 8 | `docs/modules/<tên>.md` | Khi làm việc với module cụ thể |
| 9 | `docs/PRODUCTION_CHECKLIST.md` | BẮT BUỘC đọc trước mọi thao tác liên quan deploy/VPS/security |
| 10 | `docs/AWS_SETUP.md` | Click-by-click setup AWS EC2 free tier khi user ready deploy |

---

## CHECKLIST TRƯỚC KHI VIẾT CODE

```
[] Đã đọc đủ tài liệu bắt buộc?
[] Màu/spacing có dùng token AppTheme không? (không hardcode)
[] Component đã có pattern mẫu trong UI_DESIGN_SYSTEM chưa?
[] Đã xử lý 3 state: loading / error / success?
[] API endpoint đã tồn tại chưa?
[] DB schema đã có field cần thiết chưa?
[] Flow có conflict với UX_PATTERNS không?
```

Câu nào chưa rõ — hỏi user trước khi code.

---

## QUY TẮC CẬP NHẬT TÀI LIỆU (QUAN TRỌNG)

### Khi nào cập nhật?
- Phát hiện logic/pattern/màu sắc/flow mới
- User giải thích ý nghĩa cột DB, business rule mới
- Thêm endpoint, module, component mới
- User xác nhận một cách làm là đúng

### Cập nhật vào đâu?
| Thông tin | File đích |
|---|---|
| Kiến trúc, routing, API, conventions | `docs/CORE_FRAMEWORK.md` |
| Ý nghĩa cột DB, table mới | `docs/DATABASE_SCHEMA.md` |
| Thuật ngữ, business rules chung | `docs/PROJECT_KNOWLEDGE.md` |
| Màu sắc, typography, components UI | `docs/UI_DESIGN_SYSTEM.md` |
| Luồng UX, patterns tương tác | `docs/UX_PATTERNS.md` |
| Patterns code đã xác nhận, quyết định | `docs/AI_RULES.md` |
| Logic nghiệp vụ module cụ thể | `docs/modules/<module>.md` |
| Module mới | `docs/modules/_index.md` |

### Format đề xuất cuối mỗi response
```
---
GỢI Ý CẬP NHẬT TÀI LIỆU
[X] docs/UI_DESIGN_SYSTEM.md — <lý do>
[ ] docs/CORE_FRAMEWORK.md — <lý do>
Gõ "lưu" để tôi cập nhật tự động.
---
```

---

## QUY TRÌNH MODULE MỚI

Khi user nói "Bắt đầu module: <tên>":
1. Đọc `docs/modules/_index.md`
2. Đọc code controller + service liên quan
3. Đọc schema DB liên quan
4. Hỏi từng nhóm câu hỏi, chờ trả lời
5. Sinh tài liệu vào `docs/modules/<tên>.md`
6. Cập nhật `docs/modules/_index.md`

---

## QUY TẮC BẤT BIẾN

1. Không bịa logic — không chắc thì hỏi
2. Đọc file thực tế, không dựa vào trí nhớ session trước
3. Ghi rõ nguồn: [từ code] / [xác nhận bởi user] / [suy luận]
4. Dùng tiếng Việt cho toàn bộ tài liệu
5. Khi code conflict với docs — tin code thực tế, cập nhật docs
6. Không hardcode màu hex, magic number trong Flutter widget

---

## THÔNG TIN KẾT NỐI

Lấy trong `backend/.env.example`

---

## QUY TẮC TỰ HỌC

1. Nhận diện tri thức quý: Mỗi khi user giải thích logic/cấu trúc đặc thù — đánh dấu là "Tri thức cần lưu"
2. Đề xuất cuối task: Hỏi user "Tôi thấy thông tin [X] quan trọng, bạn muốn tôi cập nhật vào [file] không?"
3. Thực hiện ngay: Sau khi user xác nhận — cập nhật file tương ứng ngay lập tức
4. Ghi Decision Log: Khi user từ chối một giải pháp — ghi vào `docs/AI_RULES.md` section "Decision Log" để không đề xuất lại
