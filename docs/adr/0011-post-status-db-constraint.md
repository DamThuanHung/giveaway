# ADR-0011: Post.status DB-level CHECK constraint

**Date:** 2026-05-23  
**Status:** Accepted  
**Deciders:** hungdam (Technical Manager AI)

---

## Bối cảnh

`Post.status` trong schema Prisma là `String @default("available")`. Không có ràng buộc DB-level nào đảm bảo giá trị hợp lệ. Code dùng 6 trạng thái (available / reserved / done / hidden / archived / deleted_by_admin), nhưng admin hoặc direct-DB có thể set giá trị tùy ý → frontend crash khi gặp status không nhận dạng được.

Phát hiện trong AUDIT_REPORT_2026-05-22 — CRITICAL #2.

---

## Quyết định

Thêm PostgreSQL CHECK constraint vào cột `Post.status`:

```sql
ALTER TABLE "Post"
  ADD CONSTRAINT "Post_status_valid"
  CHECK (status IN ('available', 'reserved', 'done', 'hidden', 'archived', 'deleted_by_admin'));
```

Giữ `String` type trong Prisma schema (không chuyển sang enum) để tránh migration phức tạp khi cần thêm status mới.

---

## Hệ quả

**Tốt:**
- DB tự reject insert/update với status không hợp lệ — defense-in-depth bên dưới application layer
- Không cần thay đổi code application hay Prisma schema
- Nhẹ nhàng hơn PostgreSQL enum (không cần `ALTER TYPE` khi thêm status mới — chỉ cần update constraint)

**Trade-off:**
- Prisma không generate constraint này qua schema DSL → phải giữ qua raw migration SQL
- Nếu cần thêm status mới: `ALTER TABLE "Post" DROP CONSTRAINT "Post_status_valid"` rồi `ADD CONSTRAINT` lại với list mới

---

## Alternatives đã xem xét

- **PostgreSQL enum type:** Type-safe hơn nhưng `ALTER TYPE ADD VALUE` không thể rollback trong transaction → rủi ro migration production
- **Application-only validation:** Đã có (`VALID_POST_STATUSES` array) nhưng không ngăn được direct-DB manipulation
