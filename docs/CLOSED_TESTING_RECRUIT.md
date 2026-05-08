# Closed Testing — Recruit & Tracking

> ⚠️ **PARKING LOT 2026-05-08** — strategy pivot sang web-first acquisition.
> Doc này giữ nguyên cho khi retry Closed Testing sau (trigger: web MAU > 500
> hoặc 3 tháng nữa). Xem `EARLY_ADOPTER_SURVEY.md` + `RISK_REGISTER.md` R-004
> Accepted/Deferred status.
>
> **Mục đích (gốc)**: Mitigate R-004 (Red 20). Recruit 7-8 tester thật hoạt động ổn
> định 14 ngày để Closed Testing pass và tiến lên Production review.
>
> **Deadline (gốc)**: 2026-05-18 (10 ngày từ hôm nay 2026-05-08).
>
> **Hiện trạng**: 4-5 tester active → cần thêm 7-8 → tổng ≥12.

---

## Thông tin chia sẻ tester

### Link tải APK (sideload Android)
```
https://s3.traotay.com.vn/traotay/releases/traotay-1.0.7-build10-20260508.apk
```
Size 27.5 MB. Hướng dẫn cài: bật "Cài đặt từ nguồn không xác định" trong
Settings → Bảo mật → tải file → mở để cài.

### Link Play Store Closed Testing (sau khi tester đăng ký email)
*(Hoàng thượng cần add email tester vào Play Console Closed Testing list,
sau đó gửi link opt-in:)*
```
https://play.google.com/apps/testing/com.traotay.app
```

### Web (test trên trình duyệt)
```
https://traotay.com.vn
```

### Hỗ trợ tester
- Email: damhungtpt@gmail.com
- Zalo / điện thoại: *(hoàng thượng điền)*

---

## 3 Message variant gửi cho tester

### Variant A — Zalo / bạn bè thân (cá nhân hoá từng người)

> Chào [tên],
>
> Mình đang phát triển ứng dụng **Trao Tay** — app cho người Việt mua bán
> và trao tặng đồ cũ giữa hàng xóm, kiểu "đồ cũ người này, báu vật người
> kia". App sắp lên Google Play, đang ở giai đoạn test cuối với 12 người
> trước khi mở rộng.
>
> Bạn giúp mình test 14 ngày được không? Việc của bạn:
> 1. Cài app (mình gửi link bên dưới)
> 2. Đăng thử 1 món đồ cũ trong nhà (gì cũng được, để vài tiếng rồi xoá
>    cũng được)
> 3. Lướt feed xem 5-10 phút mỗi ngày, thấy gì lạ thì nhắn mình
>
> Đổi lại bạn được dùng app sớm và mình sẽ ghi nhớ ơn 😄
>
> **Link APK Android**: https://s3.traotay.com.vn/traotay/releases/traotay-1.0.7-build10-20260508.apk
> **Link web**: https://traotay.com.vn (nếu muốn xem trước trên máy tính)
>
> Có gì khó hỏi mình ngay nhé. Cảm ơn bạn!

### Variant B — Facebook group / cộng đồng dev VN (Tinhte, Reddit r/VietNam, Bizfly group)

> **[Tuyển 7 tester sớm cho app Trao Tay — VN C2C marketplace]**
>
> Chào mọi người, mình là solo developer đang hoàn thiện **Trao Tay** —
> app mua bán & trao tặng đồ cũ giữa người Việt với nhau, kiểu Jimoty của
> Nhật nhưng tối ưu cho thị trường VN (chat thay email, location tỉnh
> thành, hỗ trợ vận chuyển nội thành).
>
> App đã LIVE ở giai đoạn Closed Testing trên Google Play, mình cần thêm
> 7 tester active 14 ngày để Google duyệt sang Production.
>
> **Tester được gì:**
> - Dùng app sớm 1 tháng trước khi public
> - Voice của bạn ảnh hưởng trực tiếp đến product (mình đọc và fix mọi
>   feedback trong vòng 24h)
> - Acknowledge trong release notes nếu OK
>
> **Tester làm gì (15-30 phút tổng cộng trong 14 ngày):**
> - Cài APK Android (sẽ add email vào Play Console nếu test qua Play)
> - Đăng thử 1-2 bài
> - Lướt feed 5 phút/ngày trong 14 ngày
> - Báo bug/UX kỳ qua Zalo hoặc email
>
> Stack: Flutter + NestJS + Postgres trên AWS Singapore + Cloudflare.
>
> Bạn nào quan tâm comment "tham gia" + tag mình, mình DM gửi link APK
> và Zalo support. Cảm ơn cộng đồng 🙏

