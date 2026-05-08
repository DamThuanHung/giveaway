# UI/UX Standards — Tiêu chuẩn cao nhất ngành

> Universal. Gộp principles từ Nielsen Norman Group + Apple HIG +
> Material Design 3 + Microsoft Fluent + Atomic Design (Brad Frost) +
> WCAG 2.2 + Disney 12 Animation Principles + W3C Design Tokens.
>
> Áp dụng mọi dự án có UI. Reference cho ACCESSIBILITY_BASELINE,
> I18N_STRATEGY, PERFORMANCE_AND_FINOPS đã có.

---

## 1. Foundation — 10 Nielsen Heuristics + 4 Laws

### 1.1 Nielsen Norman 10 Usability Heuristics (1994, vẫn nguyên giá trị)

1. **Visibility of system status** — User luôn biết app đang làm gì (loading, processing)
2. **Match real world** — Vocabulary user, không jargon kỹ thuật
3. **User control + freedom** — Undo, cancel, exit dễ dàng
4. **Consistency + standards** — Cùng pattern xuyên app + theo platform convention
5. **Error prevention** — Confirm destructive action, validate input
6. **Recognition > recall** — Show options, không bắt user nhớ
7. **Flexibility + efficiency** — Shortcut cho expert, simple cho beginner
8. **Aesthetic + minimalist** — KHÔNG redundant info
9. **Help recover from errors** — Error message rõ + đề xuất fix
10. **Help + documentation** — Khi cần, dễ tìm

### 1.2 4 Fundamental Laws

#### Fitts's Law — target size + distance
```
T = a + b × log₂(D/W + 1)
```
- Time to acquire target tỉ lệ với log(distance/width)
- **Áp dụng:** primary action button to + dễ click (44×44pt minimum)
- Edge/corner = "infinite size" (mouse trapped) — primary nav nên ở đây

#### Hick-Hyman Law — choice complexity
```
T = b × log₂(n + 1)
```
- Time to decide tỉ lệ log(số option)
- **Áp dụng:** Tránh menu 20 item → group thành 4-5 category, mỗi category 4-5 sub
- Progressive disclosure: show 3-5 option đầu, "More" cho rest

#### Miller's Law — 7±2 working memory
- User chỉ giữ 5-9 item trong working memory ngắn hạn
- **Áp dụng:** form steps tối đa 7; navigation tối đa 7 item; chunking phone number 3-3-4

#### Gestalt Principles — perception
- **Proximity:** vật gần nhau = nhóm liên quan
- **Similarity:** giống style = cùng function
- **Closure:** brain fill missing → có thể không cần border đầy đủ
- **Figure-ground:** primary vs background tách rõ
- **Common fate:** vật chuyển cùng hướng = liên quan
- **Continuity:** mắt theo line/curve mượt
- **Symmetry:** đối xứng = harmonic

---

## 2. Reading patterns — F vs Z

### F-Pattern (text-heavy: blog, article, search results)
```
████████████████████  ← horizontal scan top
████████████████████
██████████
██████
██████
██
```
- Top heading must hook
- 2-3 dòng đầu critical
- Bullet/subheading cho scanability

### Z-Pattern (sparse layout: landing, hero, marketing)
```
A───────────────────B
                ╱
              ╱
            ╱
          ╱
C───────────────────D
```
- A: Logo + brand
- B: Primary CTA top-right
- C: Secondary content / social proof
- D: Final CTA / sign-up

→ Trao Tay landing page (`web/app/page.tsx`): áp dụng Z-pattern.
→ Post detail (`web/app/posts/[id]/page.tsx`): F-pattern (long-form info).

---

## 3. Progressive Disclosure

Phức tạp dần — show ít trước, đào sâu khi cần.

### Patterns
- **Expandable section:** "Show more" / accordion
- **Tooltip:** hover hiện thêm context
- **Modal/drawer:** đào sâu detail không rời page
- **Multi-step form:** Wizard 3 step thay vì 1 form 30 field
- **Settings hierarchy:** common settings top, advanced ẩn

