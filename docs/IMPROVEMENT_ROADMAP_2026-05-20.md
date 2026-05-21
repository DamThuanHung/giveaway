# Improvement Roadmap — 2026-05-20

> **Context**: Đợi Google review đơn xin Production access trên Play Store
> (~3-7 ngày). Trong giai đoạn này, audit toàn diện Trao Tay để cải tiến
> tất cả các mặt (Mobile + Web + Backend + Infra).
>
> **Constraint**: KHÔNG build AAB mobile mới + KHÔNG touch Closed Testing
> track trong 7 ngày này. Code mobile thay đổi OK, web/backend deploy
> tự do.
>
> **Scope**: ~55 issues qua 4 module, phân theo severity P0/P1/P2/P3.

---

## Tóm tắt

| Module | Issues | P1 | P2 | P3 |
|---|---|---|---|---|
| Mobile (Flutter) | 15 | 4 | 7 | 4 |
| Web (Next.js) | 13 | 3 | 7 | 3 |
| Backend (NestJS) | 13 | 5 | 7 | 1 |
| Infra + cross-cutting | 10 | 3 | 5 | 2 |
| **Tổng** | **51** | **15 P1** | **26 P2** | **10 P3** |

Không có P0 (critical block). Tất cả đều improvement.

---

## 1. Mobile (Flutter) — 15 issues

| # | Category | Issue | Sev | Effort | Impact | Files | Đề xuất fix |
|---|---|---|---|---|---|---|---|
| M-01 | UX | Còn "tin đăng" trong 3 file (đã chốt dùng "Bài đăng") | P1 | S | M | `home_tab.dart:595,642`, `favorites_tab.dart:144`, `my_posts_screen.dart:84,427` | Replace "tin đăng" → "bài đăng" all caps |
| M-02 | UX | Onboarding screen 3 slide info nhưng KHÔNG collect data | P1 | M | H | `onboarding_screen.dart` | Sau swipe 3 slide, redirect collect-profile flow (name + avatar + location ward) |
| M-03 | UX | Empty state home thiếu CTA "Đăng bài đầu tiên" | P1 | S | M | `home_tab.dart:558-565` | EmptyState thêm secondary action "Đăng bài đầu tiên" khi user đã đăng nhập |
| M-04 | Brand | Banner "Miễn phí" copy không match slogan brand | P1 | S | L | `home_tab.dart:670-677` | "Khám phá đồ miễn phí gần bạn" → "Đồ cũ người này, Báu vật người kia 🌱" |
| M-05 | Performance | _loadFavorites() gọi mỗi navigate back → spam API | P2 | M | M | `home_tab.dart:625` | Cache favorites trong AuthProvider, invalidate khi toggle, không refetch khi navigate |
| M-06 | Code quality | 103 lần `withOpacity` deprecated trong Flutter 3.27+ | P2 | M | L | 25 files | Migrate sang `withValues(alpha:)` — script find-replace |
| M-07 | Code quality | 20 lần `debugPrint`/`print` rải rác | P2 | S | L | 15 files | Thay bằng logger có level (info/warn/error) hoặc strip ở production build |
| M-08 | Performance | Nominatim API call không có timeout/error UI | P2 | S | L | `home_tab.dart:113-115` | Catch + log + show toast "Không xác định được vị trí, dùng Toàn quốc" khi fail |
| M-09 | Architecture | 3 file > 1200 lines (home_tab, search_tab, post_detail) | P2 | L | M | `home_tab.dart`, `search_tab.dart`, `post_detail_screen.dart` | Refactor split — tách helper widgets + extract logic provider |
| M-10 | UX | Skip button onboarding luôn visible → user bypass collect-profile | P2 | S | L | `onboarding_screen.dart:66-72` | Bỏ Skip ở slide cuối, force collect-profile (P1) |
| M-11 | Instrumentation | Không có analytics event mobile (post-create/share/signup) | P2 | M | M | `services/analytics.dart` (nếu có) | Add event tracking: `analytics.event('post_created', {category, hasPrice})` etc. |
| M-12 | UX | Login prompt khi tap favorite không có context | P2 | S | L | `home_tab._showLoginPrompt` | Dialog rõ ràng "Đăng nhập để lưu bài này" + button Đăng nhập primary |
| M-13 | Performance | PostCard không preload ảnh next trong grid | P3 | M | L | `post_card.dart`, `home_tab.dart` | Sử dụng `precacheImage()` với 2-3 ảnh kế tiếp khi scroll |
| M-14 | UX | Splash screen 365 lines, có thể overkill | P3 | M | L | `splash_screen.dart` | Review xem có animation/logic nào dư không, đơn giản hoá |
| M-15 | A11y | Thiếu Semantics label cho icon buttons (favorite, share, bell) | P3 | M | L | nhiều widget | Wrap IconButton với `Tooltip` + `Semantics(label: ...)` |