### Variant C — LinkedIn / mạng chuyên môn (peer review, thẳng thắn)

> **Looking for 7 testers — Vietnamese C2C marketplace (Closed Testing
> Google Play)**
>
> Solo developer here. Building **Trao Tay**, a Vietnamese C2C marketplace
> for second-hand goods (think Jimoty for VN). Stack: Flutter + NestJS +
> PostgreSQL on AWS SG, Cloudflare-fronted.
>
> Currently in Google Play Closed Testing. Need 7 active testers for the
> 14-day window to graduate to Production review (deadline 2026-05-18).
>
> **What I need from you:**
> - Install APK or join Closed Testing on Play Store
> - Use the app at least a few minutes per day for 14 days
> - File any bug/UX issue you spot (Zalo or email)
>
> **What you get:**
> - Early access (1 month before public launch)
> - Direct say in product direction (I respond to all feedback within 24h)
> - Optional credit in release notes
>
> APK link + onboarding details in DM. Particularly interested in feedback
> from folks who've shipped consumer mobile in VN market.

---

## Checklist tracking 7-8 tester

| # | Tên | Liên hệ (Zalo/SĐT/Email) | Persona match | Variant gửi | Đã invite (date) | Đã install (date) | Đã đăng 1 bài | Đã chat thử | Đã like+lưu | Web Push opt-in | Bug báo | Active 14 ngày? |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 |   |   |   |   |   |   |   |   |   |   |   |   |
| 2 |   |   |   |   |   |   |   |   |   |   |   |   |
| 3 |   |   |   |   |   |   |   |   |   |   |   |   |
| 4 |   |   |   |   |   |   |   |   |   |   |   |   |
| 5 |   |   |   |   |   |   |   |   |   |   |   |   |
| 6 |   |   |   |   |   |   |   |   |   |   |   |   |
| 7 |   |   |   |   |   |   |   |   |   |   |   |   |
| 8 |   |   |   |   |   |   |   |   |   |   |   |   |

**Persona target mix** (xem `docs/USER_PERSONAS.md`):
- 3-4 Persona 1 (Chị Mai — mom seller): bạn bè/đồng nghiệp 30-40t có con nhỏ
- 2-3 Persona 2 (Anh Tú — young buyer): sinh viên/freelancer 22-26t, dev community
- 1-2 Persona 3 (Cô Lan — elderly giver): họ hàng 45-55t có Zalo dùng tốt

Mix này quan trọng để bug báo về đa dạng (UX cho elderly khác hẳn dev).

---

## 3 Feature core mỗi tester phải reach (definition of "active")

Active = trong 14 ngày tester phải hoàn thành **cả 3** journey:

### Journey 1: Đăng bài (post creation)
1. Mở app → Tab "Đăng" (giữa)
2. Chụp/chọn 1-3 ảnh
3. Điền tiêu đề + giá + tỉnh thành + danh mục
4. Submit
5. Vào Tab "Cá nhân" → Bài đăng → thấy bài vừa đăng

**Verify**: ảnh hiển thị đúng (không 📦 placeholder), giá format đúng VND.

