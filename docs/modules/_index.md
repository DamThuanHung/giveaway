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

---

## Backend Modules (NestJS)

| Module | File tài liệu | Trạng thái | Mô tả |
|---|---|---|---|
| Auth | *(trong CORE_FRAMEWORK.md)* | — | JwtAuthGuard, JwtStrategy |
| User | [user.md](user.md) | Cần cập nhật | Đăng ký, đăng nhập, profile, block, link-email |
| Post | [post.md](post.md) | Cần cập nhật | Bài đăng (CRUD, Cloudinary upload) |
| Chat | [chat.md](chat.md) | Cần cập nhật | WebSocket Gateway + REST rooms + messages |
| Notification | *(chưa có)* | Thiếu | FCM push + in-app notifications + /dev endpoints |
| Favorite | [favorite.md](favorite.md) | Cần cập nhật | Yêu thích bài đăng |
| Follow | *(chưa có)* | Thiếu | Follow user, feed |
| Deal | *(chưa có)* | Thiếu | Giao dịch xin nhận đồ |
| Review | *(chưa có)* | Thiếu | Đánh giá sau deal |
| Report | [report.md](report.md) | Cần cập nhật | Báo cáo bài đăng vi phạm |
| Cloudinary | *(chưa có)* | Thiếu | Upload ảnh lên Cloudinary CDN |
| FCM | *(chưa có)* | Thiếu | Firebase Cloud Messaging service |
| Admin | *(chưa có)* | Thiếu | Quản trị hệ thống |
| Prisma | *(trong DATABASE_SCHEMA.md)* | — | Database ORM service |

## Flutter Modules (Screens & Providers)

| Module | Màn hình chính | Trạng thái | Mô tả |
|---|---|---|---|
| Onboarding | `onboarding_screen.dart` | Done | Màn hình giới thiệu lần đầu |
| Auth | `phone_login_screen.dart`, `login_screen.dart`, `register_screen.dart` | Done | Đăng nhập SĐT + email |
| Home | `home_tab.dart` | Done | Trang chủ — danh sách + filter category |
| Search | `search_tab.dart` | Done | Tìm kiếm bài đăng |
| Post Detail | `post_detail_screen.dart` | Done | Chi tiết bài đăng |
| Post Create | `post_create_screen.dart` | Done | Đăng bài mới |
| Favorites | `favorites_tab.dart` | Done | Danh sách yêu thích |
| Messages | `messages_tab.dart`, `chat_screen.dart` | Done | Danh sách chat + chat 1-1 |
| Notifications | `notifications_screen.dart` | Done | Thông báo in-app |
| Profile | `profile_tab.dart` | Done | Hồ sơ cá nhân |
| User Profile | `user_profile_screen.dart` | Done | Hồ sơ user khác |
