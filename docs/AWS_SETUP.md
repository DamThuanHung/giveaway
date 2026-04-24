# AWS SETUP — Trao Tay trên EC2 Free Tier

> Hướng dẫn từng bước deploy Trao Tay lên AWS EC2 free tier (12 tháng đầu free).
> Kết thúc tài liệu này: backend chạy trên `https://api.traotay.com.vn`, ảnh trên `https://s3.traotay.com.vn`, landing trên `https://traotay.com.vn`.
>
> **Tổng thời gian:** 2-3 giờ.

---

## Điều kiện tiên quyết

- [ ] Thẻ Visa/MasterCard quốc tế (AWS yêu cầu)
- [ ] Domain `traotay.com.vn` đã mua tại TenTen.vn
- [ ] Tài khoản Backblaze B2 (10GB free) — https://backblaze.com/b2
- [ ] Tài khoản Resend — https://resend.com (3k email/tháng free)
- [ ] Tài khoản PayOS — https://my.payos.vn (đã verify CCCD)
- [ ] SSH client: Windows → PowerShell / WSL / PuTTY; Mac/Linux → terminal built-in
- [ ] Đã đọc [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) từ đầu đến section 12

---

## Phần 1 — Tạo AWS account (15 phút)

### 1.1 Đăng ký

1. Vào https://aws.amazon.com/ → **Create AWS Account**
2. Email + password (dùng email công ty/cá nhân chính — sau này khó đổi)
3. **Account name:** `Trao Tay Production`
4. **Account type:** Personal
5. Điền địa chỉ + số điện thoại (dùng tên thật — AWS verify)
6. **Thẻ thanh toán:** nhập Visa/MasterCard → AWS charge $1 test rồi hoàn lại
7. **Verify SĐT:** AWS call số điện thoại → đọc mã
8. **Support plan:** chọn **Basic (Free)**

→ Sau 10-15 phút, account active.

### 1.2 BẮT BUỘC — bảo mật root account

```
AWS Console → góc phải trên → Security credentials → MFA
```
1. **Enable MFA** cho root user — dùng app Google Authenticator / Authy
2. Save backup codes vào password manager
3. **Đừng dùng root cho việc hàng ngày** — tạo IAM user ở bước 1.3

### 1.3 Tạo IAM user

```
Console → IAM → Users → Create user
```
1. User name: `traotay-admin`
2. ✅ Provide user access to AWS Management Console
3. Password: auto-generated → lưu vào password manager
4. Permissions: **Attach policies directly** → chọn `AdministratorAccess`
5. Create → copy URL login (dạng `https://<ID>.signin.aws.amazon.com/console`)
6. **Từ giờ dùng user này**, không dùng root

### 1.4 BẮT BUỘC — Budget alert (tránh bill sốc)

```
Console → Billing → Budgets → Create budget
```
1. **Budget type:** Cost budget
2. **Amount:** `$5 USD / month`
3. **Alert:** email bạn khi vượt 80% ($4) và 100% ($5)

Với kế hoạch này, dự kiến **$0/tháng** năm đầu. Alert $5 = có gì bất thường.

---

## Phần 2 — Launch EC2 instance (20 phút)

### 2.1 Chọn region Singapore (gần VN nhất)

```
Console (góc phải trên) → chọn Singapore (ap-southeast-1)
```

### 2.2 Key pair SSH

```
Console → EC2 → Key Pairs → Create key pair
```
1. Name: `traotay-key`
2. Type: RSA
3. Format: `.pem` (Mac/Linux/WSL) hoặc `.ppk` (PuTTY Windows)
4. Create → download file → lưu vào `~/.ssh/traotay-key.pem`
5. `chmod 400 ~/.ssh/traotay-key.pem` (Mac/Linux)

### 2.3 Security Group

```
EC2 → Security Groups → Create security group
```
1. Name: `traotay-web`
2. Description: `HTTP HTTPS SSH`
3. Inbound rules:

| Type | Port | Source | Note |
|---|---|---|---|
| SSH | 22 | My IP | Chỉ IP của bạn — hạn chế brute-force |
| HTTP | 80 | Anywhere (0.0.0.0/0) | Let's Encrypt + redirect |
| HTTPS | 443 | Anywhere (0.0.0.0/0) | Main traffic |

**Không mở** port 3800, 5432, 9000, 9001.

### 2.4 Launch EC2

```
EC2 → Instances → Launch instances
```
1. **Name:** `traotay-prod`
2. **AMI:** Ubuntu Server 22.04 LTS (Free tier eligible) — x86_64
3. **Instance type:** `t3.micro` (1 vCPU, 1GB RAM, 750h/tháng free)
   - Nếu ap-southeast-1 chỉ có t2.micro free thì chọn t2.micro
