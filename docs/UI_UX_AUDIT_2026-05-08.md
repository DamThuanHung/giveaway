# UI/UX Audit Trao Tay — 2026-05-08

Audit current state Trao Tay vs `docs/standards/UI_UX_STANDARDS.md` (universal).
Output: gap analysis + action plan ưu tiên ROI.

---

## 1. Đã đạt ✅

| Standard | Evidence |
|---|---|
| Design System v2 với tokens (color/spacing/radius/shadow/motion) | `docs/UI_DESIGN_SYSTEM.md` + AppTheme Flutter + Tailwind config |
| Color contrast WCAG 2.1 AA cho primary palette | Emerald + Cream + Ink scale, primary-700 trên cream-100 = 7:1 (AAA) |
| Mobile-first responsive | Tailwind breakpoint, mobile + web cùng tokens |
| Brand identity warm minimal | Vietnamese context (emerald + cream + ink), ADR-0004 |
| 7 nguyên tắc UX baseline (Nielsen + Fitts + Hick + Gestalt + Miller + F-Pattern + Progressive Disclosure) | Memory `feedback_ux_principles.md` |
| Touch target mobile | Flutter Material/Cupertino default 48dp |
| Skeleton screens | PostCard có shimmer effect |
| Microinteraction VIP/Plus boost card | Animated border + sparkles + shimmer + glow |
| F-pattern post detail | `web/app/posts/[id]/page.tsx` 1.6fr_1fr grid |
| Z-pattern landing | `web/app/page.tsx` hero + features |

---

## 2. Gap Critical 🔴 (fix sprint kế)

### G-01: State coverage chưa đầy đủ — empty + error state

**Standard:** mỗi component fetching phải có 5 state: empty/loading/error/success/partial

**Current:** một số screen chỉ có loading + success
- `web/app/posts/page.tsx`: empty state khi 0 post → chỉ "Chưa có"
- `app/lib/screens/home_tab.dart`: error state khi API fail → spinner forever
- `app/lib/screens/chat_tab.dart`: empty inbox state generic

**Action:**
- Audit 10 screen chính, populate empty/error state với illustration + CTA
- Empty state: "Chưa có gì" → "Khu vực này chưa có bài đăng. Là người đầu tiên đăng?" + button "Đăng ngay"
- Error state: "Không tải được" → "Mạng yếu? [Thử lại] hoặc [Liên hệ hỗ trợ]"

**Effort:** M (1 ngày 10 screen)
**Priority:** P1

### G-02: Optimistic UI thiếu cho Like/Favorite

**Standard:** action user-initiated ảnh hưởng UI nên optimistic (update trước, server confirm sau)

**Current:** click "Yêu thích" → spinner 200-500ms → update icon
- `web/components/FavoriteButton.tsx`: setState sau API response

**Action:**
- Update icon ngay lúc click (filled heart)
- API call background
- On error: rollback + toast "Không lưu được"

**Effort:** S (3-4h)
**Priority:** P1

### G-03: Form validation chưa inline + chưa có smart default

**Standard:** validate trên blur event, error message dưới field, smart default

**Current:** `web/app/posts/new/page.tsx` form validate on submit, error toast generic

**Action:**
- Validate `onBlur`: email format, phone format, price range
- Error message inline dưới field (đỏ + icon ⚠️)
- Smart default: location từ geolocation API (with consent)
- Phone format auto: `0901234567` → `0901 234 567`
- Currency auto: `200000` → `200.000 đ`

**Effort:** M (1 ngày)
**Priority:** P1

---

## 3. Gap High 🟠 (sprint sau)

### G-04: Microinteractions chưa đủ standard 5

**Standard:** ít nhất 5 microinteraction phổ biến (button press, focus, pull refresh, like, toggle, tooltip)

**Current:** có VIP/Plus card effects nhưng standard component thiếu:
- Button press: chưa scale 0.98 + shadow giảm
- Form focus: border color đổi nhưng KHÔNG có label float
- Pull to refresh: chưa có
- Toggle switch: default Material/Tailwind, chưa custom
- Tooltip: KHÔNG có (dùng title attr — không accessible)

**Action:**
- Custom `<Button>` với press scale + shadow transition
- Floating label cho `<Input>` form
- Pull to refresh trên mobile home_tab
- Custom tooltip component với 100ms delay + arrow

**Effort:** M (1-2 ngày)
**Priority:** P2

### G-05: Atomic Design chưa structure

**Standard:** components organized atoms → molecules → organisms → templates → pages

**Current:** components ad-hoc trong `web/components/` + `app/lib/widgets/` không phân tầng

**Action:**
- Refactor folder structure:
  ```
  web/components/
  ├── atoms/        (Button, Input, Badge, Icon)
  ├── molecules/    (SearchBar, FormField, Card)
  ├── organisms/    (Header, PostCard, ChatList)
  └── templates/    (PageLayout, AuthLayout)
  ```
- Storybook setup (optional, recommended cho design-dev sync)
- Document mỗi atom với prop API

**Effort:** L (3-5 ngày refactor + ongoing)
**Priority:** P2 (defer khi có > 30 components)

### G-06: Bottom sheet thay modal trên mobile

**Standard:** mobile prefers bottom sheet (thumb zone) thay popup giữa màn hình

**Current:** `app/lib/screens/post_detail_screen.dart` action menu dùng `showModalBottomSheet` ✅ — đúng pattern. Nhưng `web/components/ContactSellerButton.tsx` modal centered trên mobile.

