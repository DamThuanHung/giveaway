# ADR-0003: Storage MinIO self-host vs S3

**Status:** Accepted (backfill)
**Date:** 2026-05-08 (deployed 2026-04-26)
**Decider(s):** Hoàng thượng
**Tags:** storage, infra, cost

## Context

Marketplace cần object storage cho ảnh post + avatar. Volume estimate:
- 1k user × 10 ảnh/user × 500KB = 5GB
- 10k user → 50GB
- 100k user → 500GB

Cost AWS S3 Singapore: ~$0.025/GB-month + egress $0.09/GB.

## Decision

Self-host **MinIO** trong cùng EC2 instance với backend, dùng EBS gp3 30GB.
Backup MinIO data → Backblaze B2 daily incremental.

S3-compatible API → backend code tương thích với S3 nếu cần migrate sau.

Alternative đã loại:
- AWS S3: cost tăng linear với volume; egress fee cao khi user fetch ảnh
- Cloudflare R2: zero egress fee nhưng 10GB free tier nhỏ; lock-in
- Backblaze B2 trực tiếp serve: latency cao (US West) → ảnh load chậm

## Consequences

### Positive
- Cost gần như $0 cho stage hiện tại (chỉ EBS + bandwidth EC2)
- S3 API → migrate sang S3/R2 sau dễ (chỉ đổi endpoint + credentials)
- CF cache edge cho `*.jpg/png/webp` TTL 7 ngày → giảm tải MinIO 90%

### Negative
- EBS 30GB = limit volume (~30k post avg)
- MinIO security: phải rotate root key, IAM user least-privilege
- Single instance = ảnh down nếu EC2 down

### Mitigations
- Lifecycle policy: ảnh > 1 năm + post status=done → archive lên B2 cheap tier
- Pre-trigger upgrade: thêm EBS lên 100GB khi 80% full
- Migrate sang S3/R2 khi volume > 200GB (cost crossover)
- Rotation 6 tháng: MinIO root + IAM user keys

### Security (rotated 2026-04-29)
- `MINIO_ROOT_USER` random `root_<16hex>` không phải `minioadmin` default
- Backend dùng IAM user `traotay_<12hex>` với policy `traotay-rw` (chỉ s3:GetObject/PutObject/DeleteObject + ListBucket trên `arn:aws:s3:::traotay`)
- KHÔNG dùng root key trong backend env

## Trigger to revisit
- Volume > 200GB
- DAU > 10k (cost MinIO bandwidth bottleneck)
- Multi-region deploy cần
