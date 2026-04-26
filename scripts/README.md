# Scripts — Deployment & Operations

## Thứ tự setup lần đầu trên VPS (Ubuntu 22.04)

### 1. Chuẩn bị VPS
```bash
# SSH vào VPS
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-plugin nginx certbot \
                    python3-certbot-nginx git rclone ufw fail2ban

# Firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# User riêng cho app (không dùng root)
sudo adduser --disabled-password --gecos "" traotay
sudo usermod -aG docker traotay

# Swap 2GB (chống OOM trên EC2 t3.micro 1GB)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 2. Clone repo + setup env
```bash
sudo mkdir -p /opt/traotay
sudo chown traotay:traotay /opt/traotay
sudo -iu traotay
cd /opt/traotay
git clone https://github.com/DamThuanHung/giveaway.git .

cp .env.production.example .env.docker
chmod 600 .env.docker
nano .env.docker   # điền mọi CHANGE_ME
```

### 3. Generate password random (chạy 4 lần)
```bash
openssl rand -base64 32 | tr -d '/+=' | head -c 32; echo
```
Dùng cho `POSTGRES_PASSWORD`, `MINIO_ROOT_PASSWORD`, `MINIO_SECRET_KEY`.
`JWT_SECRET`: `openssl rand -base64 64`

### 4. Start stack
```bash
docker compose -f docker-compose.prod.yml up -d postgres minio
sleep 20    # chờ healthy
docker compose -f docker-compose.prod.yml up -d backend
```

### 5. Nginx + SSL
```bash
sudo cp nginx/traotay.conf /etc/nginx/sites-available/traotay
sudo ln -sf /etc/nginx/sites-available/traotay /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Start nginx với config HTTP-only tạm (comment ssl lines)
# Hoặc: certbot tự gen cert trước rồi reload

sudo ./nginx/init-cert.sh
```

### 6. Backup cron

**Tuỳ chọn A — Backup local-only (nhanh, không cần B2 account):**
```bash
# Cron daily 3h sáng VN (20:00 UTC)
(sudo crontab -l 2>/dev/null; echo "0 20 * * * /opt/traotay/repo/scripts/backup-local.sh") | sudo crontab -

# Test ngay
sudo /opt/traotay/repo/scripts/backup-local.sh
ls -lh /opt/traotay/backups/
```
Lưu trữ 14 ngày gần nhất ở `/opt/traotay/backups/`. KHÔNG bảo vệ khi cả EBS volume hỏng — layer tạm.

**Tuỳ chọn B — Backup cloud Backblaze B2 (recommended sau khi có account):**
```bash
# Setup rclone cho Backblaze B2
rclone config    # xem comment trong backup.sh

# Cron daily 3h sáng VN
(sudo crontab -l 2>/dev/null; echo "0 20 * * * /opt/traotay/repo/scripts/backup.sh >> /var/log/traotay-backup.log 2>&1") | sudo crontab -

# Test
./scripts/backup.sh
```
Sau khi B2 OK, gỡ entry backup-local khỏi crontab.

---

## Script usage hàng ngày

### Deploy code mới
```bash
# Từ local
ssh traotay@<VPS_IP> "cd /opt/traotay && ./scripts/deploy.sh"

# Hoặc SSH vào VPS
ssh traotay@<VPS_IP>
cd /opt/traotay
./scripts/deploy.sh
```

### Backup thủ công (ngoài lịch cron)
```bash
./scripts/backup.sh
```

### Restore từ backup
```bash
./scripts/restore.sh                    # bản mới nhất
./scripts/restore.sh 2026-04-24_0300    # bản cụ thể
```

### Xem logs
```bash
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs --tail=200 backend | grep -i error
```

### Monitor resource
```bash
docker stats          # CPU/RAM từng container
htop                  # overall
free -h               # swap usage
df -h                 # disk
```

---

## Troubleshooting

| Triệu chứng | Kiểm tra |
|---|---|
| Backend không start | `docker logs traotay_backend` — thường thiếu env var |
| OOM (killed) | `dmesg | grep -i kill`, `free -h` — tăng swap hoặc upgrade RAM |
| SSL cert fail renew | `sudo certbot renew --dry-run`, check DNS |
| MinIO 403 ảnh | Bucket policy + CORS — `mc admin info traotay/` |
| PayOS webhook fail | Log Nginx `/var/log/nginx/access.log` + Nest `logs backend` |
| Backup fail | `cat /var/log/traotay-backup.log`, test `rclone ls b2:` |
