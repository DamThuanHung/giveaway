# ADR-0002: Deploy AWS EC2 Singapore + Cloudflare Proxied

**Status:** Accepted (backfill)
**Date:** 2026-05-08 (deployed 2026-04-26)
**Decider(s):** Hoàng thượng
**Tags:** deploy, infra, cdn, aws

## Context

Cần deploy production cho `traotay.com.vn`. Yêu cầu:
- Tự chủ hạ tầng (không lock-in PaaS)
- Latency thấp cho user VN
- Cost minimal pre-revenue
- SSL + custom domain
- Backup + DR

## Decision

**Compute:** AWS EC2 t3.micro (Free Tier 12 tháng đầu) tại Singapore (ap-southeast-1).
**DNS + CDN:** Cloudflare free plan, 4 records Proxied (root, www, api, s3).
**SSL:** Let's Encrypt 1 cert single SAN cho 4 subdomain.
**Containers:** Docker Compose self-host (Postgres + MinIO + backend).
**Backup:** 3-2-1 rule với Backblaze B2 offsite.

Alternative đã loại:
- Railway/Render: rẻ nhưng cost tăng nhanh khi DAU > 1k; lock-in
- AWS ECS Fargate: managed nhưng Free Tier limit nhỏ; Docker Compose self-host portable hơn
- Vultr/DigitalOcean Singapore: tương đương AWS nhưng ecosystem AWS rộng hơn (RDS, S3 fallback)
- Cloudflare Pages: web tốt nhưng không support backend/storage

## Consequences

### Positive
- Free Tier 12 tháng → cost ~$0/m năm 1
- Cloudflare CDN edge NRT (Tokyo) → latency VN tốt
- 1 EC2 instance dùng cho cả 3 service (backend + DB + storage) → manageable
- Single Let's Encrypt cert 4 SAN → quản lý đơn giản

### Negative
- Single instance = single point of failure (R-T01 trong RISK_REGISTER)
- Self-host Postgres → trách nhiệm backup + restore + tuning
- t3.micro 1GB RAM → bottleneck khi DAU > 1k
- Cloudflare Proxied bypass Certbot → cần config nginx real_ip + acme challenge whitelist

### Mitigations
- Backup 3-2-1 (local + B2 offsite) → recovery RTO < 4h
- Monitor uptime qua UptimeRobot 5 phút interval
- Pre-trigger upgrade infra: scale up t3.small khi DAU > 500
- Multi-AZ deploy khi DAU > 5k

### Trigger to revisit
- Monthly cost > $20 (sau Free Tier hết 2027-04)
- DAU > 1k
- Performance bottleneck (p95 latency > 1s)

## Compliance check

- [x] SECURITY_BASELINE: TLS 1.3 + helmet headers + HSTS preload
- [x] COMPLIANCE: data location Singapore (gần VN, OK GDPR transfer nếu cần EU user)
- [x] DR: backup test pending (drill scheduled Q3 2026)
- [x] OBSERVABILITY: UptimeRobot monitoring, CloudWatch logs
