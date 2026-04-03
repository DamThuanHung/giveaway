# MODULE INDEX — Danh sách modules

## Tài liệu hệ thống (Đọc đầu mỗi session)

| File | Mục đích |
|---|---|
| [CORE_FRAMEWORK.md](../CORE_FRAMEWORK.md) | Kiến trúc, API, conventions |
| [DATABASE_SCHEMA.md](../DATABASE_SCHEMA.md) | Schema DB |
| [PROJECT_KNOWLEDGE.md](../PROJECT_KNOWLEDGE.md) | Thuật ngữ & business rules |
| [UI_DESIGN_SYSTEM.md](../UI_DESIGN_SYSTEM.md) | Màu sắc, typography, components |
| [UX_PATTERNS.md](../UX_PATTERNS.md) | Luồng UX, patterns tương tác |
| [AI_RULES.md](../AI_RULES.md) | Quy tắc AI viết code & tự học |

---

## Backend Modules (NestJS)

| Module | File tài liệu | Trạng thái | Mô tả |
|---|---|---|---|
| User | [user.md](user.md) | Có tài liệu | Đăng ký, đăng nhập, quản lý tài khoản |
| Post | [post.md](post.md) | Có tài liệu | Đăng tin, xem tin, upload ảnh |
| Favorite | [favorite.md](favorite.md) | Có tài liệu | Yêu thích bài đăng |
| Report | [report.md](report.md) | Có tài liệu | Báo cáo bài đăng vi phạm |
| Chat | [chat.md](chat.md) | Có tài liệu | Nhắn tin realtime qua WebSocket |
| Prisma | *(trong CORE_FRAMEWORK.md)* | — | Database ORM service |

## Flutter Modules (Screens & Providers)

| Module | Màn hình chính | Mô tả |
|---|---|---|
| Auth | `login_screen.dart` | Đăng nhập / xác thực |
| Home | `home_tab.dart` | Trang chủ — danh sách bài đăng |
| Post Detail | `post_detail_screen.dart` | Xem chi tiết bài đăng |
| Favorites | `favorites_tab.dart` | Danh sách yêu thích |
| Messages | `messages_tab.dart`, `chat_screen.dart` | Tin nhắn |
| Profile | `profile_tab.dart` | Hồ sơ người dùng |