4. **Key pair:** `traotay-key`
5. **Network settings:**
   - VPC: default
   - Security group: chọn existing → `traotay-web`
   - Auto-assign public IP: Enable
6. **Storage:** 30 GB gp3 (max free tier; default thường 8GB, nâng lên 30GB)
7. **Advanced (optional):** bỏ qua

→ **Launch instance**. Chờ 1-2 phút state = `running`.

### 2.5 Elastic IP (IP không đổi khi restart)

```
EC2 → Elastic IPs → Allocate Elastic IP
```
1. Allocate (region Singapore)
2. Action → Associate → chọn instance `traotay-prod`

→ Copy địa chỉ IP này (dạng `x.x.x.x`).

**Quan trọng:** Elastic IP free **chỉ khi attached** vào running instance. Nếu dừng instance → bắt đầu charge $0.005/giờ. **Đừng stop instance** lâu.

---

## Phần 3 — DNS & Domain (10 phút)

Vào **TenTen.vn** → DNS manager của `traotay.com.vn`:

Tạo 4 A record, tất cả trỏ về Elastic IP:

| Record | Type | Value | TTL |
|---|---|---|---|
| `@` | A | `<Elastic_IP>` | 300 |
| `www` | A | `<Elastic_IP>` | 300 |
| `api` | A | `<Elastic_IP>` | 300 |
| `s3` | A | `<Elastic_IP>` | 300 |

TTL 300s = 5 phút, dễ sửa nhanh nếu cần. Sau khi ổn định đặt lại 3600.

Verify DNS propagate (sau 2-5 phút):
```bash
dig api.traotay.com.vn +short
# Phải trả về Elastic IP
```

---

## Phần 4 — Setup VPS (45 phút)

### 4.1 SSH vào EC2

```bash
ssh -i ~/.ssh/traotay-key.pem ubuntu@<Elastic_IP>
```

### 4.2 System update + packages

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y \
  docker.io \
  docker-compose-plugin \
  nginx \
  certbot python3-certbot-nginx \
  git \
  rclone \
  ufw \
  fail2ban \
  htop
```

### 4.3 Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
# Xác nhận "y"
```

### 4.4 User riêng cho app

```bash
sudo adduser --disabled-password --gecos "" traotay
sudo usermod -aG docker traotay
```

### 4.5 Swap 2GB (chống OOM)

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h     # verify swap đã on
```

### 4.6 SSH hardening

```bash
sudo nano /etc/ssh/sshd_config
```
Set:
```
PasswordAuthentication no
PermitRootLogin no
```
```bash
sudo systemctl restart sshd
```

### 4.7 Clone repo

```bash
sudo mkdir -p /opt/traotay
sudo chown traotay:traotay /opt/traotay
sudo -iu traotay
cd /opt/traotay
git clone https://github.com/DamThuanHung/giveaway.git .
```

### 4.8 Tạo `.env.docker`

```bash
cp .env.production.example .env.docker
chmod 600 .env.docker

# Generate 3 password
openssl rand -base64 32 | tr -d '/+=' | head -c 32; echo   # POSTGRES_PASSWORD
openssl rand -base64 32 | tr -d '/+=' | head -c 32; echo   # MINIO_ROOT_PASSWORD (+ MINIO_SECRET_KEY)
openssl rand -base64 64; echo                              # JWT_SECRET

nano .env.docker
```
Điền:
- Password vừa generate (nhớ update cả trong `DATABASE_URL`)
- `FCM_SERVICE_ACCOUNT` — copy từ file Firebase JSON (1 dòng)
- `RESEND_API_KEY` — từ resend.com dashboard
- `PAYOS_*` — từ my.payos.vn
- `ADMIN_EMAILS=admin@traotay.com.vn,<email_bạn>`

### 4.9 Start Docker stack

```bash
cd /opt/traotay
docker compose -f docker-compose.prod.yml up -d postgres minio
sleep 30    # chờ healthy
docker compose -f docker-compose.prod.yml up -d backend
docker compose -f docker-compose.prod.yml logs -f backend
# Ctrl+C khi thấy "✅ Backend ready (production)"
```

### 4.10 Migration DB lần đầu

```bash
docker compose -f docker-compose.prod.yml exec backend \
  npx prisma migrate deploy
```

### 4.11 Tạo admin user

```bash
# Option 1: Dùng Prisma Studio từ local (SSH tunnel)
# Trên máy local:
ssh -L 5555:localhost:5555 -i ~/.ssh/traotay-key.pem ubuntu@<IP>
# Trên VPS:
docker compose -f docker-compose.prod.yml exec backend npx prisma studio
# Browser local → http://localhost:5555

