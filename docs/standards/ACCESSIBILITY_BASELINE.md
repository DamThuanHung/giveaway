# Accessibility Baseline

> WCAG 2.1 Level AA + WAI-ARIA + mobile platform guidelines.
> Universal — quy chuẩn tối thiểu cho mọi dự án có UI.

---

## 1. WCAG 2.1 levels

| Level | Mô tả | Mục tiêu |
|---|---|---|
| A | Minimum, must-have | Loại bỏ blocker tuyệt đối |
| **AA** | Standard, target | Default mọi dự án commercial |
| AAA | Enhanced | Government, healthcare, education |

→ **Default target: AA**.

---

## 2. POUR Principles (WCAG)

### **P**erceivable — User cảm nhận được
- Alt text cho image
- Caption cho video
- Color contrast đủ
- Text resizable không break layout

### **O**perable — User dùng được
- Keyboard navigation đầy đủ
- Đủ thời gian cho action (no aggressive timeout)
- Không nội dung gây seizure (flashing < 3 lần/giây)
- Skip navigation link

### **U**nderstandable — User hiểu được
- Ngôn ngữ rõ
- Predictable behavior
- Error message rõ + đề xuất fix
- Consistent navigation

### **R**obust — Tương thích assistive tech
- Valid HTML
- ARIA đúng (khi cần)
- Compatible với screen reader phổ biến

---

## 3. Color contrast

### Minimum (AA)
| Text type | Contrast ratio |
|---|---|
| Normal text (< 18pt regular, < 14pt bold) | 4.5:1 |
| Large text (≥ 18pt, ≥ 14pt bold) | 3:1 |
| UI component / graphic | 3:1 |

### Test tools
- WebAIM Contrast Checker
- Chrome DevTools → Rendering → Emulate vision deficiencies
- axe DevTools extension
- Stark (Figma plugin)

### Common pitfall
- Light gray text (`#999`) on white (`#fff`) = 2.85:1 → FAIL
- Brand color check sớm — đừng chọn primary contrast yếu rồi mới fix

---

## 4. Keyboard navigation

### Required
- Tab navigate qua mọi interactive element
- Tab order logical (top-bottom, left-right)
- Visible focus indicator (outline) — KHÔNG `outline: none` nếu không thay thế
- Enter/Space activate button
- Escape close modal/dropdown
- Arrow keys trong list/menu
- Skip link "Skip to main content" đầu page

### Anti-pattern
- `tabindex="0"` lung tung → ordering vô lý
- `tabindex="-1"` cho element nên focus được
- Click handler trên `<div>` mà không có keyboard handler
- Custom dropdown không support arrow keys

---

## 5. Screen reader support

### Semantic HTML > ARIA
```html
✅ <button>Submit</button>
❌ <div onclick=...>Submit</div>  (không screen reader friendly)

✅ <nav><ul>...</ul></nav>
❌ <div class="nav">...</div>

✅ <h1>Page title</h1>
❌ <div class="text-2xl">Page title</div>
```

### Khi nào dùng ARIA
- Custom component không có HTML element tương đương (vd custom slider, complex dropdown)
- Live region cho dynamic content (error toast, chat message)
- State không expressible bằng HTML

### ARIA cơ bản
```html
<button aria-label="Close" onclick="close()">×</button>
<div role="alert" aria-live="polite">Error: ...</div>
<input aria-describedby="email-help" />
<div id="email-help">We'll never share your email</div>
<button aria-expanded="false" aria-controls="menu-list">Menu</button>
```

### Test
- NVDA (Windows, free)
- JAWS (Windows, paid)
- VoiceOver (Mac/iOS, built-in)
- TalkBack (Android, built-in)

---

## 6. Form accessibility

### Required
- `<label for="...">` cho mọi input
- Error message associate với field qua `aria-describedby` + `aria-invalid`
- `required` attribute (HTML5) hoặc `aria-required="true"`
- Group related inputs với `<fieldset>` + `<legend>`
- Submit button rõ ràng label

### Error message
```html
<label for="email">Email *</label>
<input
  id="email"
  type="email"
  aria-describedby="email-error"
  aria-invalid="true"
  required
/>
<span id="email-error" role="alert">Email format không hợp lệ</span>
```

### Anti-pattern
- Placeholder làm label (mất khi typing)
- Error chỉ bằng màu đỏ (color-blind không thấy)
- Auto-submit on type (no time to review)
- Reset form sau error (mất data user)

