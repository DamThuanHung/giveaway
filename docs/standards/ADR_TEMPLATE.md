# ADR Template — Architecture Decision Records

> Format gốc: Michael Nygard, "Documenting Architecture Decisions" (2011).
> Mỗi quyết định kiến trúc/stack/pattern QUAN TRỌNG → 1 ADR file riêng.
> Lưu trong `docs/adr/NNNN-short-title.md`, NNNN bắt đầu từ 0001.

---

## Khi nào tạo ADR

ADR cần thiết khi quyết định:
- Stack ngôn ngữ / framework (Next.js vs Remix, Postgres vs MongoDB)
- Pattern kiến trúc (monolith vs microservice, event-driven vs request-response)
- Auth scheme (JWT vs session, OAuth provider)
- Deploy target (AWS vs self-host, Docker vs serverless)
- Storage strategy (S3 vs MinIO, CDN choice)
- Tích hợp third-party quan trọng (payment gateway, mail service)
- Compliance/security choice ảnh hưởng kiến trúc (GDPR, end-to-end encryption)
- Rejection của approach phổ biến (vd "không dùng Redis" — phải có ADR)

KHÔNG cần ADR cho:
- Đặt tên biến / file
- Lựa chọn lib utility nhỏ (lodash vs ramda)
- Config tinker (port, log level)
- UX flow detail (chọn modal vs page)

---

## Template

```markdown
# ADR-NNNN: <Tựa đề ngắn — Subject + Decision>

**Status:** Proposed | Accepted | Deprecated | Superseded by ADR-MMMM
**Date:** YYYY-MM-DD
**Decider(s):** Hoàng thượng (proposed by Thần)
**Tags:** stack, security, db, deploy, ...

## Context

Mô tả tình huống dẫn đến cần quyết định:
- Vấn đề gì cần giải quyết?
- Ràng buộc nào (technical, business, time, budget)?
- Forces nào tác động (vd: trade-off speed vs cost vs scalability)?

## Decision

Quyết định cụ thể, viết bằng động từ chủ động:
> "Dùng PostgreSQL 16 làm primary database."
> "KHÔNG dùng Redis cache trong giai đoạn MVP."

Liệt kê alternative đã xem xét và LÝ DO không chọn:
- Alternative A: vì sao loại
- Alternative B: vì sao loại
- Đã chọn X: vì sao

## Consequences

### Positive
- Lợi ích kỹ thuật/business cụ thể
- Capability mở ra

### Negative / Trade-offs
- Hạn chế đã chấp nhận
- Tech debt phát sinh
- Migration cost trong tương lai

### Mitigations
- Cách giảm thiểu các negative ở trên
- Trigger để revisit quyết định (vd: "khi DAU > 100k → review lại")

## Compliance check

- [ ] Có conflict với ADR cũ không? (link nếu có)
- [ ] Có ảnh hưởng SECURITY_BASELINE không?
- [ ] Có đụng compliance (GDPR, ngành) không?
- [ ] DR/backup có cần update?
```

---

## Vòng đời status

```
Proposed   → đang thảo luận, chưa thực thi
   ↓
Accepted   → đã thực thi, code base reflect
   ↓
Deprecated → không còn dùng nhưng lịch sử giữ nguyên
   ↓
Superseded → bị thay thế bởi ADR mới (link ADR mới)
```

KHÔNG sửa nội dung ADR đã Accepted. Nếu thay đổi → tạo ADR mới
"Supersedes ADR-NNNN".

---

## Ví dụ ADR-0001

```markdown
# ADR-0001: Dùng Next.js 14 App Router cho web

**Status:** Accepted
**Date:** 2026-05-08
**Decider(s):** Hoàng thượng
**Tags:** stack, web

## Context
Cần web cho marketing + SEO + landing. Yêu cầu:
- SEO tốt (sitemap, OG tag, schema.org)
- Static export được (host nginx, không cần Node runtime)
- Dev velocity cao

## Decision
Dùng Next.js 14 App Router với `output: 'export'` static.

Alternative đã loại:
- Remix: SEO ngon nhưng cần Node runtime → tăng infra cost
- Astro: nhẹ nhưng ecosystem React nhỏ, mất reusable component
- Pure HTML + Tailwind: dev velocity thấp, không reusable

## Consequences
### Positive
- Static HTML host nginx, free traffic qua Cloudflare CDN
- Reuse component giữa landing và app web

### Negative
- KHÔNG có ISR (Incremental Static Regeneration) — phải rebuild cron 1h
- Posts mới chỉ xuất hiện sau rebuild

### Mitigations
- Cron `web-rebuild.sh` chạy 1h → posts mới xuất hiện trong 1h
- Khi DAU > 10k hoặc post velocity > 1000/ngày → review lại, có thể migrate sang ISR runtime
```

---

## Folder structure

```
docs/adr/
├── README.md                          ← index ADRs (table)
├── 0001-stack-web.md
├── 0002-stack-backend.md
├── 0003-database-postgres.md
├── 0004-auth-jwt.md
├── 0005-deploy-aws-ec2.md
└── 0006-storage-minio.md
```

`README.md` của adr/ là bảng index:
```
| # | Title | Status | Date |
|---|---|---|---|
| 0001 | Stack web Next.js | Accepted | 2026-05-08 |
| 0002 | ... | ... | ... |
```
