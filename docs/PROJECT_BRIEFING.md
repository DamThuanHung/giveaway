# Trao Tay — Project Briefing

> Mục đích: brief cho 1 instance Claude khác (hoặc người ngoài team) hiểu nhanh dự án để thảo luận business strategy, marketing, pricing, scale.
> Stack kỹ thuật + production đã ổn định, không phải pain point chính.

---

## 1. Concept & Founder

**Trao Tay** — marketplace mua bán + trao tặng đồ cũ cho người Việt. Cảm hứng từ Jimoty (Nhật Bản).

- **Slogan chính thức**: *"Đồ cũ người này, Báu vật người kia"*
- **Founder**: solo, làm trên Windows 10, không có team marketing/sales/support
- **Target**: người Việt 25-50 tuổi, urban (Hà Nội / TP.HCM / tỉnh lớn)
- **Differentiation vs Chợ Tốt / FB Marketplace / Shopee**:
  - Tập trung cộng đồng cho-tặng (không chỉ bán)
  - Giao diện thuần Việt, không quảng cáo che nội dung
  - Hỗ trợ 4 loại tin: đồ cũ / bất động sản / dịch vụ / việc làm
- **Brand đã chốt**: KHÔNG đổi tên dù feedback "nghe chưa TMĐT" — fix bằng truyền thông định vị

---

## 2. Stack kỹ thuật

| Layer | Tech |
|---|---|
| Mobile | Flutter (Android only, iOS chưa build) |
| Web | Next.js 14 static export tại `traotay.com.vn` |
| Backend | NestJS + Prisma + PostgreSQL 15 |
| Realtime | Socket.IO chat |
| Storage | MinIO S3-compatible (`s3.traotay.com.vn`) |
| Payment | PayOS (gateway VN, ~1.5% fee) |
| Auth | OTP qua SĐT (Firebase) hoặc Email (Resend) |
| Push | Firebase Cloud Messaging |
| Hosting | AWS EC2 t3.micro Singapore (free tier năm đầu) |
| DNS+CDN | Cloudflare Proxied (free) |
| Backup | Backblaze B2 (DB + MinIO sync hàng ngày) |
| CI Web | Cron rebuild Next.js mỗi giờ |

---

## 3. Hiện trạng (2026-05-07)

### Mobile Android
- Closed Testing Google Play — **12 tester opt-in nhưng chỉ 4-5 active thật** (CRISIS)
- APK 1.0.7+10 LIVE tại `s3.traotay.com.vn/traotay/releases/` (chưa upload Play Console)
- 14 ngày Closed Testing kết thúc dự kiến **2026-05-18** → mới đủ điều kiện submit Production
- Vừa hoàn thành Phase C UI overhaul (cream warm tone + tokens v2 + 2 bug tester fix)

### Web
- LIVE đầy đủ tại `https://traotay.com.vn` — feature parity với mobile
- Design System v2 "Vietnamese Warm Minimal" (cream warm + emerald + ink scale)
- JSON-LD SEO + GSC verified + sitemap submitted

### Admin
- Dashboard tại `https://api.traotay.com.vn/admin.html` — 11 tab
- Tính năng grant Plus/VIP miễn phí (cứu trợ / marketing / bù đắp lỗi payment)

### iOS
- ❌ Chưa build — chưa có Apple Developer Account ($99/năm), chưa có Mac
- Founder có iPhone test sẵn
- Plan: 1-2 tuần sau khi đăng ký Apple Dev + Codemagic CI

---

## 4. Business model

### Revenue stream

| Gói | Giá | Thời hạn | Effect |
|---|---|---|---|
| Free bump | 0đ | 24h | Đẩy lên đầu 1 lần/24h |
| **Plus** | **5.000đ** | **3 ngày** | Border vàng + ưu tiên hiển thị |
| **VIP** | **15.000đ** | **7 ngày** | Border vàng chạy + sparkles + glow |

### Feature miễn phí
Đăng tin không giới hạn · Tìm kiếm + filter · Chat realtime · Đánh giá 2 chiều · Cảnh báo từ khóa · Push notification

### Rule monetization
- **KHÔNG bật ads trước 5.000 MAU** (lộ trình Bump → Sponsored Posts → Trao Tay Ads)
- Admin grant Plus/VIP miễn phí có audit log + reason bắt buộc

### Cost hiện tại < $15/tháng

| Item | Cost |
|---|---|
| AWS EC2 | $0 (free tier năm đầu) |
| Cloudflare | $0 |
| Backblaze B2 | ~$0.5-1 |
| Resend | $0 (free tier) |
| Domain TenTen.vn | ~$10/năm |
| PayOS | ~1.5% mỗi giao dịch |
| Apple Dev (planned) | $99/năm |

---

## 5. Roadmap

| Mốc | Việc |
|---|---|
| **~2026-05-18** | Closed Testing kết thúc → submit Production Google Play |
| **Sau 2026-05-18** | Bump version 1.0.8+11 → Production review (1-3 ngày Apple/Google) |
| **Tuần này-tuần sau** | Apple Dev account → Codemagic CI → IPA → TestFlight |
| **Open** | App Store submit + marketing scale + monetization scaling |

---

## 6. Vấn đề thảo luận business

### Tester crisis (urgent)
- Closed Testing Google yêu cầu **12 tester thực sự install + dùng** 14 ngày
- Hiện 4-5/12 active thật, còn lại đăng ký cho có
- Founder đã add ~19 email (có pattern acc giả `damhungtpt001/002/003`) → **risk Google ban dev account vĩnh viễn**
- **Q**: Cách recruit 7-8 tester thật còn lại trong ~11 ngày?

### Pricing
- Plus 5k/3 ngày + VIP 15k/7 ngày — competitive với Chợ Tốt chưa?
- ARPU dự kiến bao nhiêu để break-even cost?

### Marketing
- Founder solo, không team marketing
- Web LIVE nhưng chưa run ads
- **Q**: Kênh nào fit nhất? FB Group / Zalo / TikTok / Reddit r/vietnam / mailing list?

### Differentiation
- 4 loại tin (đồ cũ + BĐS + dịch vụ + việc làm) — quá rộng cho 1 brand?
- Tập trung "đồ cũ + cho tặng" thuần (như Jimoty) hay giữ 4 type (như Chợ Tốt)?

### iOS ROI
- $99/năm Apple Dev + 1-2 tuần effort
- Market share iOS VN ~25-30%
- **Q**: Native iOS sớm hay PWA fallback trước?

### Enable ads timing
- Rule: chờ 5.000 MAU
- Bao lâu để đạt 5k MAU với marketing solo?
- Alternative: sponsored posts với cửa hàng đồ cũ local trước Google AdSense?

---

## 7. Constraints

- **Solo founder** — không team
- **Budget thấp** — AWS free tier, $99 Apple Dev là cost cứng đáng kể
- **Không macOS** — block iOS native (phải cloud Mac)
- **Việt Nam market** — thanh toán online chậm, ưu tiên giao mặt + tiền mặt, độ tin cậy thấp với app mới
- **Closed Testing 14 ngày** — block Production submit, không bypass

---

**Tab Claude khác đào sâu**: business strategy / monetization / marketing / pricing / scale path.
