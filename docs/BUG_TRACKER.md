# BUG TRACKER — Closed Testing feedback

> **Mục đích**: Gom tất cả bug/UX issue phát hiện trong giai đoạn Closed Testing (12 tester).
> **Chiến lược**: KHÔNG push fix lẻ tẻ → chờ Google duyệt 14 ngày Closed Testing xong (~2026-05-18) sẽ fix một loạt cho version `1.0.6+9` để qua Production review.
> **Lý do treo fix**: mỗi lần upload AAB mới có thể reset đồng hồ 14 ngày Closed Testing của Google.

---

## Quy ước ghi bug

```
### [ID] Tiêu đề ngắn
- **Severity**: 🔴 P0 chặn release / 🟠 P1 ảnh hưởng UX nặng / 🟡 P2 polish / ⚪ P3 nice-to-have
- **Reporter**: tên tester (hoặc "hoàng thượng" / "nội bộ")
- **Reported**: YYYY-MM-DD
- **Status**: 📋 backlog / 🔧 đang fix / ✅ đã fix (commit `xxx`) / 🚫 wontfix
- **File**: path:line
- **Mô tả**: 1-3 câu
- **Repro**: bước tái hiện
- **Đề xuất fix**: 1-3 câu (hoặc link diff khi đã fix)
```

---

## Bug list

### #001 Filter sheet: 2 hàng chip wrap bị dính sát nhau
- **Severity**: 🟡 P2 (polish — vẫn dùng được, nhưng visual messy)
- **Reporter**: tester (hoàng thượng forward 2026-05-06)
- **Reported**: 2026-05-06
- **Status**: 📋 backlog
- **File**: [app/lib/screens/search_tab.dart:362-372](app/lib/screens/search_tab.dart#L362) (Loại đăng) + [:379-389](app/lib/screens/search_tab.dart#L379) (Sắp xếp theo)
- **Mô tả**: Trong sheet filter của Tab Tìm kiếm, mục "Loại đăng" và "Sắp xếp theo" dùng `Wrap(spacing: 8, ...)` thiếu `runSpacing` → khi chip wrap xuống dòng dưới (vd: "Giá giảm dần"), 2 hàng dán sát nhau không có gap dọc.
- **Repro**: mở Tab Tìm kiếm → bấm icon filter → cuộn xuống "Sắp xếp theo" → quan sát 3 chip wrap thành 2 dòng.
- **Đề xuất fix**: thêm `runSpacing: 8` vào cả 2 widget `Wrap`. Bug copy-paste vì cùng file dòng [:425-437](app/lib/screens/search_tab.dart#L425) ("Danh mục") đã có `runSpacing: 8`.

### #002 Post card: khoảng trống thừa giữa title và giá
- **Severity**: 🟡 P2 (polish, ảnh hưởng visual density của feed)
- **Reporter**: tester (hoàng thượng forward 2026-05-06)
- **Reported**: 2026-05-06
- **Status**: 📋 backlog
- **File**: [app/lib/widgets/post_card.dart:264-334](app/lib/widgets/post_card.dart#L264) + [app/lib/screens/home_tab.dart:599-605](app/lib/screens/home_tab.dart#L599)
- **Mô tả**: Khi title chỉ 1 dòng (ví dụ "tranh đông hồ"), `Spacer()` giữa title và giá đẩy 2 element ra hai đầu → khoảng trắng to giữa card. Kết hợp với `childAspectRatio: 0.58` (card cao bất thường) → ảnh chiếm 58% còn content 42% — ngược tỷ lệ chuẩn ngành (Jimoty/Chợ Tốt ~75:25).
- **Repro**: mở Tab Trang chủ → tìm bài có title 1 dòng (như "tranh đông hồ", "ghế cũ") → khoảng trắng to giữa title và giá.
- **Đề xuất fix**:
  1. `home_tab.dart` `childAspectRatio: 0.58 → 0.70` (card thấp hơn ~17%, ảnh chiếm tỷ lệ cao hơn)
  2. `post_card.dart:277` thay `const Spacer()` bằng `const SizedBox(height: 6)` để title + giá sát nhau, location đẩy xuống đáy bằng padding bottom của Column
  3. Cần test với cả 3 tier (Free/Plus/VIP) để đảm bảo không vỡ animation viền vàng.

### #003 Header trang chủ: background không full (cần clarify)
- **Severity**: ❓ chưa xác định
- **Reporter**: tester (hoàng thượng forward 2026-05-06)
- **Reported**: 2026-05-06
- **Status**: 📋 cần info thêm — chưa đủ context để fix
- **File**: nghi ngờ [app/lib/screens/home_tab.dart:286-340](app/lib/screens/home_tab.dart#L286)
- **Mô tả**: Tester báo "background không full" ở phần header có "Hà Nội ▼" + 3 chip filter "Tất cả/Miễn phí/Theo dõi" + bell icon. Nhìn screenshot không rõ nguyên nhân — code dùng `AppTheme.surface` nhất quán cả AppBar lẫn chip container.
- **Repro**: chưa rõ
- **Đề xuất fix**: hỏi tester clarify — background chưa full ở chỗ nào (status bar, dưới chip filter, viền 2 bên)? Có thể chụp ảnh khoanh đỏ hoặc quay video. Sau khi có info → mới fix được.

---

## Bug list backlog (placeholder cho session sau)

<!-- Khi nhận thêm feedback từ tester, append xuống đây theo format trên. Đếm ID tăng dần #004, #005... -->

---

## Lịch fix

- **Trước 2026-05-18 (Closed Testing kết thúc)**: KHÔNG push code app. Chỉ fix nếu là 🔴 P0 chặn (vd: crash trắng, ko đăng nhập được).
- **Sau 2026-05-18**: gom toàn bộ 🟠🟡 fix vào version `1.0.6+9` → build AAB → upload Production track (hoặc Closed Testing tiếp nếu Google yêu cầu).
- **Web**: vì web không qua Google review → có thể fix + deploy ngay (nếu là bug web). Hiện 3 bug đầu đều mobile.

---

## Tham chiếu chéo

- Memory `project_session_state.md` — trạng thái session
- Memory `project_aws_deploy_state.md` — production state
- `docs/PRODUCTION_CHECKLIST.md` — checklist trước khi build release
