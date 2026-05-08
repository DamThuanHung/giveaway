---
description: Append risk mới vào docs/RISK_REGISTER.md (live document)
---

Append entry mới vào `docs/RISK_REGISTER.md` theo format
`docs/standards/RISK_REGISTER.md` template.

Steps:
1. Đọc file hiện tại, lấy ID cao nhất, +1 (vd R-007 → R-008).
2. Tạo entry với:
   - Risk ID
   - Description (từ user input)
   - Probability (1-5) + lý do
   - Impact (1-5) + lý do
   - Score = P × I
   - Color (green/yellow/orange/red theo score)
   - Owner: hoàng thượng / thần / vendor
   - Status: Open
   - Mitigation plan (hỏi user nếu chưa rõ)
   - Trigger to revisit
   - Date logged: today
3. Append vào section Open risks.
4. Nếu file chưa tồn tại → tạo từ template trong `docs/standards/RISK_REGISTER.md`
   với 10 risk starter (§6 template).

User input: $ARGUMENTS

Bắt buộc trước khi save:
- Probability/Impact phải có lý do justify, không random number
- Mitigation plan phải SMART (specific, measurable, achievable, relevant, time-bound)
- Score Red (16-25) → require immediate action plan, không Accept
