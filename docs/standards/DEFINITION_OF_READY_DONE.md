# Definition of Ready & Definition of Done

> Scrum-style DoR/DoD, áp dụng cho mỗi feature/task.
> DoR = đủ điều kiện để bắt đầu code.
> DoD = đủ điều kiện để claim "done" (kết hợp với TEST_PROTOCOL.md).

---

## Definition of Ready (DoR)

Trước khi thần code 1 dòng, task PHẢI đạt:

### 1. Mục đích rõ
- [ ] Vấn đề user gặp là gì? (1 câu)
- [ ] Tại sao fix bây giờ, không phải sau? (1 câu)
- [ ] Acceptance criteria rõ ràng (3-5 bullet, observable)

### 2. Scope rõ
- [ ] Liệt kê những gì task NÀY làm
- [ ] Liệt kê những gì task này KHÔNG làm (tránh scope creep)
- [ ] Estimate effort thô (T-shirt size: XS/S/M/L/XL)

### 3. Phụ thuộc rõ
- [ ] Có chặn task khác không? Có bị task khác chặn không?
- [ ] Cần ADR mới không (xem `ADR_TEMPLATE.md`)?
- [ ] Cần update RISK_REGISTER không?
- [ ] Cần update SECURITY_BASELINE không?

### 4. Test plan rõ
- [ ] Mức test mục tiêu (theo TEST_PROTOCOL §2 — 1-5)
- [ ] Edge cases liệt kê (5+ items)
- [ ] Cách verify production sau deploy

Nếu **bất kỳ** mục trên trả lời "không rõ" → task **CHƯA Ready**. Phải clarify với hoàng thượng trước.

---

## Definition of Done (DoD)

Task chỉ được claim "done" khi đạt **TẤT CẢ**:

### Code quality
- [ ] Static check pass (typecheck/analyze/lint)
- [ ] No console.log / debugger / dead code
- [ ] Comment chỉ ở chỗ WHY non-obvious (không comment WHAT)
- [ ] Không hardcode secrets, magic number, magic string

### Test
- [ ] Đạt mức test mục tiêu (theo TEST_PROTOCOL §3)
- [ ] Edge cases trong DoR đều được test
- [ ] Production smoke test pass nếu có deploy (TEST_PROTOCOL §4)

### Documentation
- [ ] Code change ảnh hưởng kiến trúc → ADR mới hoặc update ADR cũ
- [ ] API change → update OpenAPI/spec
- [ ] User-facing change → update UI doc / release note

### Operational readiness
- [ ] Logs đủ để debug issue tương lai (không over-log PII)
- [ ] Metric/SLI mới (nếu có) đã hookup OBSERVABILITY
- [ ] Rollback plan đã test (revert commit + redeploy có work không?)
- [ ] Risk mới phát sinh → ghi vào RISK_REGISTER

### Security
- [ ] Input validation (boundary, type, length)
- [ ] Output sanitization (XSS, injection)
- [ ] Auth/authz check chính xác (đúng user mới được làm)
- [ ] Secrets không leak (log, error message, response)

### Compliance
- [ ] User data mới collect → cập nhật `COMPLIANCE.md` data inventory
- [ ] PII xử lý đúng (encryption at rest, deletion right)
- [ ] Cookie/tracking mới → consent banner

---

## DoR/DoD nhỏ vs lớn

Task nhỏ (XS/S — bug fix < 1h, label change, copy edit):
- DoR: bỏ qua test plan chi tiết, chỉ cần acceptance criteria
- DoD: bỏ qua ADR, OpenAPI, RISK_REGISTER

Task vừa (M — feature local đơn lẻ < 1 ngày):
- Apply đầy đủ DoR
- DoD: skip nếu không đụng kiến trúc/security/compliance

Task lớn (L/XL — feature cross-service, schema change, deploy production):
- Apply 100% DoR + DoD
- Bắt buộc ADR + Risk update + Production smoke test

---

## Estimation framework

T-shirt size:
| Size | Effort | Test mức |
|---|---|---|
| XS | < 30 phút | 2 (mental) |
| S | 30 phút - 2h | 3 (integration) |
| M | 2h - 1 ngày | 4 (E2E local) |
| L | 1-3 ngày | 5 (production smoke) |
| XL | > 3 ngày | 5 + chia nhỏ thành L |

Nếu thần estimate XL → **CHIA NHỎ** trước khi code. Task >3 ngày = scope mơ hồ.

---

## Anti-patterns

| Pattern sai | Pattern đúng |
|---|---|
| "Đã code xong" = "Done" | Chỉ Done khi qua đủ DoD |
| Skip DoR vì "task đơn giản" | Vẫn check 4 mục DoR (mất 2 phút) |
| Edit ADR cũ thay vì tạo Superseded | Bất biến — quyết định cũ giữ nguyên lịch sử |
| Estimate "không biết" | Force estimate T-shirt — phỏng đoán còn hơn không có anchor |
| Production smoke test "sau" | Không có "sau" — production smoke trong Done hoặc không Done |
