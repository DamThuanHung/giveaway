# Module: Bump — Đẩy bài 3 tier (Free/Plus/VIP)

Module thanh toán QR VietQR qua PayOS để boost bài lên đầu danh sách. Có 3 tier với độ ưu tiên và hiệu ứng UI khác nhau.

---

## File liên quan

**Backend:**
- `backend/src/bump/bump.module.ts` — NestJS module
- `backend/src/bump/bump.controller.ts` — REST endpoints
- `backend/src/bump/bump.service.ts` — logic PayOS + DB
- `backend/src/bump/bump.cron.ts` — cron reset expired boosts

**Flutter:**
- `app/lib/screens/post/bump_package_screen.dart` — chọn gói + WebView PayOS
- `app/lib/screens/post/my_posts_screen.dart` — nút Đẩy + viền/badge theo tier
- `app/lib/models/post.dart` — `effectiveTier`, `isBoosted`, `bumpCountdown`
- `app/lib/widgets/post_card.dart` — hiệu ứng hiển thị theo tier

---

## Gói (package) cố định

Định nghĩa tại `bump.service.ts:5-8` — `BUMP_PACKAGES`:

| Key | Tier | Giá (VND) | Duration | Label |
|---|---|---|---|---|
| `plus_3d` | 2 | 5,000 | 3 ngày (72h) | Plus 3 ngày |
| `vip_7d` | 3 | 15,000 | 7 ngày (168h) | VIP 7 ngày |

Tier 1 (Free 24h) không đi qua module này — dùng `POST /post/:id/bump`.

---

## Luồng thanh toán (Tier 2/3)

1. **App** gọi `POST /bump/:postId/order` với `{ package: "plus_3d" | "vip_7d" }`
2. **Backend** `createOrder`:
   - Verify post thuộc về user
   - Huỷ các `BumpOrder` pending cũ của cùng post
   - Sinh `orderCode` random, gọi PayOS `paymentRequests.create` với `returnUrl` + `cancelUrl` trỏ về `${PUBLIC_URL}/bump/{return|cancel}?postId=`
   - Lưu `BumpOrder` status `pending`, trả `{ orderId, checkoutUrl, qrCode, amount, package }`
3. **App** mở `PayOSWebView` vào `checkoutUrl`, user quét QR thanh toán trên app ngân hàng
4. **PayOS** POST webhook → `POST /bump/webhook`:
   - `webhooks.verify(body)` — verify HMAC SHA256 bằng `PAYOS_CHECKSUM_KEY`
   - Check `data.code === '00'` (thành công)
   - **Verify `data.amount === order.amount`** — chống mismatch (không match → log error, trả `{ ok: false }`)
   - Transaction: `BumpOrder.status = 'paid' + expiredAt` và `Post.boostTier + bumpedAt`
   - `logger.log` kèm orderCode/postId/tier/amount để ops trace
5. **PayOS** redirect user browser về `returnUrl` → backend redirect `traotay://bump/success?postId=` → Flutter WebView bắt URL, `Navigator.pop(true)`
6. **App** show dialog "Đang xác nhận thanh toán..." → **polling `getBoostStatus` mỗi 1s tối đa 6 lần** (webhook có thể chậm hơn redirect vài giây). Chỉ báo "Đã kích hoạt" khi `boostTier > 0` thật. Timeout → hiện message gợi ý kéo refresh.

**Quan trọng:**
- WebView bắt URL `/bump/return` và `/bump/cancel` **TRƯỚC** khi backend redirect deep link, để không bị ngrok interstitial chặn
- **KHÔNG bao giờ báo success chỉ dựa trên returnUrl** — phải verify DB đã ghi `boostTier` qua polling. Webhook và returnUrl chạy song song, webhook có thể chậm.

---

## Biến môi trường bắt buộc

```env
PAYOS_CLIENT_ID="..."         # từ my.payos.vn → Kênh thanh toán → API Keys
PAYOS_API_KEY="..."
PAYOS_CHECKSUM_KEY="..."       # để verify webhook signature
PUBLIC_URL="https://xxx.ngrok-free.app"  # Bắt buộc — LAN IP không work với PayOS
```

