# UI/UX ROADMAP — Lộ trình thiết kế toàn hệ thống

> Tài liệu này ghi lại các quyết định UI/UX đã được thống nhất giữa user và AI.
> Ngày lập: 14/04/2026

---

## 1. Visual Identity — Nhận diện thương hiệu

### Màu sắc (đã chốt)

| Token | Cũ | Mới | Lý do |
|---|---|---|---|
| `primary` | `#1B4EA3` (xanh đậm) | `#10B981` (Emerald) | Tươi mát, thân thiện, phù hợp app chia sẻ cộng đồng |
| `primaryLight` | `#E8EEFA` | `#D1FAE5` | Tint của Emerald mới |

> **Lưu ý khi implement:** `success` hiện là `#22C55E` (xanh lá) — gần với primary mới. Chỉ dùng `success` cho icon/text, không dùng cho button background để tránh nhầm lẫn.

### Typography (đã chốt)

- **Font:** Be Vietnam Pro (Google Fonts, miễn phí, hỗ trợ tiếng Việt chuẩn)
- **Lý do:** Thiết kế riêng cho tiếng Việt, hiện đại, gần gũi — phù hợp tông thương hiệu
- **Áp dụng:** Cả mobile (Flutter) và web (Next.js)

### Tông thương hiệu

- Cảm giác mục tiêu: **trẻ trung, thân thiện, cộng đồng** — không corporate, không lạnh
- Ngôn ngữ: "bạn", ngắn gọn, không thuật ngữ kỹ thuật
- Tham chiếu gần nhất: Jimoty Nhật (xanh lá, cộng đồng) nhưng Việt hóa hơn

---

## 2. Mobile — Lộ trình cải thiện UX

### Thứ tự ưu tiên (đã chốt)

| # | Tính năng | Mức độ | Lý do |
|---|---|---|---|
| 1 | **Xem ảnh fullscreen** | 🔴 Thiết yếu | Core experience bị thiếu — người mua cần xem ảnh to để quyết định |
| 2 | **Skeleton Loading** | 🔴 Thiết yếu | Perception of performance — người dùng đánh giá app trong 3 giây đầu |
| 3 | **Tìm kiếm nâng cao** | 🔴 Thiết yếu | Discovery là xương sống marketplace — thiếu filter giá/loại/sắp xếp |
| 4 | **Splash screen** | 🟡 Quan trọng | Ấn tượng đầu tiên + routing token khi mở app |
| 5 | **Empty state thống nhất** | 🟡 Quan trọng | Gộp vào lúc đại tu UI — không cần sprint riêng |
| 6 | **Typing indicator** | 🟢 Nice to have | Socket event thêm cả FE + BE — để sau |

### Lộ trình sprint

```
Sprint hiện tại  → Fullscreen ảnh
Sprint tiếp theo → Skeleton Loading
Sprint 3         → Tìm kiếm nâng cao + Splash screen
Sau đại tu UI    → Empty state thống nhất + Typing indicator
```

### Chi tiết từng tính năng

**1. Xem ảnh fullscreen**
- Package: `photo_view`
- Trigger: tap vào ảnh trong PostDetailScreen
- Behavior: swipe ngang nhiều ảnh, swipe xuống đóng, pinch to zoom

**2. Skeleton Loading**
- Thay thế toàn bộ `CircularProgressIndicator` trong list screens
- Shimmer effect: màu `#E2E5EA` → `#F7F8FA`
- Skeleton shape phải match layout thực tế của từng màn hình
- Package: `shimmer`

**3. Tìm kiếm nâng cao**
- Bộ lọc cần thêm: khoảng giá (min/max), loại đăng (cho/bán), sắp xếp (mới nhất / giá thấp / giá cao)
- UI: bottom sheet filter hoặc filter bar nằm ngang phía trên grid
- Backend: thêm query params vào endpoint `/posts`

**4. Splash screen**
- Logo + tagline + màu Emerald
- Check token → route đúng màn hình (Home hoặc Login)
- Duration: 1.5s tối đa

---

## 3. Web — Người dùng cuối

### Vision (đã chốt)
> Full marketplace tương tự Chợ Tốt — không phải landing page đơn giản

### Tech stack
- **Framework:** Next.js (SSR/SSG cho SEO tốt)
- **Styling:** Tailwind CSS
- **Backend:** Dùng chung NestJS API hiện tại — không viết lại

### Design system
- **Dùng chung với mobile:** cùng màu Emerald, cùng Be Vietnam Pro, cùng spacing tokens
- **Khác về layout:** sidebar, grid 4-5 cột, header to với search bar

### Các trang cần có

| Trang | Mô tả | Ưu tiên |
|---|---|---|
| `/` | Trang chủ — grid bài đăng, filter, banner | 🔴 |
| `/search` | Tìm kiếm + filter nâng cao, sidebar | 🔴 |
| `/post/:id` | Chi tiết bài đăng — ảnh lớn, mô tả, seller info | 🔴 |
| `/login` | Đăng nhập | 🔴 |
| `/user/:id` | Hồ sơ người dùng, danh sách bài đăng | 🟡 |
| `/create` | Đăng bài mới | 🟡 |
| `/messages` | Tin nhắn real-time | 🟡 |
| `/profile` | Quản lý tài khoản | 🟡 |

### Layout desktop (tham chiếu Chợ Tốt)
```
┌─────────────────────────────────────────────┐
│  Logo  [Search bar rộng]  Khu vực  Đăng nhập│  ← Header cố định
├──────────┬──────────────────────────────────┤
│ Category │  [Filter bar]                    │
│ Sidebar  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐    │
│          │  │card│ │card│ │card│ │card│    │  ← Grid 4 cột
│          │  └────┘ └────┘ └────┘ └────┘    │
└──────────┴──────────────────────────────────┘
```

---

## 4. Web — Admin Panel

### Vision (đã chốt)
> Cùng repo Next.js, route `/admin/*`, auth riêng bằng role `admin`

### Tính năng theo ưu tiên

**🔴 Thiết yếu (làm trước):**
- Quản lý bài đăng — duyệt, ẩn, xóa bài vi phạm
- Quản lý người dùng — xem thông tin, ban tài khoản
- Xử lý báo cáo — danh sách report, action nhanh

**🟡 Quan trọng:**
- Dashboard thống kê — bài đăng mới, user mới, deal theo ngày/tuần
- Quản lý danh mục — thêm/sửa/xóa category
- Xem lịch sử deal và review

**🟢 Nâng cao:**
- Push notification broadcast
- Quản lý banner / featured posts
- Export dữ liệu CSV

---

## 5. Tổng quan lộ trình toàn hệ thống

```
Giai đoạn 1 — Hoàn thiện mobile (đang làm)
├── Đại tu màu sắc: Emerald #10B981
├── Đại tu font: Be Vietnam Pro
├── Fullscreen ảnh
├── Skeleton Loading
└── Search nâng cao + Splash

Giai đoạn 2 — Web người dùng
├── Setup Next.js + Tailwind
├── Trang chủ + Search + Post detail
├── Auth flow web
└── Đăng bài + Profile

Giai đoạn 3 — Admin Panel
├── Quản lý bài đăng + user
├── Xử lý báo cáo
└── Dashboard thống kê

Giai đoạn 4 — Hoàn thiện
├── Typing indicator
├── Empty state thống nhất
└── Push notification broadcast
```