# Option 2: SQL trực tiếp
docker exec -it traotay_db psql -U traotay_app traotay
UPDATE "User" SET role = 'admin' WHERE email = 'admin@traotay.com.vn';
```

---

## Phần 5 — Nginx + HTTPS (20 phút)

### 5.1 Nginx config

```bash
# Vẫn đang SSH vào VPS, user traotay
sudo cp /opt/traotay/nginx/traotay.conf /etc/nginx/sites-available/traotay
sudo ln -sf /etc/nginx/sites-available/traotay /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

### 5.2 Tạm tắt SSL block (vì chưa có cert)

Chỉnh `traotay.conf` — comment 3 block `server { listen 443 ssl }` tạm thời:

```bash
sudo nano /etc/nginx/sites-available/traotay
```
Thêm `#` đầu mỗi dòng của 3 HTTPS server block (hoặc dùng sed). Giữ lại HTTP block (port 80).

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### 5.3 Xin Let's Encrypt cert

```bash
cd /opt/traotay
chmod +x nginx/init-cert.sh
./nginx/init-cert.sh
```

Script tự đăng ký cert cho 4 domain + setup auto-renew.

### 5.4 Bật lại SSL block

Bỏ `#` đã thêm ở 5.2:
```bash
sudo nano /etc/nginx/sites-available/traotay
```
```bash
sudo nginx -t && sudo systemctl reload nginx
```

### 5.5 Verify HTTPS

Browser:
- `https://traotay.com.vn` → landing (nếu có file `/var/www/traotay/index.html`)
- `https://api.traotay.com.vn/` → phản hồi từ backend
- `https://s3.traotay.com.vn/` → MinIO error page (bình thường — chỉ ảnh cụ thể có response)

---

## Phần 6 — PayOS webhook + Resend verify (15 phút)

### 6.1 PayOS webhook

1. my.payos.vn → Kênh thanh toán → Webhook
2. URL: `https://api.traotay.com.vn/bump/webhook`
3. Test webhook → PayOS gửi request test → backend phải respond 200
4. Check log:
   ```bash
   docker compose -f docker-compose.prod.yml logs backend | grep -i webhook
   ```

### 6.2 Resend domain verify

1. resend.com/domains → Add domain `traotay.com.vn`
2. Resend cho 3 DNS record (SPF, DKIM, DMARC)
3. Thêm vào TenTen.vn DNS
4. Verify (5-30 phút)
5. Test gửi OTP: đăng ký tài khoản test trên app

---

## Phần 7 — Backup Backblaze B2 (15 phút)

### 7.1 Tạo bucket B2

1. backblaze.com → Buckets → Create a Bucket
2. Name: `traotay-backups`
3. Files in Bucket: **Private**
4. Default Encryption: **Enable** (SSE-B2)
5. Create Application Key → permission: only this bucket, read+write

### 7.2 Setup rclone

```bash
# SSH vào VPS, user traotay
rclone config
```
- `n` (new remote)
- Name: `b2`
- Storage: `b2`
- Account ID: (paste Key ID)
- Application Key: (paste)
- Endpoint: (leave blank)
- Confirm → `q` (quit)

Test:
```bash
rclone lsd b2:
# Phải thấy bucket traotay-backups
```

### 7.3 Cron daily

```bash
chmod +x /opt/traotay/scripts/backup.sh
chmod +x /opt/traotay/scripts/restore.sh
chmod +x /opt/traotay/scripts/deploy.sh

# Cron 3h sáng mỗi ngày
(crontab -l 2>/dev/null; \
 echo "0 3 * * * /opt/traotay/scripts/backup.sh >> /var/log/traotay-backup.log 2>&1") \
 | crontab -

crontab -l    # verify
```

### 7.4 Test backup thủ công

```bash
sudo mkdir -p /var/log
sudo touch /var/log/traotay-backup.log
sudo chown traotay:traotay /var/log/traotay-backup.log

/opt/traotay/scripts/backup.sh
# Phải thấy log "Backup xong"

# Verify trên B2
rclone ls b2:traotay-backups/db/
# Thấy file db-YYYY-MM-DD_HHMM.sql.gz
```

### 7.5 Test restore (dry run)

```bash
# Clone data sang DB test để verify restore script work
./scripts/restore.sh
# Script sẽ hỏi confirm "YES"
```

---

## Phần 8 — Build Flutter production (30 phút)

Trên **máy local**:

