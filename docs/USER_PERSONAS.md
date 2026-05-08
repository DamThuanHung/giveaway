# User Personas — Trao Tay

Theo `docs/standards/UI_UX_STANDARDS.md` §11. 3 persona chính áp dụng
cho mọi UX decision: prioritize feature, copywriting tone, onboarding
flow, design choice.

Last review: 2026-05-08
Next scheduled review: 2026-08-01 (quarterly với UPGRADE_ROADMAP)

---

## Persona 1: Chị Mai — bà mẹ bán đồ con cũ

**Demographic:**
- 32 tuổi, nữ
- Văn phòng (HR/admin), thu nhập 12-18 triệu/tháng
- Hà Nội (Cầu Giấy/Đống Đa), có gia đình + 1-2 con < 10 tuổi
- Tech comfort: Medium (smartphone hằng ngày, mạng xã hội tốt, app thanh toán dùng được)

**Goals:**
- Bán đồ con cũ (quần áo, đồ chơi, sách): tủ lạnh đầy mà ít dùng
- Lấy chỗ trong nhà
- Có thêm 500k-2tr/tháng

**Pain points:**
- Chợ Tốt + Facebook Marketplace nhiều người trả giá ảo, scam
- Chợ tốt UI quá nhiều ads + quảng cáo gameplay
- FB Marketplace tin nhắn khó quản lý, không có rating người mua
- Sợ gặp người lạ, prefer giao dịch gần nhà hoặc ship

**Tech behavior:**
- Mở app trong giờ trưa (12-13h) + tối (20-22h) sau khi con ngủ
- Mobile dominant (Android Samsung tầm trung)
- Web ít — thường mở app trên điện thoại

**Quote:**
> "Đồ con tôi còn dùng tốt mà chỉ mặc 2-3 lần là chật. Vứt đi tiếc, bán
> Chợ Tốt thì người ta trả giá ảo. Có nơi nào bán nhanh + an toàn không?"

**UX implications:**
- Mobile-first design — desktop secondary
- Trust signals visible: rating người mua, verified phone, transaction history
- Quick post flow: 5-7 fields max, photo upload smooth
- Bump giá rẻ (khuyến khích re-list mỗi tuần)
- Chat realtime quan trọng (tin tức real-time)

---

## Persona 2: Anh Tú — sinh viên/freelancer mua đồ rẻ

**Demographic:**
- 22-26 tuổi, nam (60%) hoặc nữ (40%)
- Sinh viên năm 3-4 hoặc freelancer mới ra trường
- TP.HCM hoặc Hà Nội, ở trọ/nhà thuê
- Thu nhập 5-12 triệu/tháng (sinh viên: 3-7tr)
- Tech comfort: High (early adopter, tech savvy, trade crypto/stocks)

**Goals:**
- Mua đồ giá rẻ: laptop cũ, máy lạnh, đồ gia dụng setup phòng
- Tìm món tốt giá hời (good deal hunter)
- Free items đôi khi (đồ ăn, sách)

**Pain points:**
- Lazada/Shopee đắt, không deal được
- Chợ Tốt scam nhiều, chất lượng không reliable
- Cần location-based: tìm đồ gần nơi ở (không muốn ship xa)

**Tech behavior:**
- Multi-device: laptop ban ngày + mobile tối
- Active 18-23h (sau school/work)
- Hay so sánh giá nhiều platform trước mua
- Nhanh chán, cần UI smooth + load fast

**Quote:**
> "Tao đang setup phòng trọ, cần laptop văn phòng tầm 5tr + máy lạnh cũ.
> Chợ Tốt nhiều quá lựa không nổi, có cách nào lọc theo khu vực không?"

**UX implications:**
- Search + filter mạnh: location radius, price range, category, condition
- Map view (xem đồ gần nơi mình)
- Web + mobile parity (multi-device)
- Performance critical: page load < 2s, search < 500ms
- Comparison features: save 5-10 bài, so sánh side-by-side
- Notification keyword alert (ping khi có deal mới matching)

---

## Persona 3: Cô Lan — bà nội trợ trao tặng từ thiện

**Demographic:**
- 45-55 tuổi, nữ
- Bà nội trợ hoặc nhân viên về hưu
- Tỉnh thành hoặc ngoại thành Hà Nội/TP.HCM
- Thu nhập trung bình (chồng nuôi gia đình)
- Tech comfort: Low-medium (Zalo dùng tốt, app mua hàng ít, tài khoản ngân hàng có)

**Goals:**
- Trao tặng đồ cũ (không cần tiền) cho người khó khăn
- Đồ con đã lớn, đồ trang trí cũ, sách đọc xong
- Cảm thấy "có ích" + thiện cảm

**Pain points:**
- Không biết đăng ở đâu (Facebook lạ, Chợ Tốt phải bán)
- Sợ bị scam (người nhận giả đói nhưng đem đi bán)
- Không muốn dây dưa nhiều — đăng xong cho rồi quên
- Khu vực giao quá xa (cần người đến lấy hoặc gần nhà)

**Tech behavior:**
- Active 9-11h sáng + 14-16h chiều (rảnh khi con đi học/làm)
- Mobile dominant (iPhone hoặc Android cũ)
- Zalo > Facebook
- Tap nhiều, type ít

**Quote:**
> "Ơ tôi có cái áo khoác mùa đông còn mới, con tôi mặc 2 lần là chán. Cho
> ai cần, đỡ phí của giời. Chứ Facebook khó dùng, ai đến lấy được không?"

