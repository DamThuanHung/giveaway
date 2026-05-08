# i18n Strategy — Internationalization

> Universal. ICU MessageFormat + Intl API + RTL support.
> Áp dụng từ ngày đầu nếu có khả năng đa ngôn ngữ — refactor sau cực đắt.

---

## 1. Quyết định ban đầu — Single vs Multi-language

### Single language
- Solo founder, target 1 thị trường, MVP
- Vietnam local app
- Tốc độ ship > i18n flexibility

→ **Vẫn nên** dùng translation key system từ đầu (string không hardcode trong UI), để switch sang multi sau dễ.

### Multi-language
- Target multiple country
- B2B với customer toàn cầu
- Compliance yêu cầu (vd EU: localize cho mỗi member state)

→ Bắt buộc i18n đầy đủ + RTL nếu có Arabic/Hebrew.

---

## 2. Tech stack

### Web (React/Vue/Svelte)
- **next-intl** (Next.js native) — recommended
- **react-i18next** — mature, ecosystem lớn
- **FormatJS / react-intl** — Yahoo, ICU MessageFormat
- **vue-i18n** (Vue 3)
- **svelte-i18n** (Svelte)

### Mobile
- Flutter: `flutter_localizations` + `intl` package
- React Native: `i18next` + `react-i18next`
- iOS native: `.strings` files + `NSLocalizedString`
- Android native: `strings.xml` + `getString()`

### Backend
- Email/notification template → render server-side với user locale
- Error message → return error code, frontend localize
- Locale detection: `Accept-Language` header → fallback `en-US`

---

## 3. Translation key strategy

### Naming convention
```
namespace.section.element_state

home.hero.title
home.hero.subtitle
home.hero.cta_button

post.detail.price_label
post.detail.contact_seller_button
post.detail.contact_seller_button_loading

errors.network.timeout
errors.validation.email_format
```

### Anti-pattern
```
❌ "Đăng nhập"           ← string làm key, đổi UI text → broken
❌ "btn1"                 ← cryptic
❌ "homepageMainTitle"   ← inconsistent với rest
✅ home.hero.title        ← namespace + descriptive
```

### File structure
```
locales/
├── en/
│   ├── common.json
│   ├── home.json
│   ├── post.json
│   └── errors.json
├── vi/
│   ├── common.json
│   └── ...
└── ja/
    └── ...
```

---

## 4. ICU MessageFormat — pluralization + variables

### Variables
```json
{
  "welcome": "Chào {name}",
  "post_count": "{count, plural, =0 {Chưa có bài} =1 {1 bài} other {# bài}}"
}
```

### Use case
```js
t('welcome', { name: 'Hung' })
// → "Chào Hung"

t('post_count', { count: 0 })   // "Chưa có bài"
t('post_count', { count: 1 })   // "1 bài"
t('post_count', { count: 5 })   // "5 bài"
```

### Plural rules — khác mỗi ngôn ngữ
- English: 0/1, other → 2 forms
- Vietnamese: không có plural form formal → 1 form
- Russian: 5 forms (1, 2-4, 5+, fractional, ...)
- Arabic: 6 forms

→ Dùng ICU `plural` chuẩn để framework tự handle.

### Gender
```json
{
  "user_status": "{gender, select, male {Anh ấy} female {Cô ấy} other {Họ}} đang online"
}
```

### Nested
```json
{
  "post_with_count": "{count, plural, =0 {Chưa có bài} =1 {1 bài} other {# bài}} của {name}"
}
```

---

## 5. Date / Number formatting

### Use Intl API (browser native)
```js
// Date
new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'long',
  timeStyle: 'short'
}).format(new Date());
// → "8 tháng 5, 2026 lúc 13:00"

// Number
new Intl.NumberFormat('vi-VN').format(1234567);
// → "1.234.567"

// Currency
new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND'
}).format(200000);
// → "200.000 ₫"

// Relative time
new Intl.RelativeTimeFormat('vi-VN').format(-3, 'hour');
// → "3 giờ trước"
```

### KHÔNG hardcode format
❌ `${date.getDate()}/${date.getMonth()+1}/${date.getFullYear()}`
- Ngược locale (US: m/d/y, VN: d/m/y)
- Manual format error-prone

✅ `new Intl.DateTimeFormat(locale).format(date)`

---