### Journey 2: Tương tác với bài người khác
1. Tab "Trang chủ" → click 1 bài bất kỳ
2. Click "Chat" → gửi 1 tin nhắn thử
3. Quay lại → click ❤️ thêm yêu thích
4. Tab "Cá nhân" → Yêu thích → thấy bài vừa thêm

**Verify**: chat realtime, ảnh trong /favorites không placeholder, web push
notification (nếu test web) hiện thông báo.

### Journey 3: Filter + tìm kiếm
1. Tab "Tìm kiếm" → gõ keyword bất kỳ (vd "ghế")
2. Mở filter → chọn 1 tỉnh + 1 danh mục
3. Apply → thấy danh sách filter
4. Sort theo "Giá tăng dần" → verify sort đúng

**Verify**: filter clear all hoạt động, sort theo giá KHÔNG bị tier-locked
(VIP/Plus chỉ áp dụng sort default).

### Bonus journey (optional, P2):
- Bump bài: Tab Cá nhân → bài đăng → Đẩy bài (free) → verify bumpedAt update
- Đánh giá review: chỉ hoạt động sau khi 2 user complete deal
- Logout + login lại: KHÔNG có confirm dialog (đã bỏ session 2026-05-08)

---

## Bug intake — channel cho tester báo

1. **Zalo group "Trao Tay Tester"** (hoàng thượng tạo, add tester vào)
2. **Email**: damhungtpt@gmail.com với subject `[Trao Tay Bug] <mô tả ngắn>`
3. **Format mong muốn từ tester** (gửi cho họ template):
   ```
   Bug: <1 câu>
   Bước tái hiện: 1) ... 2) ... 3) ...
   Kết quả: <thực tế thấy>
   Mong đợi: <thấy gì mới đúng>
   Device: <vd Samsung A52 Android 12>
   Screenshot: <đính kèm>
   ```

Hoàng thượng nhận → ghi vào [BUG_TRACKER.md](BUG_TRACKER.md) với severity
P0/P1/P2/P3 → KHÔNG fix lẻ trong 14 ngày Closed Testing (tránh reset đồng
hồ Google) → fix gộp một loạt cho version sau.

---

## Plan recruit 10 ngày

| Ngày | Mục tiêu | Action |
|---|---|---|
| Ngày 1 (08-05) | Liệt kê pool | Liệt kê 15 người tiềm năng (3 pool: bạn thân / FB group / dev community), chia theo Variant A/B/C |
| Ngày 2-3 (09-10) | Gửi đợt 1 | Gửi 8 Variant A (bạn thân) — kỳ vọng 5-6 đồng ý |
| Ngày 4-5 (11-12) | Gửi đợt 2 | Post Variant B vào 2-3 FB group + Variant C vào LinkedIn — kỳ vọng 3-4 đồng ý |
| Ngày 6-8 (13-15) | Onboard | Add email tester vào Play Console, gửi link opt-in, hỗ trợ install qua Zalo, follow-up từng tester verify đã install + journey 1 |
| Ngày 9-10 (16-17) | Active check | Verify 12 tester đều active >= 7 ngày, journey 1+2 done. Nếu thiếu → recruit gấp Variant A nội nhóm gia đình |
| Ngày 11-14 (18+) | Theo dõi | Day-N của Closed Testing, đếm active rolling 14 ngày trong Play Console, gom bug vào BUG_TRACKER |

---

## Khi nào escalate

- Ngày 5 (12-05) **chưa đủ 8 tester confirm** → escalate: nâng commitment offer (vd cảm ơn coffee 50k/tester) hoặc mở rộng pool đến acquaintance
- Ngày 8 (15-05) **active < 8** → cân nhắc gửi reminder personal Zalo từng tester chưa chạm app
- Ngày 12 (19-05) **active < 12 trong rolling window** → STOP, accept reset 14-day clock + retry với batch tester ổn định hơn

---

## Cập nhật

| Date | Note |
|---|---|
| 2026-05-08 | Doc tạo. Hiện trạng 4-5 active. Pending hoàng thượng start recruit Variant A đợt 1 |
