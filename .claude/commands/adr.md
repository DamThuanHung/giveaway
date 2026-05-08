---
description: Tạo Architecture Decision Record mới với numbering tự động trong docs/adr/
---

Tạo file ADR mới theo format Michael Nygard tại `docs/adr/NNNN-<slug>.md`.

Steps:
1. List `docs/adr/` xem ADR cao nhất hiện tại (vd `0007-...`).
2. Number kế tiếp = highest + 1, padding 4 chữ số.
3. Slug từ tựa đề user cung cấp: lowercase, dash-separated, không dấu.
4. Tạo file với template từ `docs/standards/ADR_TEMPLATE.md`:
   - Status: Proposed
   - Date: today
   - Decider: Hoàng thượng
   - Context / Decision / Consequences sections sẵn để fill
5. Nếu chưa có `docs/adr/README.md` → tạo, kèm bảng index.
6. Append entry vào `docs/adr/README.md`.

User input: $ARGUMENTS

Sau khi tạo:
- Show path file mới
- Nhắc user fill Context + Decision + Consequences
- Sau khi user fill, đổi Status: Accepted, commit kèm change kiến trúc
