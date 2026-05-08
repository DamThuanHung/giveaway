# Inception Deck — 10 câu hỏi khởi đầu

> Phỏng theo "The Agile Samurai" (Jonathan Rasmusson) + ThoughtWorks
> Inception. Trả lời 10 câu này trong buổi 1 = 80% rủi ro mơ hồ scope
> được loại bỏ.

---

## Phần A — Why (5 câu định hướng)

### Câu 1: Why are we here?
- Vấn đề gì mà dự án này giải quyết?
- Ai đang chịu vấn đề đó? Hiện họ giải quyết bằng cách nào (workaround)?
- Nếu không làm dự án này, hậu quả gì?

### Câu 2: Elevator Pitch
Điền vào template:
```
Dành cho [target customer]
Người [statement of need or opportunity]
[Tên dự án] là một [product category]
Cho phép [key benefit, compelling reason to buy]
Khác với [primary competitive alternative]
[Tên dự án] có ưu thế [primary differentiation]
```

### Câu 3: Product Box
Tự thiết kế "vỏ hộp" bán dự án này — bao gồm:
- Tên + slogan
- 3 lý do mua (top features)
- Hình minh họa key benefit (mô tả bằng chữ)

### Câu 4: NOT list
Liệt kê những gì dự án **CỐ TÌNH KHÔNG** làm:
- Feature scope sau MVP (defer)
- User segment không target
- Use case không support

### Câu 5: Meet the neighbors
Ai là stakeholder/dependency ngoài team:
- API/service bên thứ ba (payment, mail, push, map, ...)
- Tài khoản/license cần mua
- Người duyệt (admin, legal, compliance)

---

## Phần B — How (5 câu thực thi)

### Câu 6: Solution sketch
Vẽ kiến trúc cao tầng (text):
```
[Mobile/Web] → [API Gateway] → [Backend services]
                                   ↓
                              [Database]
                                   ↓
                              [Storage / Cache / Queue]
```
- Chú thích lý do chọn từng layer
- Ghi nguồn data (đến từ đâu)
- Ghi điểm tích hợp với "neighbors" ở câu 5

### Câu 7: What keeps us up at night?
Liệt kê 5+ rủi ro kỹ thuật + business:
| ID | Risk | Probability | Impact | Trạng thái |
|---|---|---|---|---|
| R1 | | H/M/L | H/M/L | Open/Mitigating/Closed |

→ Pipe vào `RISK_REGISTER.md` ngay

### Câu 8: Size it up
Estimate thô:
- Time to MVP: ?
- Time to beta: ?
- Time to GA: ?
- 3 việc lớn nhất tốn thời gian (top 3 cost centers)

### Câu 9: Trade-offs (the four levers)
Trong 4 yếu tố Time / Scope / Budget / Quality, **chọn 1 cố định và 1 nhân nhượng**:
- Cố định: ?
- Nhân nhượng: ?

Ví dụ: "Quality cố định, Scope nhân nhượng" = sẵn sàng cắt feature để giữ chất lượng.

### Câu 10: What's it gonna take?
- Tài nguyên cần: server, license, third-party, design, kiến thức
- Thời gian dedicated mỗi tuần
- Điểm khẩn cấp deadline (nếu có)
- Định nghĩa "thành công" buổi 1: 3 metric đầu

---

## Output sau Inception

Lưu thành `docs/PROJECT_BRIEFING.md` với 10 phần tương ứng. File này là
**single source of truth** về tại sao dự án tồn tại — quay lại đọc khi
phân vân scope.

Cập nhật khi:
- Pivot business model
- Đổi target customer
- Cắt/thêm scope >20%

---

## Anti-pattern khi làm Inception

- Lý thuyết suông, không decide → đáp số bị mơ hồ
- Trả lời "chưa biết" cho >3 câu → chưa sẵn sàng start, dừng lại research
- Skip Risk register (câu 7) → 90% dự án thất bại vì rủi ro không identify sớm
- Không update khi pivot → stale doc, vô dụng
