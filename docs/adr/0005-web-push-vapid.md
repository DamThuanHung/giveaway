# ADR-0005: Web Push notification — VAPID + Service Worker

**Status:** Accepted
**Date:** 2026-05-07
**Decider(s):** Hoàng thượng
**Tags:** notification, web, push

## Context

Mobile app đã có FCM push (Firebase). Web user (chiếm ~30% traffic) hiện
KHÔNG có push → user phải mở tab mới biết tin nhắn/đánh giá/bump xong.

Yêu cầu:
- Notify user web realtime (chat message, review, bump done, keyword match)
- Cross-browser: Chrome/Edge/Firefox desktop + Android, Safari macOS 16+, Safari iOS 16.4+ PWA
- Không lock-in vendor

## Decision

**Web Push API + VAPID protocol** (W3C standard, vendor-neutral).

Components:
- Backend: `WebPushService` với `web-push` npm lib, sign payload với VAPID private key
- Database: model `WebPushSubscription` (userId + endpoint + p256dh + auth + userAgent)
- Frontend: service worker `/sw.js` xử lý `push` + `notificationclick` events
- UI: `WebPushToggle` component — 4 status (unsupported/denied/subscribed/default)
- Integration: `NotificationService.createNotification` gọi `webPush.sendToUser` parallel với FCM

Alternative đã loại:
- OneSignal/Pusher: vendor lock-in + cost; VAPID protocol portable
- Firebase Cloud Messaging cho web: tied tới Firebase ecosystem; muốn separate web khỏi mobile FCM

## Consequences

### Positive
- Vendor-neutral: VAPID là W3C standard, push service Mozilla/Google free
- Cross-browser support rộng (kể cả Safari iOS PWA)
- Tích hợp parallel với FCM mobile → mobile + web user cùng nhận push
- Tự host push subscription DB → không phụ thuộc third-party

### Negative
- Safari iOS giới hạn: chỉ work khi user "Add to Home Screen" (PWA mode)
- Service worker complexity: cache management, version migration
- Subscription expiration: phải handle 410 Gone từ push service → prune DB

### Mitigations
- UI clearly explain Safari iOS requirement (Add to Home Screen)
- WebPushService auto-prune subscription on 410/404 error
- TTL 24h cho push payload → push service không hold quá lâu

## Sự cố deploy 2026-05-08

Schema mới `WebPushSubscription` quên migrate prod DB → mọi tin nhắn
chat fail (Prisma throw P2021) → UI báo "Gửi không kịp". Bug ngầm 1 ngày.

→ Fix: chạy `prisma db push` + restart backend.
→ Postmortem: `docs/postmortems/2026-05-08-web-push-schema-miss.md`
→ Rule mới: hook `check-schema-adr.sh` block commit schema không kèm ADR.

## Compliance check

- [x] SECURITY_BASELINE: VAPID private key qua AWS Secrets Manager-ready (hiện tại env file 600 perms)
- [x] COMPLIANCE: PII trong subscription = endpoint URL (không sensitive); user consent qua Permission API
- [x] OBSERVABILITY: log success/failed/pruned counts mỗi push batch

## Trigger to revisit
- Push delivery rate < 95% (notification.service log monitor)
- VAPID key compromised → rotate
- iOS native PWA support đủ tốt → consider deprecate FCM mobile cho user web-PWA
