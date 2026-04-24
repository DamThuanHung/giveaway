# MODULE INDEX — Danh sách modules

## Tài liệu hệ thống (Đọc đầu mỗi session)

| File | Mục đích |
|---|---|
| [CORE_FRAMEWORK.md](../CORE_FRAMEWORK.md) | Kiến trúc, API endpoints, conventions |
| [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md) | Schema DB đầy đủ |
| [PROJECT_KNOWLEDGE.md](../PROJECT_KNOWLEDGE.md) | Thuật ngữ & business rules |
| [UI_DESIGN_SYSTEM.md](../UI_DESIGN_SYSTEM.md) | Màu sắc, typography, components |
| [UX_PATTERNS.md](../UX_PATTERNS.md) | Luồng UX, patterns tương tác |
| [AI_RULES.md](../AI_RULES.md) | Quy tắc AI viết code & tự học |
| [PRODUCTION_CHECKLIST.md](../PRODUCTION_CHECKLIST.md) | Checklist đầy đủ trước/trong/sau khi lên production — BẮT BUỘC đọc trước deploy |
| [AWS_SETUP.md](../AWS_SETUP.md) | Hướng dẫn click-by-click deploy AWS EC2 free tier ($0/tháng năm 1) |

---

## Backend Modules (NestJS)

| Module | File tài liệu | Trạng thái | Mô tả |
|---|---|---|---|
| Auth | *(trong CORE_FRAMEWORK.md)* | — | JwtAuthGuard, JwtStrategy |
| User | [user.md](user.md) | Cần cập nhật | Đăng ký, đăng nhập, profile, block, link-email |
| Post | [post.md](post.md) | Cần cập nhật | Bài đăng (CRUD, MinIO upload, bump) |
| Chat | [chat.md](chat.md) | Cần cập nhật | WebSocket Gateway + REST rooms + messages |
| Notification | *(chưa có)* | Thiếu | FCM push + in-app notifications + /dev endpoints |
| Favorite | [favorite.md](favorite.md) | Cần cập nhật | Yêu thích bài đăng |
| Follow | *(chưa có)* | Thiếu | Follow user, feed |
| Deal | *(chưa có)* | Thiếu | Giao dịch xin nhận đồ (deal card trong chat) |
| Review | *(chưa có)* | Thiếu | Đánh giá sau deal completed |
| Report | [report.md](report.md) | Cần cập nhật | Báo cáo bài đăng vi phạm |
| KeywordAlert | *(chưa có)* | Thiếu | Theo dõi từ khóa, nhận FCM khi có bài mới khớp |
| Storage (MinIO) | *(chưa có)* | Thiếu | Upload ảnh lên MinIO (self-hosted S3) |
| FCM | *(chưa có)* | Thiếu | Firebase Cloud Messaging service |
| Bump | [bump.md](bump.md) | Done | Đẩy bài 3 tier: Free/Plus/VIP — PayOS webhook, cron reset, dev/boost endpoint |
| Admin | *(trong CORE_FRAMEWORK.md)* | Done | Stats, posts, users, reports, revenue (BumpOrder) |
| Prisma | *(trong DATABASE_SCHEMA.md)* | — | Database ORM service |

## Flutter Modules (Screens & Providers)

| Module | Màn hình chính | Trạng thái | Mô tả |
|---|---|---|---|
| Splash | `splash_screen.dart` | Done | Kiểm tra token, điều hướng vào app |
| Auth | `auth/phone_login_screen.dart`, `auth/email_login_screen.dart` | Done | Đăng nhập OTP SĐT + Email |
| Complete Profile | `auth/complete_profile_screen.dart` | Done | Nhập tên sau khi đăng ký lần đầu (isNewUser = true) |
| Onboarding | `onboarding_screen.dart` | Done | Màn hình chào lần đầu mở app (lưu flag `onboardingDone`) |
| Home | `home_tab.dart` | Done | Trang chủ — danh sách + filter category |
| Map View | `map_view_screen.dart` | Done | Xem bài đăng trên bản đồ (mở từ icon bản đồ trên Trang chủ) |
| Search | `search_tab.dart` | Done | Tìm kiếm bài đăng |
| Post Detail | `post_detail_screen.dart` | Done | Chi tiết bài đăng |
| Post Create | `post/create_post_tab.dart` | Done | Đăng bài mới |
| Messages | `messages_tab.dart`, `chat_screen.dart` | Done | Danh sách chat + chat 1-1 |
| Notifications | `notifications_screen.dart` | Done | Thông báo in-app (grouped by date) |
| Profile | `profile_tab.dart` | Done | Hồ sơ cá nhân |
| My Reviews | `profile/my_reviews_screen.dart` | Done | Đánh giá nhận được |
| Deals | `deal/deals_screen.dart` | Done | Danh sách giao dịch |
| User Profile | `user_profile_screen.dart` | Done | Hồ sơ user khác |
| My Posts | `post/my_posts_screen.dart` | Done | Bài đăng của tôi + nút Đẩy bài |
| Bump Package | `post/bump_package_screen.dart` | Done | Chọn gói boost (Free/Plus/VIP) + PayOSWebView |
| Admin | `admin/admin_dashboard_screen.dart` | Done | Quản trị: Stats/Posts/Users/Reports/Doanh thu |

## Quy trình phát hành

| Module | File tài liệu | Mô tả |
|---|---|---|
| Play Store Screenshots | [playstore-screenshots.md](playstore-screenshots.md) | Quy trình seed data + chụp ADB + resize preview |