**Action:**
- Web: detect mobile breakpoint → render bottom sheet thay modal
- Drag handle, swipe to dismiss

**Effort:** S (4h cho 2-3 modal)
**Priority:** P2

### G-07: Haptic feedback mobile thiếu

**Standard:** action user mạnh nên có haptic (light/medium/heavy)

**Current:** Flutter app không có `HapticFeedback` calls

**Action:**
- `HapticFeedback.lightImpact()` khi button tap primary
- `HapticFeedback.mediumImpact()` khi confirm action (delete, send)
- `HapticFeedback.selectionClick()` khi pick option
- Respect user setting "Reduce haptic"

**Effort:** S (2-3h)
**Priority:** P2

---

## 4. Gap Medium 🟡 (defer post-launch)

### G-08: User research chưa có persona + journey map

**Standard:** 3-5 persona + journey map cho main flow

**Current:** business assumption dựa trên hoàng thượng intuition + tester feedback ad-hoc

**Action:**
- Persona 3 chính:
  1. "Chị Mai 35t, văn phòng, bán đồ con cũ"
  2. "Anh Tú 25t, sinh viên, mua đồ rẻ"
  3. "Cô Lan 50t, bà nội trợ, trao tặng từ thiện"
- Journey map cho:
  1. First post creation
  2. Buyer-seller chat to deal
  3. Bump payment

**Effort:** M (1 ngày research + write)
**Priority:** P3 (làm khi có 100+ user feedback)

### G-09: Usability testing 5-user chưa có

**Standard:** Jakob Nielsen 5-user rule phát hiện 85% issue

**Current:** Closed Testing tester feedback nhưng không structured

**Action:**
- Recruit 5 user matching persona G-08
- Task scenario: "Tạo 1 post bán đồ" + "Tìm + chat người bán"
- Think-aloud protocol, record screen
- Synthesize vào issue list severity 1-4

**Effort:** L (1 tuần recruit + 1 ngày test + 1 ngày analyze)
**Priority:** P3 (sau persona G-08)

### G-10: Dark mode

**Standard:** modern app expected dark mode (battery + eye strain)

**Current:** chỉ light theme

**Action:**
- Token định nghĩa light + dark variant
- `prefers-color-scheme: dark` CSS support
- Mobile: ThemeMode.system option
- Test color contrast trong dark mode

**Effort:** L (3-4 ngày, đụng mọi component)
**Priority:** P3 (defer post Closed Testing)

### G-11: A/B testing infrastructure

**Standard:** đo impact feature thay vì đoán

**Current:** UPGRADE_ROADMAP U5 pre-trigger (cần 2+ measurable feature)

**Action:** xem `UPGRADE_STATUS.md` — defer tới khi đạt trigger.

---

## 5. Anti-patterns audit

| Anti-pattern | Trao Tay current | Status |
|---|---|---|
| Dark pattern forced consent | KHÔNG (cookie banner đơn giản) | ✅ Sạch |
| Roach motel | KHÔNG (delete account easy) | ✅ Sạch |
| Confirm shaming | KHÔNG | ✅ Sạch |
| Hidden costs | KHÔNG (bump price upfront) | ✅ Sạch |
| Auto-play video/audio | KHÔNG | ✅ Sạch |
| Newsletter popup intrusive | KHÔNG | ✅ Sạch |
| "Are you sure?" everywhere | Có vài chỗ — review | ⚠️ Audit |
| Modal lồng modal | KHÔNG | ✅ Sạch |
| Disable button không lý do | Có vài chỗ form submit | ⚠️ Add tooltip |
| Form reset on error | KHÔNG | ✅ Sạch |
| Notification quá tần suất | Có thể (Web Push + FCM cùng push) | ⚠️ Test |

---

## 6. Action plan ưu tiên ROI

### Sprint hiện tại (1 tuần)
- [ ] G-01: State coverage 10 screen chính
- [ ] G-02: Optimistic UI Like/Favorite
- [ ] G-03: Form validation inline + smart default

### Sprint tiếp (2 tuần)
- [ ] G-04: 5 microinteraction standard (button, focus, pull, toggle, tooltip)
- [ ] G-06: Bottom sheet thay modal mobile
- [ ] G-07: Haptic feedback mobile
- [ ] Anti-pattern audit "Are you sure?" + disable button reason

### Sprint sau (4 tuần — post Closed Testing)
- [ ] G-05: Atomic Design refactor folder structure
- [ ] G-08: User persona 3 + journey map
- [ ] G-09: Usability testing 5-user
- [ ] G-10: Dark mode

### Defer (post-revenue / Stage 2+)
- [ ] G-11: A/B testing (theo UPGRADE_ROADMAP U5 trigger)
- [ ] Storybook full setup
- [ ] Visual regression test (Chromatic)

---

## 7. Tổng kết

**Score current vs `UI_UX_STANDARDS.md`:** ~70% đạt
- Foundation principles: 90%
- Visual design: 85%
- Motion + microinteractions: 60%
- State coverage: 50%
- Atomic design + component organization: 40%
- User research: 20%

**Sau Sprint 1+2:** ~85% (close G-01 đến G-07)
**Sau Sprint 3+4:** ~95% (close G-08 đến G-10)
**100% chỉ khi:** A/B test infrastructure + Storybook + visual regression — defer post Stage 2.

Tự động hóa enforcement:
- Hooks cảnh báo nếu commit có UI change KHÔNG đính kèm screenshot/Figma link (future enhancement)
- Lighthouse CI gate cho accessibility score ≥ 90
- axe-core test trong CI cho mỗi PR có UI change
