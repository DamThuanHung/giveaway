# Play Store Production Release — Prep Pack

> **Trạng thái**: Sẵn sàng submit Production khi Closed Testing pass
> 14-day window (~5 ngày nữa từ 2026-05-14).
>
> **Strategy**: Web-first acquisition (pivot 2026-05-08), Play Store
> Production là channel bổ sung. Submit khi unlock để tăng credibility +
> link cho marketing copy có thêm Play Store option.

---

## Short description (80 ký tự max)

```
Chợ đồ cũ và trao tặng miễn phí gần bạn. Đăng tin 1 phút, không phí.
```
67 ký tự.

---

## Release notes phiên bản đầu (500 ký tự max)

```
Trao Tay phiên bản đầu tiên — chợ đồ cũ và trao tặng miễn phí giữa người Việt với nhau.

Tính năng:
• Đăng tin trong 1 phút, không ép xác minh CMND
• Mục TẶNG MIỄN PHÍ riêng, tách khỏi tin bán
• Lọc theo tỉnh/quận chính xác — nhận đồ gần nhà
• Chat trực tiếp realtime, thông báo đẩy
• Miễn phí 100%, chỉ thu phí khi tự muốn đẩy bài

Phù hợp cho mẹ tặng đồ con cũ, sinh viên tìm đồ rẻ, người chuyển nhà thanh lý nhanh.

"Đồ cũ người này, Báu vật người kia."
```
490 ký tự.

---

## Full description (4000 ký tự max)

```
Trao Tay là nơi mua bán và trao tặng đồ cũ giữa người Việt với nhau, trong khu vực gần nhà. Slogan của chúng tôi: "Đồ cũ người này, Báu vật người kia."

VÌ SAO TRAO TAY KHÁC

🎁 Mục TẶNG MIỄN PHÍ riêng
Tách hẳn khỏi tin bán. Người cần đồ thật sự không phải lội qua hàng nghìn tin shop. Đồ con đã lớn, áo size cũ, sách đã đọc xong — tặng đi để đến tay người thật sự cần.

📍 Lọc theo tỉnh/quận chính xác
Cầu Giấy chỉ thấy đồ Cầu Giấy. Quận 7 chỉ thấy Quận 7. Tìm đồ gần nhà để đi lấy nhanh trong ngày, không phải đợi giao hàng.

💬 Chat realtime + thông báo đẩy
Người đăng nhận thông báo trong vài giây khi có người quan tâm. Chốt giao dịch nhanh không phải đợi.

📦 Bài đăng tồn tại lâu
Không trôi xuống đáy sau 24 giờ như post nhóm Facebook. Đăng 1 lần, người tìm thấy sau 1 tuần vẫn được.

✨ Đăng 1 phút thật sự
Chụp ảnh, chọn danh mục, gõ giá (hoặc Miễn phí), submit. Không ép xác minh CMND, không ép tải app phụ.

💚 Miễn phí 100% cho người dùng
Không phí đăng tin, không phí thành viên, không quảng cáo nhồi nhét. Chỉ trả khi anh chị tự muốn đẩy bài lên đầu (Bump) để bán nhanh hơn.

PHÙ HỢP CHO

• Mẹ tặng đồ con đã lớn không dùng nữa
• Sinh viên / người trẻ tìm đồ rẻ cho phòng trọ
• Gia đình chuyển nhà cần thanh lý nhanh
• Hộ gia đình dọn dẹp, có đồ cũ chiếm chỗ
• Ai có món đồ thừa muốn cho người thật sự cần

DANH MỤC

Mẹ & Bé, Đồ điện tử, Nội thất, Thời trang, Sách, Đồ chơi, Thể thao, Xe cộ, Làm đẹp, Thú cưng, Đồ nghề, Thực phẩm, Nhạc cụ, Bất động sản, Dịch vụ, Việc làm, Khác.

CỘNG ĐỒNG

Trao Tay là dự án của 1 solo developer Việt Nam, làm vì tin rằng mỗi gia đình đều có vài món đồ cũ trong nhà mà 1 gia đình khác đâu đó đang thật sự cần. Vấn đề chỉ là chưa có cầu nối tốt cho hai bên gặp nhau.

Chúng tôi cam kết:
• Lắng nghe mọi feedback và fix bug trong 24h
• Không bán dữ liệu cá nhân
• Không hiển thị quảng cáo bên thứ ba
• Miễn phí cho người dùng cá nhân vĩnh viễn

Liên hệ: damhungtpt@gmail.com
Website: https://traotay.com.vn

"Đồ cũ người này, Báu vật người kia." — Trao Tay
```

---

## Screenshots Play Store (4 ảnh, 1080×1920)

Lưu tại [web/public/assets/playstore/](../web/public/assets/playstore/):

| # | File | Caption | USP nhấn |
|---|---|---|---|
| 1 | `01-home.png` | "Đồ cũ người này / Báu vật người kia" | Brand + tagline |
| 2 | `02-search.png` | "Lọc theo tỉnh/quận / Nhận đồ gần nhà trong ngày" | Location-based |
| 3 | `03-detail.png` | "Đăng 1 phút thật sự / Không ép xác minh CMND" | UX đơn giản |
| 4 | `04-chat.png` | "Chat realtime / Thông báo đẩy trong vài giây" | Chat tốc độ |

Layout: background gradient emerald (#047857 → #065F46), title white bold 62px, subtitle vàng (#FCD34D) 38px, phone screenshot rounded corners center, footer "Trao Tay — traotay.com.vn".

Script generate tự động: [web/scripts/generate-playstore-screenshots.mjs](../web/scripts/generate-playstore-screenshots.mjs)

Re-generate khi cần (vd update app UI): `cd web && node scripts/generate-playstore-screenshots.mjs`

---

## Asset khác cần (chưa làm, làm khi cần)

- **Icon hi-res 512×512** ✅ Đã có: [web/public/assets/icon_512.png](../web/public/assets/icon_512.png)
- **Feature graphic 1024×500** ❌ Chưa — Play Store yêu cầu khi submit Production
- **Video promo 30s YouTube link** ❌ Chưa — optional, tăng conversion 20-30%

---

## Checklist submit Production (làm khi Closed Testing pass)

- [ ] Đợi nút "Đăng ký phát hành công khai" trên dashboard active (sau 14 ngày Closed Testing)
- [ ] Verify lại 12 tester đã pass 14-day window
- [ ] Upload AAB version mới (nếu có hotfix từ Closed Testing) hoặc dùng version Closed Testing hiện tại
- [ ] Paste Short description (80 ký tự, trên)
- [ ] Paste Full description (4000 ký tự, trên)
- [ ] Paste Release notes (500 ký tự, trên) vào "What's new"
- [ ] Upload 4 screenshot Phone: `web/public/assets/playstore/01-home.png` đến `04-chat.png`
- [ ] Upload icon 512×512: `web/public/assets/icon_512.png`
- [ ] Tạo Feature graphic 1024×500 (CẦN — không có sẽ block submit)
- [ ] Confirm category: Shopping → Lifestyle phụ
- [ ] Submit for review (thường 1-3 ngày Google review)

---

## Cập nhật

| Date | Change |
|---|---|
| 2026-05-14 | Doc tạo. 4 screenshot Play Store generated. 3 description sẵn sàng paste. Còn Feature graphic 1024×500 — defer làm khi submit. |
