# Infrastructure Quick Setup — I-01 + I-02 + I-03

> 3 việc infra cần config bên ngoài (Sentry account, backup drill manual,
> status page service). Code chuẩn bị sẵn — anh thực hiện theo step
> dưới đây, tổng ~30 phút.

---

## I-01 — Sentry deploy backend (5 phút)

**Trạng thái code**: ✅ Đã có sẵn. Backend đọc env `SENTRY_DSN` khi
startup, init Sentry exception filter nếu DSN có.

**Anh làm**:

1. Mở https://sentry.io/signup/ → đăng ký Free tier (5k errors/month — đủ cho stage này)
2. Tạo project mới: chọn platform **Node.js**, framework **NestJS**
3. Sentry tạo project xong → hiển thị DSN dạng:
   ```
   https://abc123def456@o1234567.ingest.sentry.io/8901234
   ```
4. Copy DSN, SSH server và paste vào `.env.docker`:
   ```bash
   ssh -i ~/.ssh/traotay-key.pem ubuntu@18.138.150.162
   sudo -u traotay bash -c 'cd /opt/traotay/repo && echo "SENTRY_DSN=<paste-DSN-here>" >> .env.docker'
   sudo -u traotay docker compose -f /opt/traotay/repo/docker-compose.prod.yml --env-file /opt/traotay/repo/.env.docker restart backend
   ```
5. Verify trong vòng 1 phút: backend log sẽ in `Sentry error tracking enabled` (thay vì `SENTRY_DSN không set`)
6. Test trigger 1 error: anh tự nhắn em sau khi setup → em sẽ gọi 1 endpoint không tồn tại, Sentry sẽ nhận error → email alert tới damhungtpt@gmail.com

---

## I-02 — Backup restore drill (15 phút)

**Trạng thái**: Backup script tự động chạy mỗi 3 sáng VN, dump → B2.
Chưa từng test restore thật — risk R-003 "backup khong restorable".

**Anh làm**:

```bash
ssh -i ~/.ssh/traotay-key.pem ubuntu@18.138.150.162

# 1. Liệt kê backup mới nhất trên B2
sudo -u traotay rclone ls b2:traotay-backup-prod/ | sort -k5 -r | head -5

# 2. Download backup mới nhất về /tmp
sudo -u traotay rclone copy "b2:traotay-backup-prod/db-$(date +%Y%m%d)*.sql.gz" /tmp/ 2>&1 || \
sudo -u traotay rclone copy "b2:traotay-backup-prod/$(sudo -u traotay rclone ls b2:traotay-backup-prod/ | sort -k5 -r | head -1 | awk '{print $2}')" /tmp/

# 3. Tạo Postgres container test riêng (không đụng prod)
docker run -d --name traotay_restore_test -e POSTGRES_PASSWORD=test123 -e POSTGRES_DB=traotay_test postgres:15-alpine

# 4. Đợi container ready
sleep 5

# 5. Restore dump vào container test
gunzip -c /tmp/db-*.sql.gz | docker exec -i traotay_restore_test psql -U postgres -d traotay_test

# 6. Verify data — đếm số user và post
docker exec traotay_restore_test psql -U postgres -d traotay_test -c 'SELECT COUNT(*) AS users FROM "User"; SELECT COUNT(*) AS posts FROM "Post";'

# 7. Cleanup
docker rm -f traotay_restore_test
rm /tmp/db-*.sql.gz
```

**Expected output**: users ≥ 9, posts ≥ 15 (current prod state).

Nếu OK → screenshot kết quả + nhắn em, em close R-003 trong risk register.

Nếu FAIL (file dump corrupted, rclone không có credential, restore lỗi) → screenshot error gửi em, em fix script.

---

## I-03 — Status page setup (10 phút)

**Trạng thái**: Chưa có. User không có cách kiểm tra Trao Tay có down hay không.

**Anh làm**:

### Option A — Statuspage.io (recommended, free tier)

1. Đăng ký https://www.atlassian.com/software/statuspage (free 100 subscribers)
2. Tạo page mới: tên "Trao Tay Status", subdomain `traotay.statuspage.io`
3. Add components:
   - **Web** (https://traotay.com.vn)
   - **API** (https://api.traotay.com.vn)
   - **App Android** (Play Store)
   - **MinIO storage** (https://s3.traotay.com.vn)
4. Setup automatic monitoring với UptimeRobot integration (đã có)
5. Lấy URL public: `https://traotay.statuspage.io`
6. Gửi em URL → em update vào footer web + Play Store listing

### Option B — Cachet self-host (advanced, free vĩnh viễn)

Defer — phức tạp hơn, không cần cho stage này. Khi MAU > 1k mới đáng đầu tư.

---

## Sau khi xong 3 việc

Anh gửi em:
1. Sentry DSN đã paste prod chưa? (yes/no)
2. Backup restore drill output users/posts count
3. Status page URL

Em sẽ:
- Close R-003 trong risk register
- Update memory `project_aws_deploy_state.md` thêm Sentry DSN ref + status page URL
- Update footer web + Play Store description thêm status page link

---

## Cập nhật

| Date | Change |
|---|---|
| 2026-05-21 | Doc tạo. Code I-01 Sentry đã có sẵn — chỉ cần anh tạo account + paste DSN. I-02/I-03 cần anh execute manual. |