---

## 2. Web (Next.js) — 13 issues

| # | Category | Issue | Sev | Effort | Impact | Files | Đề xuất fix |
|---|---|---|---|---|---|---|---|
| W-01 | UX | Missing onboarding flow sau signup (activation 0%) | P1 | L | H | `app/login/page.tsx` + new `app/onboarding/` | Sau verify OTP → redirect collect minimal profile (name + avatar + ward) |
| W-02 | UX | Empty state user chưa có bài thiếu step-by-step | P1 | S | H | `app/me/page.tsx:263` | Thêm "3 bước đăng bài trong 2 phút" + icon + link tutorial |
| W-03 | A11y | Header logo missing alt text (link chính nav) | P1 | S | M | `components/Header.tsx:26` | `alt="Trao Tay — Logo"` + role="img" aria-label |
| W-04 | Code Quality | Multiple `as any` bypass TypeScript strict | P2 | M | M | `components/PostsExplorer.tsx:79`, `FavoriteButton.tsx`, `PostMap.tsx:17` | Replace với explicit type union |
| W-05 | SEO | Sitemap `lastmod` lấy build time thay vì `bumpedAt`/`updatedAt` | P2 | S | M | `app/sitemap.xml/route.ts` | Dynamic lastmod từ post.bumpedAt — match crawler expectation |
| W-06 | Performance | Leaflet CSS import blocking render | P2 | M | M | `components/PostMap.tsx:4` | Lazy load CSS via `<link rel="preload">` + dynamic import |
| W-07 | SEO | Schema.org Product thiếu dateModified + author.url | P2 | S | M | `app/posts/[id]/page.tsx:88-109` | Add `dateModified: post.bumpedAt`, `author.url: /users/{id}/` |
| W-08 | Performance | Không có srcset / responsive images → mobile waste bandwidth | P2 | M | M | `PostCard.tsx:49`, `app/page.tsx:110` | Add `sizes="(max-width:768px) 100vw, 50vw"` cho `<img>` |
| W-09 | UX | Suspense fallback "Đang tải..." chung chung, không skeleton | P2 | S | L | `app/posts/page.tsx:38` | Reuse `PostCardSkeleton` component, tránh layout shift |
| W-10 | UX | ContactSellerButton error generic "Không tạo được phòng chat" | P2 | S | M | `components/ContactSellerButton.tsx:35` | Specific error + onRetry callback |
| W-11 | Performance | Font Be Vietnam Pro không preload → render delay 200ms | P3 | M | M | `app/layout.tsx:11-16` | `<link rel="preload" as="font" type="font/woff2" crossOrigin>` |
| W-12 | Code Quality | 13+ file `// eslint-disable @next/next/no-img-element` | P3 | M | L | nhiều file | Migrate core image components sang `next/image` từng bước |
| W-13 | SEO | Không có hreflang tag (chỉ vi, optional) | P3 | M | L | `app/layout.tsx` | Add `<link rel="alternate" hreflang="vi" />` self-ref |

---

## 3. Backend (NestJS) — 13 issues

