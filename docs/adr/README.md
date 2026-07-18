# Architecture Decision Records — Trao Tay

Index ADRs theo chronological order. Format: Michael Nygard.
Xem `docs/standards/ADR_TEMPLATE.md` cho template chi tiết.

## Index

| # | Title | Status | Date |
|---|---|---|---|
| 0001 | [Stack initial — Flutter + NestJS + Next.js + Postgres](0001-initial-stack.md) | Accepted (backfill) | 2026-05-08 |
| 0002 | [Deploy AWS EC2 Singapore + Cloudflare Proxied](0002-deploy-aws-cloudflare.md) | Accepted (backfill) | 2026-05-08 |
| 0003 | [Storage MinIO self-host vs S3](0003-storage-minio-selfhost.md) | Accepted (backfill) | 2026-05-08 |
| 0004 | [Design System v2 — Vietnamese Warm Minimal](0004-design-system-v2-warm-minimal.md) | Accepted (backfill) | 2026-05-08 |
| 0005 | [Web Push notification — VAPID + Service Worker](0005-web-push-vapid.md) | Accepted | 2026-05-07 |
| 0006 | [Post sort 3 tầng — VIP > Plus > Standard tuyệt đối](0006-post-sort-tier-absolute.md) | Accepted | 2026-05-08 |
| 0007 | [Defer Dark Mode tới Stage 2 GA](0007-defer-dark-mode.md) | Accepted | 2026-05-08 |
| 0008 | [Defer Atomic Design folder refactor tới >30 reusable components](0008-defer-atomic-design-refactor.md) | Accepted | 2026-05-08 |
| 0009 | [Defer Usability Testing 5-user tới Stage 2 + Recruit Strategy](0009-defer-usability-testing-5-user.md) | Accepted | 2026-05-08 |
| 0010 | [PostView aggregate theo ngày — Top bài lượt xem theo period](0010-postview-aggregate-table.md) | Accepted | 2026-05-08 |
| 0011 | [Post.status DB-level CHECK constraint](0011-post-status-db-constraint.md) | Accepted | 2026-05-23 |
| 0012 | [AppDownloadLog: bảng tracking lượt tải app](0012-app-download-tracking-table.md) | Accepted | 2026-05-24 |
| 0013 | [Migration tổng hợp đóng băng schema drift + thêm User.lastActiveAt](0013-sync-schema-drift-last-active-at.md) | Accepted | 2026-06-25 |
| 0014 | [Lưu OAuth token TikTok trong Postgres (TiktokCredential), 1 row duy nhất](0014-tiktok-credential-storage.md) | Proposed | 2026-06-29 |
| 0015 | [DacDinhAttempt: bảng tracking kết quả làm bài /dac-dinh](0015-dac-dinh-attempt-tracking.md) | Accepted | 2026-07-17 |
| 0016 | [Sửa lỗi thiết kế thống kê /dac-dinh: DacDinhPresence + xếp hạng theo dạng bài](0016-dac-dinh-presence-and-leaderboard-fix.md) | Accepted | 2026-07-17 |

## Workflow tạo ADR mới

```bash
# Slash command (recommended)
/adr <tựa đề>

# Hoặc manual: copy template
cp docs/standards/ADR_TEMPLATE.md docs/adr/0007-<slug>.md
```

Số ADR tăng dần, KHÔNG tái sử dụng số.

## Status lifecycle

```
Proposed → Accepted → Deprecated → Superseded by ADR-XXXX
```

KHÔNG sửa nội dung ADR đã Accepted. Đổi quyết định → tạo ADR mới
"Supersedes ADR-NNNN".