```bash
cd c:/projects/giveaway/app
flutter clean
flutter pub get

# Build AAB cho Play Store
flutter build appbundle --release \
  --dart-define=API_URL=https://api.traotay.com.vn

# Build APK cho side-load test
flutter build apk --release \
  --dart-define=API_URL=https://api.traotay.com.vn
```

File output:
- `app/build/app/outputs/bundle/release/app-release.aab` → Play Console
- `app/build/app/outputs/flutter-apk/app-release.apk` → test sideload

---

## Phần 9 — Smoke test (15 phút)

Sau khi mọi thứ chạy:

| Test | Kỳ vọng |
|---|---|
| `curl https://api.traotay.com.vn/` | 200 response |
| Đăng ký user mới bằng email | Nhận OTP qua Resend trong 30s |
| Đăng bài với 3 ảnh | Upload OK, xem được ảnh qua `https://s3.traotay.com.vn/...` |
| Chat giữa 2 user | Tin nhắn realtime qua WebSocket |
| Bump free → boost tier 1 | Bài lên đầu, badge "Nổi bật" |
| Bump Plus 5k (tiền thật) | QR PayOS → thanh toán → bài boost |
| FCM push | Đăng bài match keyword → user khác nhận notification |
| Check logs có error | `docker logs traotay_backend --tail 200 | grep -i error` — không error nghiêm trọng |

---

## Phần 10 — Post-launch monitoring

```bash
# Daily check manual tuần đầu
docker stats --no-stream
free -h              # RAM
df -h                # Disk
tail -100 /var/log/traotay-backup.log   # Backup hôm qua đã chạy?
```

Xem [PRODUCTION_CHECKLIST.md section 14-15](PRODUCTION_CHECKLIST.md#14-post-production--tuần-đầu) cho chi tiết monitoring.

---

## Troubleshooting thường gặp

| Lỗi | Fix |
|---|---|
| `docker: command not found` | `sudo apt install -y docker.io` + logout/login để user được group docker |
| EC2 connection refused SSH | Security Group port 22 chưa mở cho IP bạn |
| `Permission denied (publickey)` | `chmod 400 traotay-key.pem`, verify đúng path |
| Backend crash sau 5 phút | OOM — check `dmesg | grep -i kill`, tăng swap hoặc upgrade instance |
| Nginx `502 Bad Gateway` | Backend chưa start hoặc bind sai port — `docker logs traotay_backend` |
| Cert renewal fail | `sudo certbot renew --dry-run`, check DNS + port 80 accessible |
| MinIO 403 khi xem ảnh | Bucket policy chưa public — `mc admin policy attach traotay/ readwrite` |
| Resend DKIM không verify | Đợi lâu hơn (lên tới 24h), check đúng record type TXT |
| PayOS webhook không trigger | Check Nginx access log `/var/log/nginx/access.log`, verify URL public |

---

## Chi phí dự kiến năm 1

| Item | Free tier | Chi phí thực |
|---|---|---|
| EC2 t3.micro 750h/tháng | ✓ | $0 |
| EBS 30GB gp3 | ✓ | $0 |
| Elastic IP (attached) | ✓ | $0 |
| Data transfer out 100GB/tháng | ✓ | $0 |
| Backblaze B2 10GB | ✓ | $0 |
| Resend 3k email/tháng | ✓ | $0 |
| Domain TenTen.vn (đã mua) | — | — |
| **Tổng AWS** | | **$0/tháng** |

**Năm 2+ (ước lượng sau free tier):**
- EC2 t3.micro: ~$8/tháng
- EBS 30GB: ~$2.4/tháng
- Elastic IP: $0 (vẫn free khi attached)
- Data transfer: ~$5/tháng (~50GB)
- **Tổng: ~$15-20/tháng**

Khi gần hết free tier (tháng 10-11 năm 1), plan migration: Vultr Singapore $6/month hoặc tiếp tục AWS có tăng RAM.

---

## Checklist nhanh trước khi đi ngủ ngày deploy

- [ ] `docker stats` — cả 3 container healthy
- [ ] `curl https://api.traotay.com.vn/` trả 200
- [ ] Đăng ký 1 user test thành công → vào app xem được
- [ ] Thanh toán PayOS 5k test → bài boost → webhook log ghi success
- [ ] Backup cron: `crontab -l` có dòng 3h sáng
- [ ] Budget alert AWS đã bật ở $5
- [ ] Monitor: uptimerobot.com free → ping `https://api.traotay.com.vn/`

---

## Lịch sử update

| Ngày | Thay đổi |
|---|---|
| 2026-04-24 | Tạo mới cho plan AWS EC2 free tier |