| # | Category | Issue | Sev | Effort | Impact | Files | Đề xuất fix |
|---|---|---|---|---|---|---|---|
| B-01 | Security | JWT TTL 7 ngày — quá dài | P1 | S | H | `app.module.ts:46` | Đổi access token 1h + refresh token 30d với rotation |
| B-02 | Security | Backdoor Play reviewer login không log audit | P1 | S | H | `user/user.service.ts:374-388` | Add AdminActionLog entry mỗi lần backdoor login |
| B-03 | Performance | getUserReviews() N+1 (findMany + aggregate riêng) | P1 | M | H | `review/review.service.ts:126-159` | 1 query aggregate với `_avg` trong select |
| B-04 | Code Quality | OTP Map unbounded → memory leak khi scale | P1 | S | H | `user/user.service.ts:28-49` | Cleanup khi Map size > 10k, hoặc migrate Redis |
| B-05 | Security | CORS origin=true ở dev có thể lọt qua prod | P1 | S | H | `main.ts:62-67` | Assert `if (NODE_ENV==='production' && !CORS_ORIGIN) throw` |
| B-06 | Security | AdminGuard re-verify JWT thủ công + re-query DB | P2 | S | M | `admin/admin.guard.ts` | Dùng @UseGuards(JwtAuthGuard, AdminGuard) — JWT đã verify trong middleware |
| B-07 | Code Quality | PostView.upsert swallow error không log | P2 | S | M | `post/post.service.ts:213-217` | Add `logger.warn()` để track fail rate, monitor metric |
| B-08 | Security | File upload không validate size ở controller (chỉ multer limit) | P2 | S | M | `post/post.controller.ts:74,106` | Defense-in-depth: check `file.size > 5MB` ở controller |
| B-09 | Architecture | Missing DTO validation — không dùng class-validator pipes | P2 | M | M | `post/post.controller.ts:27,75` | Tạo CreatePostDto/UpdatePostDto với @IsString @MaxLength |
| B-10 | Code Quality | Notification.createNotification() không tách FCM + WebPush error | P2 | S | M | `notification/notification.service.ts:71-94` | Split function + log separated error |
| B-11 | Performance | getMyStats() 5 parallel count() — có thể slow khi scale | P2 | M | M | `post/post.service.ts:472-490` | Monitor; nếu chậm, dùng 1 aggregation query |
| B-12 | Code Quality | Favorite.getFavorites() không filter null post sau include | P2 | S | L | `favorite/favorite.service.ts:72-75` | Add `.filter(f => f.post)` defensive |
| B-13 | Performance | $queryRaw KeywordAlert document rõ injection safe | P3 | S | L | `keyword-alert/keyword-alert.service.ts:66-77` | Comment giải thích Prisma.join() an toàn |

---

## 4. Infrastructure + Cross-cutting — 10 issues

| # | Category | Issue | Sev | Effort | Impact | Files | Đề xuất fix |
|---|---|---|---|---|---|---|---|
| I-01 | Monitoring | Sentry chưa deploy — production error fly blind | P1 | M | H | `backend/.env.docker`, `docs/MONITORING_SETUP.md` | `npm i @sentry/node`, set SENTRY_DSN, test error trigger |
| I-02 | Backup/DR | Backup restore drill chưa test bao giờ | P1 | M | H | `scripts/backup.sh`, R-003 risk | Schedule DR drill — restore B2 dump → staging → verify |
| I-03 | Communication | No public status page (zero incident comm) | P1 | S | H | new (statuspage.io/Cachet) | Deploy statuspage.io free tier, link từ Play Store listing |
| I-04 | Testing | Zero E2E test automation (chỉ mental walkthrough) | P2 | L | H | `.github/workflows/`, `docs/TEST_PROTOCOL.md` | Add Cypress/Playwright smoke test job — OTP flow + signup |
| I-05 | Monitoring | UptimeRobot incomplete — /health endpoint chưa confirm | P2 | S | M | `docs/MONITORING_SETUP.md:91-103` | Verify backend /health route + UptimeRobot xanh + alert > 5min |
| I-06 | Deploy | web-rebuild.sh fragile PATH assumption | P2 | S | M | `scripts/web-rebuild.sh:14` | `which node` check explicit, dùng `npm ci` thay `npm install` |
| I-07 | Security | NODE_ENV=production chưa document required | P2 | S | M | `docs/PRODUCTION_CHECKLIST.md:131`, `.env.example` | Add explicit checklist + grep backend dev-only code |
| I-08 | Deploy | Rollback manual 30+ min, không automated | P2 | M | M | `docs/PRODUCTION_CHECKLIST.md:557` | Pre-deploy git tag snapshot, 1-click rollback script |
| I-09 | Backup | B2 bucket policy chưa specify (versioning/lifecycle/encryption) | P3 | S | M | `scripts/backup.sh:29` | Enable B2 versioning + lifecycle 30d + encryption at rest |
| I-10 | Testing | CI không có test coverage check (chỉ audit) | P3 | M | M | `.github/workflows/standards-check.yml` | Add `npm test` job, fail PR nếu coverage drop |