**Validation khi startup** (`BumpService` constructor):
- Thiếu 3 biến `PAYOS_*` → `logger.warn`, API sẽ fail khi gọi thật
- Cả `PUBLIC_URL` và `BASE_URL` đều rỗng → `logger.warn`
- `PUBLIC_URL` match pattern LAN/localhost (`127.`, `192.168.`, `10.`, `172.16-31.`, `localhost`) → `logger.warn` — PayOS không gọi webhook được từ internet

**Validation khi `createOrder`**: `PUBLIC_URL` + `BASE_URL` đều rỗng → throw `ForbiddenException` thay vì để PayOS reject URL `undefined/bump/return`.

---

## Endpoints

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| POST | `/bump/:postId/order` | JWT | Tạo đơn PayOS |
| POST | `/bump/webhook` | — | PayOS callback (verify HMAC) |
| GET | `/bump/:postId/status` | — | Tier + thời gian còn lại |
| GET | `/bump/return?postId=` | — | Redirect `traotay://bump/success` |
| GET | `/bump/cancel?postId=` | — | Redirect `traotay://bump/cancel` |
| POST | `/bump/dev/boost` | DEV_SECRET | Boost thủ công (bypass PayOS) — test E2E |

### `POST /bump/dev/boost` — Dev only

Test flow boost Plus/VIP khi chưa có PayOS keys thật hoặc không muốn tốn tiền thật. Tạo `BumpOrder` với `amount=0`, `status=paid`, `payosOrderId=dev_<timestamp>`.

```json
POST /bump/dev/boost
{
  "secret": "DEV_SECRET",
  "userEmail": "damhungtpt@gmail.com",
  "tier": 3,              // 2 = Plus, 3 = VIP
  "postId": "..."         // optional — nếu không có thì lấy bài available cũ nhất
}
```

---

## Cron reset expired

`bump.cron.ts` — chạy mỗi giờ (`EVERY_HOUR`):
- Tìm `BumpOrder.status = paid` có `expiredAt < now`
- Transaction:
  - Đổi order → `status: expired`
  - Nếu post không còn order paid active khác → set `Post.boostTier = 0`

---

## Hiệu ứng UI theo tier

| Tier | PostCard (home/search) | MyPosts card | Detail banner |
|---|---|---|---|
| 0 (no boost) | mặc định | viền xám | không banner |
| 1 (Free) | nền hơi xanh + badge nhỏ | viền xanh nhạt (primary 0.4) | không banner |
| 2 (Plus) | nền vàng nhạt + viền vàng tĩnh + badge "Plus" | nền vàng nhạt + viền vàng 1.5px + shadow nhẹ + badge "Plus" | banner "Plus" vàng |
| 3 (VIP) | viền vàng chạy (SweepGradient) + 6 sparkles + shimmer + badge "VIP" | viền vàng 2px + glow vàng đậm (2 BoxShadow) + badge "VIP" | banner "VIP" gradient gold |

Tokens dùng chung: `kGoldDark = 0xFFC9A84A`, `kGoldLight = 0xFFF4D36A`, `kGoldOrange = 0xFFFFA500` — copy ở mỗi file để tránh import chéo.

---

## DB schema

`BumpOrder` table (xem `DATABASE_SCHEMA.md`):
- `payosOrderId` — key để match webhook với order
- `tier: 2|3`, `amount`, `package: plus_3d|vip_7d`
- `status: pending | paid | cancelled | expired`
- `expiredAt` — null khi pending, set khi webhook `paid`

`Post.boostTier` + `Post.bumpedAt` — mirror tier hiện tại để query sort nhanh không phải join.

---

## Lỗi dễ gặp

| Lỗi | Nguyên nhân |
|---|---|
| `Sai DEV_SECRET` | `body.secret` không khớp `process.env.DEV_SECRET` |
| Không thể tạo đơn | `PAYOS_*` thiếu hoặc sai → PayOS trả 401 |
| WebView treo ở trang ngrok | Chưa bắt `/bump/return` sớm — check `onNavigationRequest` |
| Thanh toán xong không cập nhật tier | Webhook URL chưa public (dùng ngrok expose `/bump/webhook`) |
| `req.user.userId is undefined` | Phải dùng `req.user.id` (JwtStrategy gán `id`) |
| Webhook trả `Amount mismatch` | `data.amount` PayOS khác `order.amount` DB — check log, có thể partial refund hoặc bug PayOS |
| User báo "đã trả tiền nhưng app báo chưa xử lý" | Bình thường — polling 6s timeout; user kéo refresh My Posts sau 1-2 phút để xác nhận |