## 6. RTL support (Arabic, Hebrew, Persian, Urdu)

### CSS
```css
html[dir="rtl"] .container {
  /* Auto-flip với logical properties */
}

/* Logical properties (modern, RTL-aware) */
.box {
  margin-inline-start: 1rem;  /* margin-left in LTR, margin-right in RTL */
  padding-block: 0.5rem;       /* padding-top + padding-bottom */
  border-inline-end: 1px;
}
```

### Avoid
- `margin-left`, `padding-right` (physical) → dùng logical
- Icon hard-coded direction (➡️ → break trong RTL)
- Number formatting hard-coded direction

### Testing
- Toggle `<html dir="rtl">` trong DevTools
- Test Arabic/Hebrew text content (chiều đảo)
- Mixed LTR-RTL (vd brand name English trong Arabic context)

---

## 7. Locale detection + fallback

### Priority order
1. User preference (saved in profile/cookie/localStorage)
2. URL param (`?lang=en`)
3. Accept-Language header (browser)
4. Geo IP (last resort, không reliable)
5. Default fallback (vd `en-US`)

### Fallback chain
```
zh-Hant-HK → zh-Hant → zh → en
```

### URL strategy
```
/en/about    ← path prefix (recommended cho SEO)
/about?lang=en    ← query (avoid)
en.example.com/about    ← subdomain (cost cao)
```

---

## 8. Translation workflow

### Solo + AI
- AI dịch first pass
- User review (nếu rành ngôn ngữ target)
- Native speaker review (paid for important content)

### Team
- Translation Management System (TMS): Crowdin, Lokalise, Phrase, Weblate
- Workflow: dev → extract key → upload TMS → translator → import → release
- Glossary + style guide cho consistency

### Anti-pattern
- Google Translate paste cho production (literal, không context)
- Translator không có UI screenshot (dịch sai context)
- Update string mà không bump translation TMS

---

## 9. SEO multi-language

### hreflang tags
```html
<link rel="alternate" hreflang="vi" href="https://example.com/vi/about" />
<link rel="alternate" hreflang="en" href="https://example.com/en/about" />
<link rel="alternate" hreflang="x-default" href="https://example.com/about" />
```

### URL strategy
- Subdirectory: `/en/`, `/vi/` — recommended
- Subdomain: `en.example.com` — harder SEO authority transfer
- ccTLD: `example.vn`, `example.de` — strongest local signal, expensive

### Sitemap
- Multi-language sitemap với `xhtml:link` hreflang
- Submit Google Search Console mỗi locale

---

## 10. Pluralization edge cases

### Languages with > 2 plural forms
- Cyrillic (Russian, Ukrainian): 4 forms
- Arabic: 6 forms
- Polish: 3-4 forms

→ ICU `plural` BẮT BUỘC, không if-else manual.

### Gender + plural combined
```json
{
  "comments_count": "{count, plural, =0 {Chưa có} =1 {1 bình luận} other {# bình luận}}"
}
```

Nếu cần gender + plural → ICU `select` lồng `plural`.

---

## 11. Anti-patterns

| Anti-pattern | Đúng |
|---|---|
| Hardcode "Đăng nhập" trong JSX | `t('login.button')` |
| Concat string `t('hello') + ' ' + name` | ICU variable `{name}` |
| `if (count > 1) "items" else "item"` | ICU `plural` |
| Date `dd/MM/yyyy` cho mọi locale | Intl.DateTimeFormat |
| Currency hardcode `${price} đ` | Intl.NumberFormat currency |
| `margin-left` (physical) | `margin-inline-start` (logical) |
| Translation key = English text | Namespace key |
| Dịch xong không review native speaker | Review hoặc beta test với user thật |
| Single locale file `i18n.json` toàn bộ | Split theo namespace |

---

## 12. Setup checklist (day 1)

```
[ ] i18n library chosen + documented (next-intl / react-i18next / etc.)
[ ] Translation key naming convention
[ ] Locale folder structure
[ ] Default + fallback locale
[ ] URL strategy (subdirectory recommended)
[ ] Intl API cho date/number (KHÔNG manual format)
[ ] ICU MessageFormat cho plural/gender
[ ] CSS logical properties (RTL ready)
[ ] hreflang tags trong head
[ ] Locale detection priority
[ ] Translation extraction script
[ ] CI: detect missing translation key
```
