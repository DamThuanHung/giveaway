# Analytics Setup — Web Acquisition Tracking

> **Mục đích**: Đo user đến từ đâu (Google / FB / Zalo / direct), bounce
> ở page nào, top page, country/device. Phục vụ web-first acquisition
> phase 1 (xem `RISK_REGISTER.md` R-004 Accepted/Deferred 2026-05-08).
>
> **Stack hiện tại (2026-05-08)**: Cloudflare Web Analytics (free,
> privacy-first, no-cookie). Custom event defer Stage 2.

---

## Phase 1 (LIVE) — Cloudflare Web Analytics

**Tại sao chọn**:
- Free, không giới hạn pageview
- Privacy-first: không cookie, không PII → KHÔNG cần consent banner
  (giảm friction onboarding user VN không quen popup cookie)
- Đã có CF account quản lý DNS → 1 click setup
- Bot filter built-in
- 1 line `<script>` async ~1KB → zero block render

**Capabilities**:
- Unique visitor + pageview
- Top pages (xem post nào hot)
- Top referrer (Google / Facebook / Zalo / direct / app links)
- Country + device + browser
- Bounce rate

**Limitations**:
- KHÔNG có custom event (post-create / share-click / signup) → defer
  Stage 2 khi cần đo conversion funnel
- Dashboard CF không export raw → không SQL được data tại chỗ

---

## Setup steps (Hoàng thượng làm 1 phút)

1. Mở https://dash.cloudflare.com → đăng nhập
2. Sidebar → **Analytics & Logs** → **Web Analytics**
3. Click **Add a site** → nhập `traotay.com.vn` (chọn "Manage with Cloudflare")
4. CF tự cấp 1 token (nhìn trong script tag `data-cf-beacon='{"token":"xxx"}'`)
5. Copy token → gửi thần qua Zalo / chat

Sau đó thần làm:

```bash
# Trên server
ssh -i ~/.ssh/traotay-key.pem ubuntu@18.138.150.162
sudo -u traotay bash -c '
  cd /opt/traotay/repo/web
  echo "NEXT_PUBLIC_API_URL=https://api.traotay.com.vn" > .env.local
  echo "NEXT_PUBLIC_CF_BEACON_TOKEN=<TOKEN_HOÀNG_THƯỢNG_PASTE>" >> .env.local
  chmod 600 .env.local
'
sudo -u traotay bash /opt/traotay/repo/scripts/web-rebuild.sh
```

Sau rebuild ~60s, beacon script sẽ embed mọi page → CF Analytics dashboard
hiển thị data trong vòng 5-15 phút.

---

## Verify sau deploy

1. Mở https://traotay.com.vn → F12 Network tab
2. Tìm request `beacon.min.js` từ `static.cloudflareinsights.com` → status 200
3. Mở CF Dashboard → Web Analytics → traotay.com.vn → thấy 1 pageview của
   chính mình + country VN + browser

---

## Phase 2 (defer trigger) — Plausible Cloud / Umami self-host

**Trigger**: MAU > 100 hoặc cần đo conversion funnel (Stage 2).

**Plausible Cloud** ($9/mo):
- Custom events qua `plausible('Event Name')` JS API
- Goals + funnel + UTM
- Privacy-first cùng triết lý CF
- Setup 15 phút: signup plausible.io + add domain + thay script tag

**Umami self-host** (free):
- Cùng tính năng
- Cần thêm 1 Postgres + container Umami app
- Setup 1-2h: docker compose + nginx subdomain `analytics.traotay.com.vn`
  + Let's Encrypt cert + tạo user + add website
- Maintain effort: minor (cập nhật docker image quarterly)

Khi trigger active, thần làm:

1. Quyết Plausible vs Umami (depend on MRR)
2. Embed thay/song song CloudflareAnalytics component
3. Add `track()` call vào các điểm:
   - Post create form submit success
   - Post detail share button click (Zalo / Facebook / copy link)
   - Signup form submit success
   - Bump order checkout success
4. Document event schema vào ADR (vì là contract dài hạn)

---

## Phase 3 (defer trigger) — Session replay + heatmap

**Trigger**: DAU > 500 hoặc UX bug khó tái hiện qua bug report.

**Tools**: PostHog (cloud free 1M events/mo) hoặc FullStory.

**Capabilities**:
- Session replay (xem video user thao tác)
- Heatmap click + scroll
- Funnel conversion với drop-off page

**Cost**: PostHog free tier đủ, FullStory paid (~$200/mo).

---

## Privacy & legal

- CF Analytics + Plausible + Umami: KHÔNG dùng cookie, KHÔNG track PII
  → KHÔNG cần consent banner theo GDPR / VN Cybersecurity Law 2018.
- Vẫn nên có Privacy Policy update nói rõ "Chúng tôi dùng analytics
  privacy-first không lưu thông tin cá nhân". Chỉ thêm 1 đoạn trong
  `web/public/privacy.html`.
- KHÔNG bật Google Analytics 4 vì GA4 có cookie + tracking PII → cần
  consent banner + có thể block bởi extension người dùng VN.

---

## Tham khảo

- CF Web Analytics docs: https://developers.cloudflare.com/web-analytics/
- Plausible Cloud: https://plausible.io
- Umami: https://umami.is
- PostHog: https://posthog.com

---

## Cập nhật

| Date | Change |
|---|---|
| 2026-05-08 | Doc tạo. Phase 1 CF Analytics deploy, đợi token hoàng thượng |
