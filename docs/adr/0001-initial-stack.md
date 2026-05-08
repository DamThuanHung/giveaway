# ADR-0001: Stack initial — Flutter + NestJS + Next.js + Postgres

**Status:** Accepted (backfill)
**Date:** 2026-05-08 (decision originally made ~2026-03)
**Decider(s):** Hoàng thượng
**Tags:** stack, mobile, backend, web

## Context

Trao Tay là marketplace C2C đồ cũ + trao tặng tại Việt Nam, target user
nuôi mobile-first habit (Android > iOS dominance VN). Cần:
- Mobile native UX cao (chat, camera, notification, offline-friendly)
- Web cho SEO + landing + share link
- Backend scale tới 10k DAU năm 1
- Solo dev: stack ecosystem mature, đỡ phải tự build infra

## Decision

**Mobile:** Flutter (Android trước, iOS sau).
**Backend:** NestJS + Prisma + PostgreSQL 16.
**Web:** Next.js 14 App Router với `output: 'export'` (static).
**Deploy:** Docker Compose self-host trên AWS EC2 Singapore (xem ADR-0002).

Alternative đã loại:
- React Native: ecosystem mature nhưng UI bridge có quirk; Flutter dev velocity cao hơn
- Express + Sequelize: viết nhiều code boilerplate; NestJS DI + decorator clean hơn
- Remix: SEO ngon nhưng cần Node runtime → tăng infra cost; static export Next.js host nginx free
- Firebase backend: lock-in cao; self-host Postgres portable

## Consequences

### Positive
- 1 codebase mobile cross-platform
- TypeScript end-to-end (NestJS + Next.js)
- Prisma schema-first → DB introspection auto
- Static export web → nginx free, không cần Node runtime production

### Negative / Trade-offs
- Flutter: Dart không phổ biến bằng JS → tuyển dev khó nếu scale team
- iOS: cần Mac/Codemagic CI cho build → hoãn iOS đến sau Closed Testing
- Static export Next.js: posts mới appear sau rebuild cron 1h (không real-time)

### Mitigations
- Solo+AI hiện tại không cần thuê dev → Dart không vấn đề
- iOS: đã có plan Codemagic CI cloud Mac
- Cron `web-rebuild.sh` 1h đủ cho stage hiện tại (post velocity thấp)
- Khi DAU > 10k → review migrate Next.js sang ISR runtime

## Compliance check

- [x] Conflict ADR cũ: KHÔNG (đây là ADR đầu)
- [x] SECURITY_BASELINE: tuân thủ — bcrypt password, JWT auth, parameterized query Prisma
- [x] COMPLIANCE: GDPR baseline OK, data inventory document
- [x] DR: backup strategy 3-2-1 implemented (xem ADR-0002)
