# Trao Tay — Chợ đồ cũ & cho tặng giữa hàng xóm

> *Đồ cũ người này, Báu vật người kia.*

App C2C Việt Nam — mua bán đồ cũ + trao tặng miễn phí. Không phải Shopee.

**Production**: https://traotay.com.vn (landing) · https://api.traotay.com.vn (API) · APK private cho tester Phase 2.

---

## Stack

| Phần | Công nghệ |
|---|---|
| Mobile app | Flutter 3.3+ (Android — iOS sẽ release sau) |
| Backend API | NestJS 10 + Prisma 6 + PostgreSQL 15 |
| Realtime | Socket.IO 4 (chat + notification) |
| Storage | MinIO (S3-compatible) self-hosted, public read |
| Auth | Firebase Phone OTP + Resend Email OTP |
| Payment | PayOS (bump bài đăng 5k/15k VND) |
| Hosting | AWS EC2 t3.micro Singapore + Cloudflare proxy + Let's Encrypt |
| Error tracking | Sentry |

---

## Yêu cầu môi trường dev

| Tool | Version |
|---|---|
| Node.js | ≥ 20 |
| Flutter SDK | ≥ 3.3 |
| PostgreSQL | 15 (qua Docker hoặc local) |
| Docker + Compose | bất kỳ (cho `docker-compose.yml` dev stack) |

---

## Cấu trúc

```
giveaway/
├── app/                      # Flutter mobile (Android/iOS)
│   ├── lib/
│   │   ├── data/             # Constants: provinces 34 tỉnh, categories, coords
│   │   ├── models/           # Post, User, etc.
│   │   ├── providers/        # AuthProvider, NotificationProvider
│   │   ├── screens/          # Tabs + auth + post + chat + profile
│   │   ├── services/         # ApiService, TokenStorage (secure), Analytics
│   │   ├── theme/            # AppTheme tokens (màu, spacing)
│   │   └── widgets/          # FollowButton, CategoryPickerSheet, ProvincePicker, AppLogo
│   └── pubspec.yaml
├── backend/                  # NestJS REST + WebSocket
│   ├── src/
│   │   ├── auth/             # JWT strategy + guard
│   │   ├── admin/            # Admin endpoints + AdminGuard
│   │   ├── user/             # OTP login (phone + email), profile
│   │   ├── post/             # CRUD bài đăng, search, filter
│   │   ├── favorite/         # Lưu bài
│   │   ├── follow/           # Theo dõi user
│   │   ├── deal/             # Yêu cầu giao dịch + state machine
│   │   ├── review/           # Đánh giá sau giao dịch
│   │   ├── chat/             # ChatService + Gateway WS + upload-image
│   │   ├── notification/     # Service + Gateway + Cron + FCM (1 module shared)
│   │   ├── keyword-alert/    # Theo dõi từ khoá
│   │   ├── report/           # Báo cáo bài vi phạm
│   │   ├── bump/             # PayOS webhook + boost tier
│   │   ├── cloudinary/       # Wrapper MinIO upload
│   │   └── fcm/              # Firebase Cloud Messaging push
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── scripts/
│       ├── migrate-provinces-2025.sql      # 63 → 34 tỉnh sau Nghị quyết 202/2025
│       └── migrate-categories-2026.sql     # fashion→clothing, home→furniture, services→service
├── nginx/                    # Production reverse proxy + Cloudflare real IP
├── docker-compose.yml        # Dev stack
├── docker-compose.prod.yml   # Production stack
├── .env.example              # Dev template
├── .env.production.example   # Production template
└── docs/                     # Tài liệu kỹ thuật chi tiết
```

---

## Setup local dev

### 1. Clone + dependencies

```bash
git clone https://github.com/DamThuanHung/giveaway
cd giveaway
cd backend && npm install
cd ../app && flutter pub get
```

### 2. Tạo `.env` cho backend

```bash
cd backend
cp .env.example .env
```

Tối thiểu cần điền (xem chi tiết trong `.env.example`):