---

## 7. Mobile accessibility

### Touch target size
- Minimum 44×44 pt (iOS) / 48×48 dp (Android)
- Spacing giữa target ≥ 8 pt
- Avoid hover-only state (touch không hover)

### Native platform
- iOS VoiceOver labels (`accessibilityLabel`)
- Android TalkBack (`contentDescription`)
- Dynamic type support (font scale)
- Reduce Motion respect (giảm animation)
- High Contrast mode respect

### Flutter specific
```dart
Semantics(
  label: 'Đăng bài',
  hint: 'Tạo tin đăng mới',
  button: true,
  child: ...,
)
```

### React Native specific
```jsx
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Đăng bài"
  accessibilityHint="Tạo tin đăng mới"
  accessibilityRole="button"
>
  ...
</TouchableOpacity>
```

---

## 8. Image / Media

### Alt text rules
| Image type | Alt text |
|---|---|
| Decorative (icon trong button có text) | `alt=""` (empty) |
| Informative | Mô tả ngắn ý nghĩa |
| Functional (clickable) | Mô tả action, không hình ảnh |
| Complex (chart, infographic) | Long description trong caption hoặc page |

```html
<img src="logo.png" alt="">  <!-- Decorative, có text bên cạnh -->
<img src="cat.jpg" alt="Mèo cam ngủ trên ghế đỏ">  <!-- Informative -->
<a href="/home"><img src="logo.png" alt="Trao Tay - về trang chủ"></a>  <!-- Functional -->
```

### Video / Audio
- Caption (closed) cho video có thoại
- Audio description cho video không thoại quan trọng
- Transcript cho podcast/audio
- Auto-play OFF mặc định, hoặc có pause control

---

## 9. Animation / Motion

### Respect `prefers-reduced-motion`
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Avoid
- Animation > 5s loop không có pause
- Parallax mạnh gây buồn nôn
- Auto-rotate carousel < 5s
- Flash > 3 lần/giây (epilepsy trigger)

---

## 10. Testing strategy

### Automated
- **axe-core** (DevTools / CI) — catch ~30% issue
- **Lighthouse Accessibility** score (CI gate ≥ 90)
- **pa11y** CLI cho automated audit
- ESLint plugin: `eslint-plugin-jsx-a11y` (React)

### Manual
- **Keyboard only** test — Tab qua entire flow
- **Screen reader** test — NVDA/VoiceOver toàn flow critical
- **Zoom 200%** — layout không break
- **High Contrast mode** — vẫn đọc được
- **Color blindness sim** — DevTools

### CI gate (recommended)
```yaml
- name: axe accessibility
  run: npx @axe-core/cli https://localhost:3000 --fail-on-issues
- name: Lighthouse a11y score
  run: lhci autorun --collect.settings.onlyCategories=accessibility
```

---

## 11. Common violations + fix

| Violation | Fix |
|---|---|
| `<button>` không text + không aria-label | Add `aria-label` |
| Image không alt | Add `alt=""` (decorative) hoặc mô tả |
| Color contrast 3.5:1 normal text | Pick darker color → 4.5:1+ |
| Skip nav link không có | Add `<a href="#main">Skip</a>` đầu page |
| `<a href="javascript:void(0)">` | Dùng `<button>` cho action |
| `<div>` clickable | Dùng `<button>` hoặc add role="button" + tabindex + keydown |
| Modal không trap focus | Implement focus trap |
| Form error chỉ màu | Add icon + text |
| Image carousel không pause | Add play/pause button |
| Auto-redirect không cảnh báo | Cảnh báo trước redirect 5s |

---

## 12. Resources

- WCAG 2.1 Quick Reference: https://www.w3.org/WAI/WCAG21/quickref/
- ARIA Authoring Practices: https://www.w3.org/WAI/ARIA/apg/
- WebAIM: https://webaim.org/
- A11y Project: https://www.a11yproject.com/

---

## 13. Setup checklist

```
[ ] Lighthouse a11y score >= 90 (CI gate)
[ ] axe-core integrated trong CI
[ ] eslint-plugin-jsx-a11y bật (React/Vue)
[ ] Color contrast verified cho design system
[ ] Keyboard navigation tested toàn flow critical
[ ] Screen reader smoke test trước mỗi major release
[ ] Mobile touch target audit
[ ] prefers-reduced-motion respect
[ ] Form validation accessible
[ ] Skip nav link
```