### Anti-pattern
- Show 50 option cùng lúc → user đông lạnh (Hick's Law violation)
- Hide critical info trong "Advanced" → user không tìm được

---

## 4. Visual Design

### 4.1 Type scale (Modular Scale)

Thay vì random font size, dùng ratio scale:
```
Major Third (1.25):
12 → 15 → 19 → 24 → 30 → 38 → 47 → 59

Perfect Fourth (1.333):
12 → 16 → 21 → 28 → 37 → 50 → 67 → 89

Golden Ratio (1.618):
12 → 19 → 31 → 50 → 81 → ... (dramatic)
```

→ Trao Tay dùng Major Third → balance, harmonic.

### 4.2 Line height + line length

| Type | Line height | Line length (CPL) |
|---|---|---|
| Body text | 1.5-1.75 | 50-75 chars |
| Headline | 1.1-1.3 | 30-50 chars |
| UI label | 1.2-1.4 | < 30 chars |

CPL > 75 → user mệt mắt scan
CPL < 50 → ngắt liên tục, mất context

### 4.3 Color theory

#### Contrast (WCAG 2.2 AA — link ACCESSIBILITY_BASELINE)
- Text normal: 4.5:1 minimum
- Text large (18pt+): 3:1
- UI/icon: 3:1

#### Palette structure
- **Primary** (1 hue + scale 50-900) — brand identity
- **Neutral** (1 hue, often warm grey) — text, border
- **Semantic** (success/warning/error/info) — feedback
- **Surface** (background layers) — depth

#### Color blind safe
- Test với Coblis simulator (Protanopia/Deuteranopia/Tritanopia)
- KHÔNG dùng màu đỏ/xanh là discriminator chính
- Add icon/text bên cạnh color cue

### 4.4 Spacing — 4/8 grid

```
4  → micro (icon padding)
8  → small (between related elements)
16 → medium (between sections)
24 → large (between major blocks)
32 → xlarge (page-level)
48 → xxlarge (hero section)
64 → 2xlarge (between major page parts)
```

→ Trao Tay design v2: tuân Tailwind default (cũng 4-grid).

### 4.5 Iconography

- **Style consistent**: filled HOẶC outlined, KHÔNG mix
- **Stroke width**: 1.5-2px standard
- **Optical size**: 16/20/24/32/48 phổ biến
- **Padding**: minimum 4px khỏi edge
- **Library**: Phosphor / Heroicons / Lucide / Feather (open source) HOẶC custom system

---

## 5. Motion + Microinteractions

### 5.1 Easing curves (Material Design 3)

```css
/* Standard — most UI */
cubic-bezier(0.2, 0.0, 0, 1.0)

/* Accelerate — exit animation */
cubic-bezier(0.3, 0.0, 1.0, 1.0)

/* Decelerate — enter animation */
cubic-bezier(0.0, 0.0, 0.0, 1.0)

/* Emphasized — hero moment */
cubic-bezier(0.05, 0.7, 0.1, 1.0)
```

→ Trao Tay dùng `ease-warm` (custom Vietnamese context).

### 5.2 Duration tokens

| Duration | Use |
|---|---|
| 100ms | Hover, micro-feedback |
| 200ms | Standard transition (button, fade) |
| 300ms | Modal, drawer |
| 500ms | Page transition |
| 1000ms+ | Hero animation, illustration |

> Quá nhanh < 100ms = bỏ lỡ feedback. Quá chậm > 500ms = annoying.

### 5.3 12 Disney Animation Principles (applied to UI)

Top 5 áp dụng UI:
1. **Easing** (slow in/out) — không linear, mọi animation phải easing
2. **Anticipation** — button "thụt vào" trước khi click reaction
3. **Squash & stretch** — nhẹ nhàng (button scale 0.98 khi click)
4. **Follow through** — momentum tiếp tục sau action chính (parallax)
5. **Staggering** — list item xuất hiện lệch nhau 30-50ms

### 5.4 Microinteractions (Dan Saffer)

4 components mỗi microinteraction:
1. **Trigger** — user/system khởi tạo (hover, click, timer)
2. **Rules** — what happens
3. **Feedback** — visual/audio/haptic confirm
4. **Loops + modes** — repeat / state changes

#### Standard microinteractions
- Button press (scale 0.98 + shadow giảm)
- Form field focus (border color + label float)
- Pull to refresh (elastic stretch + spinner)
- Like/heart (scale up + color + particle)
- Toggle switch (slide + color)
- Tooltip (fade + 100ms delay)
- Dropdown (scale từ origin + fade)

### 5.5 Respect `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

User vestibular disorder không bị buồn nôn.

---

## 6. State Coverage — bắt buộc 5 state

Mỗi component có data fetching phải handle:

| State | UI |
|---|---|
| **Empty** | Illustration + message + CTA "Add first item" |
| **Loading** | Skeleton screen (KHÔNG spinner generic) |
| **Error** | Message rõ + retry button + contact |
| **Success** | Data rendered + microinteraction confirm |
| **Partial** | Some loaded, more loading (infinite scroll) |

### Skeleton screen > spinner
- Spinner = "wait" (negative)
- Skeleton = "preview structure" (positive)
- Match exact layout của data sẽ load

### Optimistic UI
Action thay đổi DB → update UI **trước** khi server confirm:
- User click "Like" → heart fill ngay (optimistic)
- API call background
- Nếu fail → rollback + toast error

→ Perceived speed tăng 10x.

---

## 7. Information Architecture

### 7.1 Navigation patterns

| Pattern | When |
|---|---|
| Top bar | < 7 nav items, desktop primary |
| Bottom nav | Mobile, 3-5 main section |
| Side nav | Dashboard, > 7 items hierarchical |
| Hamburger | Secondary nav, mobile collapse |
| Breadcrumb | Deep hierarchy, > 3 level |
| Tab bar | Switch between same context |

### 7.2 Search patterns

- **Auto-suggest** sau 2 chars (Hick — narrow choice)
- **Recent searches** + popular searches
- **Filter + sort** post-results, KHÔNG pre-search
- **Empty state** "No results" + suggestion typo correction
- **Keyboard shortcut** (Cmd+K) cho power user

### 7.3 Form design

- **Label position**: top (best for scan + i18n) > inline
- **Required indicator**: `*` đỏ hoặc text "(required)"
- **Inline validation**: blur event, KHÔNG mỗi keystroke
- **Error message**: dưới field, đỏ + icon
- **Multi-step**: progress bar + back button + save draft
- **Smart defaults**: country auto-detect, format phone
- **Keyboard hints**: `inputmode="numeric"`, `autocomplete`
- **Submit**: disable trong khi processing, KHÔNG hide

---

## 8. Mobile-specific

### 8.1 Touch target

- **Minimum 44×44pt (iOS) / 48×48dp (Android)**
- Spacing giữa target ≥ 8pt
- Avoid hover-only state (touch không hover)

### 8.2 Thumb zone

```
Easy reach (1 thumb):
┌─────────────┐
│ HARD HARD   │
├─────────────┤
│ OK    OK    │
├─────────────┤
│ EASY  EASY  │
└─────────────┘
```

→ Primary action ở **bottom-right** (right-hand) hoặc **bottom-center** (universal)
→ KHÔNG đặt critical action ở **top-left** (cần stretch thumb)

### 8.3 Gestures

| Gesture | Use |
|---|---|
| Tap | Primary action |
| Long press | Secondary menu |
| Swipe left/right | Navigation, dismiss |
| Pull to refresh | Reload list |
| Pinch | Zoom |
| Drag | Reorder, slider |

→ KHÔNG override system gesture (back swipe iOS, hamburger swipe Android)

### 8.4 Bottom sheet > modal

Mobile prefers bottom sheet:
- Trượt từ dưới lên (thumb zone)
- Drag handle để close
- Background dim
- Multi-stage (peek → half → full)

### 8.5 Haptic feedback

- Light impact: button tap
- Medium: confirm action
- Heavy: error, important alert
- Selection: scrolling picker

→ iOS: `UIImpactFeedbackGenerator`. Android: `View.performHapticFeedback`.

---

## 9. Atomic Design (Brad Frost)

```
Atoms        → Button, Input, Label, Icon
   ↓
Molecules    → SearchBar (Input + Button), Card header
   ↓
Organisms    → Header (Logo + Nav + UserMenu), PostCard
   ↓
Templates    → Page layout với placeholder
   ↓
Pages        → Template + real data
```

### Benefits
- Reusable components
- Consistent UX across app
- Easy maintenance
- Storybook isolation

### Tools
- **Storybook**: dev component isolated (recommended)
- **Chromatic**: visual regression test
- **Figma component library**: design-dev sync

---

## 10. Design Tokens (W3C standard draft)

### Categories
```
- Color (palette + semantic)
- Typography (font family, size, weight, line height)
- Spacing (margin, padding, gap)
- Border (radius, width, style)
- Shadow (elevation)
- Motion (duration, easing)
- Z-index (layer)
- Breakpoint (responsive)
```

### Format (W3C Design Tokens Format Module)
```json
{
  "color": {
    "primary": {
      "500": { "value": "#10b981", "type": "color" }
    }
  }
}
```

### Cross-platform sync
- **Style Dictionary** (Amazon) — generate CSS/iOS/Android từ JSON
- **Token Studio** (Figma plugin) — sync Figma ↔ code

→ Trao Tay: Tailwind config + AppTheme Flutter share semantic.

---

## 11. User Research

### 11.1 Persona (3-5 max)
Mỗi persona có:
- Demographic (age, location, occupation)
- Goals (what they want)
- Pain points (current frustration)
- Tech comfort (low/medium/high)
- Quote đặc trưng

### 11.2 User journey map

```
Awareness → Consideration → Decision → Onboard → Retention → Advocacy
   ↓          ↓               ↓          ↓         ↓           ↓
[Touch points + emotion + pain points + opportunities]
```

### 11.3 Usability testing — 5-user rule (Jakob Nielsen)

5 user phát hiện ~85% usability issue. > 5 user diminishing returns.

#### Process
1. Recruit 5 user matching persona
2. Task scenario: "Try to find a free item near you"
3. Think-aloud protocol (user nói khi làm)
4. Record screen + expression
5. Identify issues + severity (1-4)

### 11.4 A/B testing (link `PERFORMANCE_AND_FINOPS.md`)

- Hypothesis trước experiment
- Sample size calculator (statistical significance)
- Run 2-4 tuần minimum (account weekly cycle)
- Avoid running 3+ test cùng lúc (interaction effect)

---

## 12. Performance UI (link `PERFORMANCE_AND_FINOPS.md`)

### Perceived performance > raw performance

User cảm nhận quan trọng hơn millisecond thực:
- **Instant feedback < 100ms** (button press, hover)
- **Skeleton screen** thay loading spinner
- **Optimistic UI** thay đợi server
- **Progress indicator > 1s** (cho action 1-10s)
- **Stagger animation** thay tất cả render cùng lúc (cảm giác nhẹ hơn)

### Core Web Vitals targets
- LCP ≤ 2.5s (largest content paint)
- INP ≤ 200ms (interaction to next paint)
- CLS ≤ 0.1 (cumulative layout shift)

### Image optimization
- Modern format (WebP, AVIF)
- Responsive (`srcset` + `sizes`)
- Lazy load (below fold)
- Aspect ratio CSS (avoid CLS)
- Blur placeholder (perceived faster)

---

## 13. Accessibility (link `ACCESSIBILITY_BASELINE.md`)

WCAG 2.2 Level AA — minimum baseline:
- Color contrast 4.5:1 normal, 3:1 large
- Keyboard nav full + visible focus
- Screen reader semantic HTML + ARIA
- Skip nav link
- Form label + error association
- Touch target 44×44pt minimum
- Respect `prefers-reduced-motion`

---

## 14. Internationalization (link `I18N_STRATEGY.md`)

- Translation key namespace
- ICU MessageFormat (plural, gender)
- Intl API (date, number, currency)
- RTL support qua CSS logical properties
- hreflang SEO

---

## 15. Anti-patterns CẤM tuyệt đối

### Dark patterns (deceptive UX)
- **Forced consent** — KHÔNG cho dùng app cho tới khi accept all
- **Roach motel** — đăng ký dễ, hủy khó
- **Confirm shaming** — "No, I don't want to save money" (manipulative)
- **Hidden costs** — phí xuất hiện cuối checkout
- **Disguised ads** — quảng cáo trông như content

### UX anti-patterns
- **Auto-play video/audio** với sound
- **Cookie banner aggressive** che màn hình
- **Newsletter popup ngay khi vào page**
- **"Are you sure?" everywhere** (annoying — undo > confirm)
- **Modal lồng modal** (3-level deep)
- **Infinite scroll không có pagination footer** (mất navigation)
- **Disable button không cho biết tại sao**
- **Form reset on error** (mất data user)
- **CAPTCHA nhiều bước** (frustration)
- **Notification quá tần suất**

### Visual anti-patterns
- **Centered text > 3 dòng** (khó đọc)
- **All caps body text** (khó đọc)
- **Grey text on grey background**
- **Icon không có label cho nav primary**
- **Truncate text không có tooltip**
- **Animation > 5s loop không pause**

---

## 16. Setup checklist (day 1 dự án mới)

```
[ ] Design system file (UI_DESIGN_SYSTEM.md) với tokens đầy đủ
[ ] UX patterns file (UX_PATTERNS.md) document common flows
[ ] Color contrast verified (axe DevTools)
[ ] Type scale chosen (Major Third hoặc Perfect Fourth)
[ ] Spacing grid (4 hoặc 8)
[ ] Motion tokens (4 duration + 4 easing)
[ ] Component library bắt đầu (atoms first)
[ ] Storybook setup (optional nhưng recommended)
[ ] Accessibility baseline (WCAG 2.2 AA target)
[ ] i18n setup (key namespace, Intl API)
[ ] Performance budget (Lighthouse CI)
[ ] User research persona (3 persona min)
[ ] Mobile-first responsive (Tailwind breakpoint)
[ ] State coverage (empty/loading/error/success/partial)
[ ] Microinteractions documented (5+ standard)
```

---

## 17. Deliverables — UI/UX phải có khi feature complete

Mỗi feature có UI:
- [ ] Design mockup (Figma/Sketch/Excalidraw)
- [ ] Empty/loading/error/success/partial state covered
- [ ] Microinteraction defined (button, form, transition)
- [ ] Touch target ≥ 44pt mobile
- [ ] Keyboard nav + focus state
- [ ] Screen reader test (manual)
- [ ] Color contrast checked
- [ ] Responsive breakpoint test (320, 768, 1024, 1440px)
- [ ] Dark mode (nếu có)
- [ ] i18n translation key (KHÔNG hardcode string)
- [ ] Animation respect `prefers-reduced-motion`

---

## 18. Reference standards (gốc)

- **Apple HIG**: https://developer.apple.com/design/human-interface-guidelines/
- **Material Design 3**: https://m3.material.io/
- **Microsoft Fluent**: https://fluent2.microsoft.design/
- **Carbon (IBM)**: https://carbondesignsystem.com/
- **Polaris (Shopify)**: https://polaris.shopify.com/
- **Atlassian Design**: https://atlassian.design/
- **NN/g 10 Heuristics**: https://www.nngroup.com/articles/ten-usability-heuristics/
- **Atomic Design (Brad Frost)**: https://atomicdesign.bradfrost.com/
- **WCAG 2.2**: https://www.w3.org/WAI/WCAG22/quickref/
- **W3C Design Tokens**: https://design-tokens.github.io/community-group/