**UX implications:**
- "Cho tặng" mode UI rõ ràng (icon 🎁 lớn, không lẫn với "Đang bán")
- Filter free items prominent
- Pickup location easy (Google Maps embed)
- Đơn giản hóa post flow: chỉ ảnh + mô tả + khu vực, không cần giá
- Trust: hiển thị "Đã trao tặng X lần" cho user (badge community)
- Big touch targets, large font (older user-friendly)

---

## Cross-persona insights

### Common pain points
- Tất cả 3: trust (scam/giá ảo), location (gần nhà), giao tiếp dễ (chat thay email)
- 2/3: mobile-first habit
- 2/3: cần filter mạnh (location, category)

### Differentiators
- Mai: trust + speed > price
- Tú: price + comparison + speed > trust
- Lan: simplicity + warmth > anything

### Design priorities
1. Trust signals visible mọi nơi (rating, verified, transaction count)
2. Location + map first-class UX
3. Mobile-first responsive
4. 3 mode rõ ràng: Bán / Cho tặng / Tìm đồ
5. Chat realtime + notification reliable

---

## Journey map — Persona 1 (Chị Mai bán đồ con)

| Stage | Action | Touchpoint | Emotion | Pain |
|---|---|---|---|---|
| Awareness | "Đồ con đầy quá, tìm chỗ bán" | Google "ban do tre em cu" → blog/Facebook → tải app | Curious | App store nhiều, không biết chọn |
| Onboard | Tải app → đăng ký SĐT → OTP | Phone login flow | Hopeful | Sợ tốn thời gian |
| First post | Chọn ảnh → điền tiêu đề → giá → khu vực → đăng | Create post tab | Nervous (lần đầu) | Form quá nhiều field |
| Wait response | Chờ tin nhắn | Notification + push | Anxious | Không có ai message → tự hỏi giá có hợp lý? |
| Negotiate | Chat với buyer | Chat screen | Engaged | Negotiate giá tốn time |
| Deal | Hẹn gặp gần nhà | Chat + map | Cautious | Sợ gặp người lạ |
| Complete | Giao dịch xong → "Đánh dấu xong" | Post detail action | Relieved | Đánh giá người mua thế nào? |
| Repeat | Đăng tin tiếp | New post flow | Confident | "OK app này dùng được" |

**Critical drop-off points:**
- Stage 3 First post: form quá phức tạp → bỏ giữa chừng
- Stage 4 Wait response: không có response trong 24h → uninstall

**Action items:**
- Phase 1 (Sprint hiện tại): G-03 form validation inline đã làm ✓
- Phase 2 (Sprint sau): "Bump miễn phí" notification sau 24h không response
- Phase 3 (Stage 2+): Smart pricing suggestion dựa trên category + location

---

## Journey map — Persona 2 (Anh Tú mua đồ rẻ)

| Stage | Action | Touchpoint | Emotion | Pain |
|---|---|---|---|---|
| Awareness | "Cần laptop tầm 5tr" | Google → Reddit/Voz → tìm forum khuyến nghị | Skeptical | Google ranking Chợ Tốt + Lazada > Trao Tay |
| Discover | Vào web/app → tìm "laptop" | Search + filter | Engaged | Filter location yếu? |
| Compare | Xem 5-10 bài → save favorites | Post list + favorite button | Active | Save từng bài tedious |
| Contact | Chat người bán | Chat screen | Cautious | Sợ scam, check rating |
| Negotiate | Trả giá | Chat | Confident | Người bán không respond fast |
| Visit | Đến xem hàng | Map + address | Wary | Đường xa, kiểm tra hàng tốn time |
| Buy | Trả tiền nhận hàng | Offline | Relieved | App không có escrow → tin tưởng nhau |
| Review | Đánh giá người bán | Review screen | Satisfied | Review system bias positive |

**Critical drop-off points:**
- Stage 2 Discover: search yếu → bỏ về Chợ Tốt
- Stage 6 Visit: location xa → bỏ deal

**Action items:**
- Phase 1: Search filter location radius (đã có)
- Phase 2: Compare side-by-side (Stage 4) — defer Stage 2+
- Phase 3: Escrow payment integration — defer Stage 3+ revenue

---

## Cách dùng personas

### Khi đề xuất feature mới
- "Feature này serve persona nào?" — nếu KHÔNG match 3 persona → reconsider
- Trade-off conflict (vd Mai cần simple, Tú cần powerful) → ưu tiên persona dominant theo stage

### Khi UX review
- "Persona này sẽ tap đâu?" — predict user flow
- "Pain point nào ở đây?" — anticipate friction

### Khi design copy
- Mai: warm, trust-building ("Đăng tin an toàn")
- Tú: efficient, info-dense ("12 kết quả · sắp xếp theo giá")
- Lan: simple, encouraging ("Cảm ơn bạn đã trao tặng")

### Khi prioritize bug
- Mobile bug + Mai/Lan affected = P1 (mobile-first user)
- Web bug + Tú affected = P2 (Tú dùng web cũng OK)

---

## Update cadence

- **Quarterly review** (đầu mỗi quý): refresh stats, update pain points dựa feedback tester/user thật
- **Khi có user thật** (Stage 2 Early GA): replace assumption với data thật
- **Khi pivot product**: re-baseline 3 persona

Tham chiếu thêm:
- `docs/standards/UI_UX_STANDARDS.md` §11 (User Research)
- `docs/UI_UX_AUDIT_2026-05-08.md` G-08 (gap)
- `docs/PROJECT_BRIEFING.md` (target customer)