---

## Top 15 P1 issues — đề xuất execute trong 5 ngày tới

Thứ tự ưu tiên dựa trên **impact / effort ratio** + dependency:

### Day 1 — Quick wins (Mobile + Web nhanh)
1. **M-01** Replace "tin đăng" → "bài đăng" (S, 30 phút) ⚡
2. **M-04** Banner Miễn phí copy đúng slogan (S, 15 phút) ⚡
3. **W-03** Header logo alt text (S, 10 phút) ⚡
4. **M-03** Empty state home + CTA đăng bài (S, 30 phút) ⚡

### Day 2 — Backend security + perf
5. **B-04** OTP Map cleanup → memory leak fix (S, 1h)
6. **B-05** CORS production assert (S, 30 phút)
7. **B-01** JWT TTL 1h + refresh token (S, 2h)
8. **B-03** getUserReviews() N+1 → 1 query (M, 2h)

### Day 3 — Backend security + audit
9. **B-02** Backdoor login audit log (S, 30 phút)

### Day 4 — Web UX deep
10. **W-02** Empty state user posts + step-by-step (S, 1h)
11. **W-01** Onboarding flow sau signup web (L, 4-5h)

### Day 5 — Mobile UX deep + Infra
12. **M-02** Mobile onboarding collect-profile (M, 3-4h)
13. **I-01** Sentry deploy (M, 2-3h)
14. **I-02** Backup restore drill (M, 2h)
15. **I-03** Status page setup (S, 1h)

**Total estimate**: 25-30 giờ thực, 5 ngày làm việc.

---

## P2 issues — defer roadmap sau 5 ngày

26 P2 issues spread across 4 modules. Sau khi xong P1 + Google approve Production, làm batch theo tháng:

- **Tháng 6**: B-06 đến B-11 backend tightening + I-04 E2E test
- **Tháng 7**: M-05 đến M-13 mobile polish + W-04 đến W-10 web polish
- **Tháng 8**: Refactor file lớn M-09, accessibility M-15, performance M-13

P3 issues: defer indefinite, làm khi có thời gian.

---

## Constraint suốt 7 ngày này

- ⛔ KHÔNG build AAB mobile mới upload Play Console
- ⛔ KHÔNG touch Closed Testing track
- ⛔ KHÔNG schema change Prisma trong 7 ngày này (memory `feedback_prisma_db_push_after_schema_change` áp dụng — chỉ làm khi cần thật)
- ✅ Mobile code thay đổi OK — fix gộp vào version Production submit cuối
- ✅ Web/backend deploy tự do
- ✅ Docs/scripts update tự do

---

## Cập nhật

| Date | Change |
|---|---|
| 2026-05-20 | Doc tạo. 4 audit (Mobile + Web + Backend + Infra) consolidated. 51 issues, 15 P1 đề xuất execute 5 ngày tới. |
