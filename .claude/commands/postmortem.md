---
description: Tạo postmortem blameless mới sau sự cố production trong docs/postmortems/
---

Tạo file postmortem theo format Google SRE blameless tại
`docs/postmortems/YYYY-MM-DD-<slug>.md`.

Steps:
1. Date = today (format YYYY-MM-DD)
2. Slug từ tựa đề ngắn user cung cấp
3. Tạo file với template từ `docs/standards/INCIDENT_RUNBOOK.md` §4:
   - Date of incident, postmortem, severity (hỏi user nếu chưa rõ)
   - Summary 1-2 câu
   - Impact
   - Timeline UTC
   - Root cause (system gap, KHÔNG blame person)
   - What went well / wrong
   - Action items SMART với owner + deadline
   - Lessons learned
4. Nếu chưa có `docs/postmortems/README.md` → tạo, kèm bảng index.
5. Append entry vào index.

User input: $ARGUMENTS

Sau khi tạo, hỏi user 5 câu để fill postmortem:
1. Detect lúc nào (UTC)?
2. Severity (SEV-1/2/3/4)?
3. Bao nhiêu user ảnh hưởng?
4. Root cause technical (system gap, không person)?
5. 3 action items để prevent lặp lại?

KHÔNG kết thúc cho đến khi action items có owner + deadline cụ thể.