```env
# Database (Docker compose mặc định)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/traotay"

# JWT — sinh random 32+ ký tự: openssl rand -base64 32
JWT_SECRET="..."

# Dev login bypass (chỉ dùng local, không deploy production)
DEV_SECRET="..."

# Resend (email OTP) — đăng ký free tại resend.com
RESEND_API_KEY="re_..."

# Firebase (phone OTP) — file service-account.json từ Firebase Console
# Đặt tại: backend/firebase-service-account.json (gitignored)

# MinIO (storage ảnh) — Docker compose tự khởi động
MINIO_ENDPOINT="localhost"
MINIO_ACCESS_KEY="minioadmin"          # đổi nếu chạy production
MINIO_SECRET_KEY="minioadmin123"        # đổi nếu chạy production
MINIO_BUCKET="traotay"
MINIO_PUBLIC_URL="http://localhost:9000"

# PayOS (bump payment) — đăng ký my.payos.vn (skip nếu không test bump)
PAYOS_CLIENT_ID="..."
PAYOS_API_KEY="..."
PAYOS_CHECKSUM_KEY="..."
```

### 3. Khởi động database + storage

```bash
# Từ project root
docker compose up -d
```

Postgres trên `localhost:5432`, MinIO trên `localhost:9000` (console `:9001`).

### 4. Chạy migration + generate Prisma client

```bash
cd backend
npx prisma db push       # Sync schema với DB (chưa cần migration file ở dev)
npx prisma generate
```

### 5. Chạy backend

```bash
npm run start:dev        # Auto-reload khi đổi code
```

Server tại `http://localhost:3800`. Smoke test:

```bash
curl http://localhost:3800/health
# {"status":"ok","timestamp":"..."}
```

### 6. Chạy Flutter app

App mặc định trỏ về `http://192.168.0.108:3800` (xem `app/lib/services/api_service.dart`). Đổi qua `--dart-define`:

```bash
cd app
flutter run --dart-define=API_URL=http://<LAN_IP>:3800
```

`<LAN_IP>` là IP máy chạy backend trong cùng WiFi (Windows: `ipconfig` → `IPv4 Address`).

---

## Authentication flow

App **KHÔNG dùng password**. Login qua OTP:

| Cách | Endpoint | Provider |
|---|---|---|
| Số điện thoại | `POST /user/phone-login` | Firebase Phone Auth (verify ID token) |
| Email | `POST /user/email-login/send` → `/verify` | Resend (gửi mã 6 số) |
| Dev (chỉ local) | `POST /user/dev/login` | DEV_SECRET — disabled ở production |

JWT trả về sống 7 ngày, lưu trong `flutter_secure_storage` (Android Keystore / iOS Keychain).

---

## Production setup

Xem `docs/AWS_SETUP.md` (click-by-click setup AWS EC2 free tier) và `docs/PRODUCTION_CHECKLIST.md` (16 sections: pre-deploy, deploy, post-deploy, rollback).

Quan trọng:
- `.env.docker` ở `/opt/traotay/repo/.env.docker` (chmod 600).
- 4 secrets bắt buộc cho production: `JWT_SECRET`, `POSTGRES_PASSWORD`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` — phải khác default.
- Build container: `docker compose -f docker-compose.prod.yml --env-file .env.docker up -d --build backend`
- Backup local cron 3AM VN giữ 14 ngày tại `/opt/traotay/backups/`.

---

## Tài liệu kỹ thuật

| File | Nội dung |
|---|---|
| [docs/CORE_FRAMEWORK.md](docs/CORE_FRAMEWORK.md) | Kiến trúc, API endpoints, conventions |
| [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) | Schema DB, quan hệ bảng |
| [docs/PROJECT_KNOWLEDGE.md](docs/PROJECT_KNOWLEDGE.md) | Thuật ngữ + business rules |
| [docs/UI_DESIGN_SYSTEM.md](docs/UI_DESIGN_SYSTEM.md) | Màu, typography, components |
| [docs/UX_PATTERNS.md](docs/UX_PATTERNS.md) | Luồng UX, patterns |
| [docs/AI_RULES.md](docs/AI_RULES.md) | Quy tắc viết code khi dùng AI assist + Decision Log |
| [docs/PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md) | Check list deploy production |
| [docs/AWS_SETUP.md](docs/AWS_SETUP.md) | Setup AWS EC2 từng bước |
| [docs/AUDIT_2026-04-28.md](docs/AUDIT_2026-04-28.md) | Audit toàn diện 4 nhánh, 23 issues |
| [docs/modules/_index.md](docs/modules/_index.md) | Danh sách module + link |

---

## License

Mã nguồn private — không open source. © 2026 Trao Tay.
