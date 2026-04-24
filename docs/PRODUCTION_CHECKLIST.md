# PRODUCTION CHECKLIST — Trao Tay (traotay.com.vn)

> Checklist đầy đủ cho việc lên production lần đầu và vận hành sau đó.
> Chia 3 giai đoạn: **PRE-PRODUCTION** (chuẩn bị) → **DEPLOY DAY** (ngày lên) → **POST-PRODUCTION** (sau khi live).
>
> Mức độ: 🚨 CRITICAL (không làm = vỡ hoặc hack được) · ⚠️ HIGH (phải làm) · ⚙️ MEDIUM (nên làm) · 💡 LOW (tối ưu)

---

## 📋 MỤC LỤC

1. [PRE-PRODUCTION — Credentials & Secrets](#1-pre-production--credentials--secrets)
2. [PRE-PRODUCTION — Backend Security](#2-pre-production--backend-security)
3. [PRE-PRODUCTION — Dev Endpoints](#3-pre-production--dev-endpoints)
4. [PRE-PRODUCTION — Upload & File Security](#4-pre-production--upload--file-security)
5. [PRE-PRODUCTION — Docker & Infrastructure](#5-pre-production--docker--infrastructure)
6. [PRE-PRODUCTION — MinIO & Storage](#6-pre-production--minio--storage)
7. [PRE-PRODUCTION — Flutter App](#7-pre-production--flutter-app)
8. [PRE-PRODUCTION — Database](#8-pre-production--database)
9. [PRE-PRODUCTION — PayOS (thanh toán)](#9-pre-production--payos-thanh-toán)
10. [PRE-PRODUCTION — Email (Resend)](#10-pre-production--email-resend)
11. [PRE-PRODUCTION — DNS & Domain](#11-pre-production--dns--domain)
12. [PRE-PRODUCTION — Play Store](#12-pre-production--play-store)
13. [DEPLOY DAY](#13-deploy-day)
14. [POST-PRODUCTION — Tuần đầu](#14-post-production--tuần-đầu)
15. [POST-PRODUCTION — Vận hành](#15-post-production--vận-hành)
16. [Rollback Plan](#16-rollback-plan)

---

## 1. PRE-PRODUCTION — Credentials & Secrets

### 🚨 CRITICAL — đổi TẤT CẢ password/secret mặc định
Tất cả trong `.env.docker` hiện đang là giá trị mặc định yếu:

| Biến | Giá trị hiện tại | Yêu cầu production |
|---|---|---|
| `POSTGRES_PASSWORD` | `postgres` | ≥24 ký tự random (dùng `openssl rand -base64 32`) |
| `MINIO_ROOT_PASSWORD` | `minioadmin123` | ≥24 ký tự random |
| `MINIO_SECRET_KEY` | `minioadmin123` | ≥24 ký tự random (có thể giống root password nếu dùng root user, hoặc tạo user riêng) |
| `JWT_SECRET` | `your-secret-key-here` | ≥64 ký tự random |
| `DEV_SECRET` | `traotay_dev_2024` | Đổi hoặc **xóa** sau khi disable dev endpoints |

**Cách generate:**
```bash
openssl rand -base64 32   # cho password
openssl rand -base64 64   # cho JWT
```

### 🚨 CRITICAL — lưu secret ở đâu?
- [ ] **KHÔNG** commit `.env.docker` vào git (đã `.gitignore` — verify lại)
- [ ] Trên VPS: lưu trong `/opt/traotay/.env.docker` với permission `600` (chỉ root đọc)
- [ ] Backup `.env.docker` vào password manager (1Password/Bitwarden) — nếu mất VPS thì khôi phục được
- [ ] Firebase `FCM_SERVICE_ACCOUNT` JSON: lưu như env var thay vì file (đã làm trong code)
- [ ] PayOS `PAYOS_CHECKSUM_KEY` đặc biệt nhạy cảm — lộ key này = attacker fake webhook được

### ⚠️ HIGH — Admin email
- [x] ~~Xóa hardcode fallback `damhungtpt@gmail.com`~~ ✅ commit `ca4c421` — fallback giờ là `''`, phải set env `ADMIN_EMAILS`
- [ ] Set `ADMIN_EMAILS=admin@traotay.com.vn,backup-admin@traotay.com.vn` trong `.env.docker` production

---

## 2. PRE-PRODUCTION — Backend Security

### 🚨 CRITICAL — CORS
- [x] ~~3 nơi `origin: '*'`~~ ✅ commit `ca4c421` — giờ đọc từ env `CORS_ORIGIN` (comma-separated), fallback `true` (reflect origin) khi rỗng
- [ ] Set `CORS_ORIGIN="https://traotay.com.vn,https://www.traotay.com.vn"` trong `.env.docker` production

**Lưu ý:** App mobile không gửi `Origin` header → CORS không ảnh hưởng mobile. Restrict chỉ chặn web.

### ⚠️ HIGH — Security headers (helmet)
- [x] ~~Cài + dùng helmet~~ ✅ commit `ca4c421` — `app.use(helmet())` trước `enableCors`

### ⚠️ HIGH — Rate limiting
- [x] ~~ThrottlerModule global + @Throttle endpoint nhạy cảm~~ ✅ commit `ca4c421`:

| Endpoint | Limit đã set | Ghi chú |
|---|---|---|
| Default toàn bộ | 60/phút/IP | — |
| `POST /user/email-login/send` | 3/phút | ✓ |
| `POST /user/admin-login/send` | 3/phút | ✓ |
| `POST /user/email-login/verify` | 10/phút | ✓ |
| `POST /user/forgot-password/send` | 3/5 phút | ✓ |
| `POST /user/avatar` | 5/phút | ✓ |
| `POST /bump/webhook` | 30/phút | ✓ |
| `POST /post` | 10/giờ | ✓ |
| `POST /chat/room/:id/message` | — | ❓ chưa add (chat qua WebSocket, không qua HTTP throttle) |

### ⚙️ MEDIUM — Logging
- [x] ~~OTP log wrap NODE_ENV~~ ✅ commit `ca4c421` — production throw lỗi thay vì log
- [x] ~~Bỏ hardcode IP LAN trong startup log~~ ✅ commit `ca4c421` — dùng `BASE_URL || localhost:PORT`
- [ ] Đổi toàn bộ `console.log` còn lại sang `Logger` NestJS (quality improvement)

---

## 3. PRE-PRODUCTION — Dev Endpoints

### 🚨 CRITICAL — endpoints đang hoạt động mà chỉ check DEV_SECRET header
Nếu `DEV_SECRET` leak (log, git history, người biết) → toàn bộ data nguy cơ:

| Endpoint | File | Rủi ro |
|---|---|---|
| `POST /user/dev/login` | [user.controller.ts:34](backend/src/user/user.controller.ts#L34) | Bypass OTP, login bất kỳ email |
| `POST /bump/dev/boost` | [bump.controller.ts:51](backend/src/bump/bump.controller.ts#L51) | Boost miễn phí |
| `POST /notification/dev/reset-db` | [notification.controller.ts](backend/src/notification/notification.controller.ts) | **XÓA TOÀN BỘ DATA** |
| `POST /notification/dev/user-debug` | ↑ | Xem nội bộ user |
| `POST /notification/dev/find-user` | ↑ | Tìm user theo email/phone |
| `POST /notification/test-push` | ↑ | Gửi FCM bất kỳ |
| `POST /notification/dev/seed-posts` | ↑ | Sinh data giả |
| `POST /notification/dev/seed-chat` | ↑ | Sinh chat giả |
| `POST /notification/dev/setup-test` | ↑ | Setup test state |

**Đã xử lý (Option A):**
- [x] ~~Check `NODE_ENV === 'production'` để disable~~ ✅ commit `ca4c421`:
  - `user.service.devLogin` throw UnauthorizedException khi production
  - `notification.checkDevSecret` return false khi production (tất cả 9 endpoint dev/ của module này tắt ngay)
  - `bump.dev/boost` throw ForbiddenException khi production
- [ ] Set `NODE_ENV=production` trong `.env.docker` trên VPS (đã có dòng trong `.env.example`)

### ⚠️ HIGH — kiểm tra OTP log
- [x] ~~Wrap NODE_ENV~~ ✅ commit `ca4c421` — production thiếu `RESEND_API_KEY` → throw Error thay vì log OTP ra console

---

## 4. PRE-PRODUCTION — Upload & File Security

### 🚨 CRITICAL — không validate file
[backend/src/cloudinary/cloudinary.service.ts:38-44](backend/src/cloudinary/cloudinary.service.ts#L38-L44):
```ts
async uploadBuffer(buffer: Buffer, folder: string): Promise<string> {
  // ❌ không check size
  // ❌ không check MIME type thật (chỉ set Content-Type: image/jpeg)
  // ❌ không check magic bytes
  await this.client.putObject(this.bucket, filename, buffer, buffer.length, {
    'Content-Type': 'image/jpeg',
  });
}
```

Attacker có thể upload:
- File 1GB → đầy ổ cứng MinIO
- File `.exe`, `.php`, `.sh` rồi abuse URL public để phát tán malware
- Ảnh polyglot (hợp lệ vừa là JPG vừa là HTML) → XSS khi browser render

**Đã fix (commit `ca4c421`):**
- [x] `CloudinaryService.uploadBuffer` — check size ≤ 5MB, MIME allowlist, magic bytes (không tin client)
- [x] `multer` limit `fileSize: 5 * 1024 * 1024, files: 10` ở post + avatar

### ⚙️ MEDIUM — disable static uploads folder
- [x] ~~`app.useStaticAssets(uploadDir, ...)`~~ ✅ commit `ca4c421` — chỉ enable khi `NODE_ENV !== 'production'`

---

## 5. PRE-PRODUCTION — Docker & Infrastructure

### 🚨 CRITICAL — Port exposure
[docker-compose.yml](docker-compose.yml) đang expose 3 port ra host, production chỉ backend `3800` cần:

```yaml
postgres:
  ports:
    - "5432:5432"      # ❌ XÓA — DB không được public
minio:
  ports:
    - "9000:9000"      # ⚠️ Qua Nginx — không direct
    - "9001:9001"      # ❌ XÓA — MinIO console không public
backend:
  ports:
    - "3800:3800"      # ✓ Qua Nginx :443
```

**Fix:**
```yaml
# docker-compose.prod.yml
services:
  postgres:
    # không có "ports:" block → chỉ backend reach qua internal network
    expose:
      - "5432"
  minio:
    expose:
      - "9000"   # Nginx reverse proxy map sang s3.traotay.com.vn
    # KHÔNG expose 9001 (console)
  backend:
    ports:
      - "127.0.0.1:3800:3800"  # Nginx map sang api.traotay.com.vn
```

### 🚨 CRITICAL — Nginx + HTTPS
- [ ] Cài Nginx trên VPS
- [ ] Cấu hình 3 virtual host:
  - `traotay.com.vn` → static landing (có thể `/opt/traotay/public/` hoặc Nginx `return 301` về Play Store)
  - `api.traotay.com.vn` → reverse proxy `127.0.0.1:3800`
  - `s3.traotay.com.vn` → reverse proxy `127.0.0.1:9000`
- [ ] Let's Encrypt HTTPS:
  ```bash
  certbot --nginx -d traotay.com.vn -d api.traotay.com.vn -d s3.traotay.com.vn
  ```
- [ ] Thiết lập auto-renew: `certbot renew --dry-run` (cron đã tự add khi cài certbot)
- [ ] Force HTTPS redirect trong Nginx: `return 301 https://$host$request_uri;`
- [ ] Nginx timeout đủ cho WebSocket: `proxy_read_timeout 86400s` cho route `/socket.io`

### ⚠️ HIGH — Firewall
- [ ] UFW chỉ mở:
  ```bash
  ufw allow 22/tcp    # SSH
  ufw allow 80/tcp    # HTTP (Certbot)
  ufw allow 443/tcp   # HTTPS
  ufw enable
  ```
- [ ] **Không** mở 3800, 5432, 9000, 9001 public

### ⚠️ HIGH — SSH hardening
- [ ] Disable password login: `/etc/ssh/sshd_config` set `PasswordAuthentication no`
- [ ] Disable root login: `PermitRootLogin no`
- [ ] Dùng SSH key (copy `~/.ssh/id_rsa.pub` vào `authorized_keys`)
- [ ] Fail2ban: `apt install fail2ban` — chặn brute-force SSH tự động

### ⚙️ MEDIUM — Resource limits
- [ ] Docker compose thêm `mem_limit`, `cpus` cho mỗi service để 1 service không nuốt VPS
- [ ] Postgres `shared_buffers` tùy RAM VPS

---

## 6. PRE-PRODUCTION — MinIO & Storage

### ⚠️ HIGH — CORS
- [docker-compose.yml:23](docker-compose.yml#L23): `MINIO_API_CORS_ALLOW_ORIGIN: "*"` → đổi thành `https://traotay.com.vn`

### ⚠️ HIGH — MinIO user không-root cho backend
- [ ] Tạo user MinIO riêng cho backend (không dùng root):
  ```bash
  mc admin user add traotay/ backend-svc <password>
  mc admin policy attach traotay/ readwrite --user backend-svc
  ```
- [ ] Cập nhật `MINIO_ACCESS_KEY / SECRET_KEY` trong `.env.docker` sang user mới
- [ ] Root password chỉ để login console console admin

### ⚙️ MEDIUM — Bucket lifecycle
- [ ] Set lifecycle rule: xóa object `deleted_posts/*` sau 30 ngày (dọn storage)
- [ ] Verify bucket policy public read vẫn OK: browser xem ảnh không cần auth

### 💡 LOW — CDN (optional, cho scale sau)
- Cloudflare proxy `s3.traotay.com.vn` → cache ảnh ở edge, giảm bandwidth origin

---

## 7. PRE-PRODUCTION — Flutter App

### 🚨 CRITICAL — Hardcode IP LAN
- [x] ~~`api_service.dart:7` + `chat_socket_service.dart:11`~~ ✅ commit `ca4c421` — dùng `String.fromEnvironment('API_URL', defaultValue: 'http://192.168.0.108:3800')`

**Build production (bắt buộc `--dart-define`):**
```bash
flutter build appbundle --release --dart-define=API_URL=https://api.traotay.com.vn
flutter build apk --release --dart-define=API_URL=https://api.traotay.com.vn
```
**Dev:** không cần `--dart-define` — dùng fallback LAN IP

### ⚠️ HIGH — `isLocal` guard dev features
- [ ] Tìm mọi chỗ hiển thị "Dev login" / "Seed data" trong UI — disable khi `!baseUrl.contains('192.168')` hoặc better: dùng build flavor `kDebugMode`

### ⚠️ HIGH — MinIO URL hiển thị
- Ảnh post đang lưu URL đầy đủ trong DB (e.g. `http://localhost:9000/traotay/posts/xxx.jpg`). Nếu migrate:
  - **Option A:** Migrate DB — UPDATE mọi URL `http://localhost:9000` → `https://s3.traotay.com.vn`
  - **Option B:** Middleware rewrite khi serve JSON ra app (keep DB nguyên)
- [ ] Đề xuất Option A — chạy 1 lần:
  ```sql
  UPDATE "Post" SET "imageLabel" = REPLACE("imageLabel", 'http://localhost:9000', 'https://s3.traotay.com.vn');
  UPDATE "Post" SET "imageUrls" = REPLACE("imageUrls"::text, 'http://localhost:9000', 'https://s3.traotay.com.vn')::text[];
  -- tương tự cho User.avatar, ...
  ```

### ⚠️ HIGH — Android keystore
- [ ] File `app/android/key.properties` đã trong `.gitignore` ✓ (verified)
- [ ] `traotay.jks` cũng đã ignore ✓
- [ ] **Backup keystore vào password manager** — mất keystore = không update Play Store được (phải publish app mới)
- [ ] Verify signing config dùng release keystore, không debug

### ⚙️ MEDIUM — App version
- [ ] `pubspec.yaml` version: tăng `1.0.0+1` → version mục tiêu (semver theo convention)
- [ ] Build APK + AAB (AAB cho Play Store, APK để test sideload)

### ⚙️ MEDIUM — Firebase config
- [ ] `app/android/app/google-services.json` được commit (OK vì Firebase public config)
- [ ] Vào Firebase Console → API key restrictions:
  - Android: chỉ cho package `com.traotay.app` (hoặc tên thực)
  - Restrict API: chỉ FCM, Auth (Phone), Storage
- [ ] iOS `GoogleService-Info.plist` — nếu có plan iOS, chuẩn bị sẵn

---

## 8. PRE-PRODUCTION — Database

### 🚨 CRITICAL — Dọn data test
- [ ] Xóa test users `1@test.com` → `10@test.com` + toàn bộ post/deal/review của họ
- [ ] Xóa fake boostTier đã set manual cho account 1 & 2
- [ ] Chạy `POST /notification/dev/reset-db` 1 lần cuối → sau đó **disable endpoint đó**
- [ ] Verify count: `SELECT COUNT(*) FROM "User"` phải = 0 (hoặc chỉ có admin account)

### ⚠️ HIGH — Migration
- [ ] Chạy `npx prisma migrate deploy` trên production (KHÔNG chạy `prisma db push` — mất migration history)
- [ ] Verify schema match: `npx prisma db pull` so với `schema.prisma`
- [ ] Backup DB TRƯỚC khi chạy migration

### ⚠️ HIGH — Index audit
Đã có các index quan trọng (verified):
- `Post.status`, `Post.province`, `Post.authorId`, `Post.createdAt`, `Post.bumpedAt`, `Post.postType`
- `BumpOrder.userId`, `BumpOrder.postId`, `BumpOrder.status`, `BumpOrder.expiredAt`

Cần thêm (nếu thiếu):
- [ ] `Post` composite index `(status, bumpedAt DESC, createdAt DESC)` cho query home tab
- [ ] `Chat message` index `(roomId, createdAt DESC)` cho query history
- [ ] `Notification` index `(userId, createdAt DESC, isRead)` cho unread count

### ⚠️ HIGH — Backup strategy
- [ ] Daily `pg_dump` tự động → lưu vào Backblaze B2 qua `restic` hoặc `rclone`:
  ```bash
  # /etc/cron.daily/traotay-backup
  docker exec traotay_db pg_dump -U postgres traotay | gzip > /tmp/db-$(date +%F).sql.gz
  rclone copy /tmp/db-*.sql.gz b2:traotay-backups/db/
  ```
- [ ] Retention: daily 7 ngày, weekly 4 tuần, monthly 12 tháng
- [ ] **Test restore** ít nhất 1 lần trước khi tin vào backup
- [ ] Setup alert nếu backup fail (email qua Resend)

### ⚙️ MEDIUM — Connection pool
- [ ] `DATABASE_URL` thêm `?connection_limit=10&pool_timeout=20` (Prisma pool)
- [ ] Postgres `max_connections` đủ (default 100, OK)

---

## 9. PRE-PRODUCTION — PayOS (thanh toán)

Xem chi tiết tại [docs/modules/bump.md](docs/modules/bump.md).

### 🚨 CRITICAL — Credentials thật
- [ ] Đăng ký PayOS tại https://my.payos.vn → Kênh thanh toán → lấy 3 keys
- [ ] Điền vào `.env.docker`:
  ```
  PAYOS_CLIENT_ID=...
  PAYOS_API_KEY=...
  PAYOS_CHECKSUM_KEY=...
  ```
- [ ] `PUBLIC_URL=https://api.traotay.com.vn` (PHẢI public, không localhost/LAN)
- [ ] Startup phải **KHÔNG** thấy log warn "PayOS credentials thiếu" hoặc "LAN/localhost"

### 🚨 CRITICAL — Webhook registration
- [ ] Vào my.payos.vn → Webhook → đăng ký `https://api.traotay.com.vn/bump/webhook`
- [ ] PayOS test webhook (nút trên admin panel) → response 200 OK
- [ ] Test E2E: 1 tài khoản thật, mua gói Plus 5k → xác nhận bài boost

### ⚠️ HIGH — Monitoring
- [ ] Set up alert nếu có `Amount mismatch` log (Papertrail/Logtail email)
- [ ] Daily check `BumpOrder` table: có order `pending` > 1 giờ không? (user không hoàn tất)

### ⚙️ MEDIUM — Pending order cleanup
- [ ] Cron dọn `BumpOrder.status = 'pending'` cũ hơn 30 phút → set `cancelled`:
  ```ts
  @Cron(CronExpression.EVERY_HOUR)
  async cleanStalePending() {
    await this.prisma.bumpOrder.updateMany({
      where: { status: 'pending', createdAt: { lt: new Date(Date.now() - 30*60*1000) } },
      data: { status: 'cancelled' },
    });
  }
  ```

---

## 10. PRE-PRODUCTION — Email (Resend)

Xem [project_resend_setup.md](../memory/project_resend_setup.md) trong memory.

### ⚠️ HIGH
- [ ] Verify DNS records trên TenTen.vn cho `traotay.com.vn` (SPF, DKIM, MX nếu cần)
- [ ] Verify domain trên Resend dashboard (hiện `Pending`)
- [ ] Set `RESEND_API_KEY` trong `.env.docker`
- [ ] Set `EMAIL_FROM=noreply@traotay.com.vn`
- [ ] Test gửi OTP thật: login bằng email → nhận được mail trong < 30s
- [ ] Nếu Resend chậm/fail → fallback: log vào Sentry/Telegram để biết

### ⚙️ MEDIUM — Email template
- [ ] Template OTP HTML đẹp, có logo Trao Tay
- [ ] Footer có địa chỉ liên hệ (luật email Việt Nam yêu cầu)

---

## 11. PRE-PRODUCTION — DNS & Domain

### 🚨 CRITICAL
- [ ] TenTen.vn: trỏ `traotay.com.vn`, `*.traotay.com.vn` về IP VPS (A record)
  ```
  @                  A    <VPS_IP>    TTL 300
  api                A    <VPS_IP>    TTL 300
  s3                 A    <VPS_IP>    TTL 300
  www                CNAME traotay.com.vn
  ```
- [ ] TTL thấp (300s) **trước ngày deploy** để dễ switch lại nếu cần
- [ ] Verify lan: `dig api.traotay.com.vn +short` trả về đúng IP

### ⚙️ MEDIUM
- [ ] Sau deploy ổn định → tăng TTL lên 3600s để giảm load DNS
- [ ] Set up DNS monitoring (UptimeRobot, ping domain mỗi 5 phút)

---

## 12. PRE-PRODUCTION — Play Store

Xem [docs/modules/playstore-screenshots.md](modules/playstore-screenshots.md).

### ⚠️ HIGH
- [ ] Đóng $25 Play Console (cần thẻ Visa/MasterCard)
- [ ] Bật GitHub Pages (branch `gh-pages`) → privacy URL live
- [ ] Điền Data safety form:
  - Thu thập: email, SĐT, ảnh, vị trí (tuỳ chọn)
  - Không chia sẻ third-party (trừ Firebase FCM để push)
- [ ] Upload AAB (không APK) + listing assets (đã có trong `playstore/`)
- [ ] Chọn **Closed testing** trước (100 tester) → Production sau

### ⚙️ MEDIUM
- [ ] Tạo Discord/Zalo support channel, add link vào listing
- [ ] Response trong < 24h cho review xấu (Google policy)

---

## 13. DEPLOY DAY

### Timeline đề xuất (không nên làm vào tối muộn)

**T-24h (ngày trước)**
- [ ] Backup DB final (local dev)
- [ ] Test lại toàn flow local: đăng ký, đăng bài, chat, bump Plus/VIP
- [ ] Verify toàn bộ checklist 1-12 đã xong

**T-2h (trước deploy)**
- [ ] SSH vào VPS, verify Docker + Nginx + UFW + certbot sẵn sàng
- [ ] Pull code mới nhất: `git pull origin main`
- [ ] Build image: `docker compose -f docker-compose.prod.yml build backend`
- [ ] Verify `.env.docker` có đủ biến (không thiếu PAYOS, RESEND, ADMIN_EMAILS)

**T-0 (deploy)**
- [ ] `docker compose up -d postgres minio` → chờ healthy
- [ ] `docker compose exec backend npx prisma migrate deploy`
- [ ] `docker compose up -d backend`
- [ ] `docker compose logs -f backend` → quan sát startup warning
- [ ] Verify endpoint `https://api.traotay.com.vn/` trả về (health check nếu có)
- [ ] Đăng ký PayOS webhook `https://api.traotay.com.vn/bump/webhook` trên my.payos.vn

**T+30min (smoke test)**
- [ ] Đăng ký user mới bằng email → nhận OTP Resend
- [ ] Đăng bài với 3 ảnh → verify upload MinIO thành công
- [ ] Xem bài từ device khác
- [ ] Chat giữa 2 user
- [ ] Bump free → boost tier 1
- [ ] Bump Plus 5k thật → thanh toán QR → bài boost VIP/Plus
- [ ] FCM: đăng bài mới → user follow nhận push
- [ ] Check `docker logs` không có error nghiêm trọng

**T+2h (nếu OK)**
- [ ] Push AAB lên Play Store (Closed testing → Production)
- [ ] Monitor logs 30 phút, xem có error spike không
- [ ] Tag git: `git tag -a v1.0.0 -m "First production release"`

---

## 14. POST-PRODUCTION — Tuần đầu

### Ngày 1-3: Monitor liên tục
- [ ] Check logs backend mỗi 2-3 giờ: `docker logs --tail 200 traotay_backend | grep -i error`
- [ ] Check DB tăng trưởng: `SELECT COUNT(*) FROM "User"`, `"Post"`, `"BumpOrder"`
- [ ] Check PayOS: có order `paid` không? Có `Amount mismatch` không?
- [ ] Check Resend dashboard: % delivered, bounce rate
- [ ] Check FCM: số push gửi, success rate
- [ ] Response user feedback nhanh (Play Store reviews, Discord)

### Ngày 4-7
- [ ] Review error logs tổng hợp → identify top 3 errors, fix
- [ ] Review performance: query chậm? (Postgres `pg_stat_statements`)
- [ ] Verify backup đã chạy daily → test restore vào môi trường riêng
- [ ] User feedback: feature nào thiếu/confusing → backlog tuần sau

### Metrics theo dõi
| Metric | Target tuần 1 |
|---|---|
| Uptime API | ≥ 99% |
| Thời gian response 95th | < 500ms |
| OTP delivery rate | ≥ 95% |
| Push FCM success | ≥ 90% |
| Crash rate Android (Play Console) | < 1% |
| PayOS order failure rate | < 5% |

---

## 15. POST-PRODUCTION — Vận hành

### ⚠️ HIGH — Monitoring & Alerting
- [ ] Cài **UptimeRobot** free: ping `https://api.traotay.com.vn/` mỗi 5 phút → alert email nếu down
- [ ] Cài **Sentry** backend: `npm i @sentry/node` → track unhandled errors
- [ ] Cài **Sentry Flutter**: track crash client side
- [ ] Log aggregation: **Logtail** hoặc **Papertrail** (free tier) cho backend logs
- [ ] PayOS alert: thêm Telegram bot, gửi mỗi khi có `Amount mismatch` hoặc `Webhook verify failed`

### ⚠️ HIGH — Backup discipline
- [ ] Daily backup verify: tự động email check "backup size tuần này"
- [ ] Monthly restore drill: 1 lần/tháng restore vào staging, verify data OK

### ⚙️ MEDIUM — Security maintenance
- [ ] Monthly: `npm audit` backend, `flutter pub outdated` app, fix CVE
- [ ] Quarterly: rotate JWT_SECRET (user phải login lại — báo trước)
- [ ] Yearly: rotate PostgreSQL password, MinIO password

### ⚙️ MEDIUM — Performance tuning
- Khi đạt 1,000 MAU:
  - [ ] Postgres `EXPLAIN ANALYZE` top queries, thêm index còn thiếu
  - [ ] MinIO lifecycle policy dọn ảnh bài bị xóa
  - [ ] Cloudflare CDN trước `s3.traotay.com.vn`

- Khi đạt 10,000 MAU:
  - [ ] Separate read replica Postgres
  - [ ] Horizontal scale backend (multiple containers + load balancer)
  - [ ] Upgrade VPS RAM/CPU

### 💡 LOW — Ongoing
- [ ] Weekly: review top search keywords (xem user tìm gì nhiều) → feature backlog
- [ ] Monthly: review top boosted categories → marketing strategy
- [ ] Quarterly: cost review (VPS, Backblaze, Resend, Firebase)

---

## 16. Rollback Plan

Khi deploy gặp lỗi nghiêm trọng, thứ tự rollback:

### Mức 1 — Revert code (5 phút)
```bash
ssh vps
cd /opt/traotay
git log --oneline -5                    # tìm commit cũ ổn định
git checkout <commit-cũ>
docker compose build backend
docker compose up -d backend
```

### Mức 2 — Restore DB backup (15 phút)
Nếu migration gây hỏng data:
```bash
docker compose stop backend
docker exec -i traotay_db psql -U postgres traotay < /backups/db-<date>.sql
docker compose up -d backend
```

### Mức 3 — Rollback toàn bộ (30 phút)
Nếu cả code + DB hỏng:
1. Stop all services: `docker compose down`
2. Restore DB từ backup
3. Restore MinIO từ Backblaze (nếu có ảnh mới bị xóa)
4. Checkout code stable tag: `git checkout v0.9.x`
5. Rebuild + restart

### Mức 4 — DNS fallback (nếu VPS chết hẳn)
- TenTen.vn: đổi A record tạm sang VPS backup / Vercel placeholder page thông báo "bảo trì"
- Chuẩn bị sẵn VPS dự phòng khi có 5,000 MAU

### Communication khi rollback
- [ ] Post Play Store listing: "Bảo trì nâng cấp 30-60 phút"
- [ ] Discord/Zalo support: thông báo trước 15 phút
- [ ] Sau khi ổn: email active user xin lỗi + explain

---

## Lịch sử update

| Ngày | Thay đổi | Commit |
|---|---|---|
| 2026-04-24 | Tạo mới, tổng hợp từ audit full codebase | — |

---

**Nguyên tắc:** Trước khi deploy production **lần đầu**, tick ít nhất 🚨 CRITICAL và ⚠️ HIGH trong section 1-12. ⚙️ MEDIUM và 💡 LOW có thể làm post-launch.
