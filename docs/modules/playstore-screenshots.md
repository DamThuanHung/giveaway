# Play Store Screenshots — Quy trình

> Quy trình chụp, xử lý và review screenshot cho Google Play Store.
> Thư mục đích: `playstore/screenshots/` (file gốc) + `playstore/screenshots/preview/` (bản resize cho Claude đọc).

---

## Yêu cầu Google Play Store

- Min 2 ảnh, recommend 4-8 ảnh cho phones
- Min dimension: 320px, max 3840px
- Ratio khuyến nghị: 9:16 (portrait) hoặc 16:9 (landscape)
- Format: PNG hoặc JPEG 24-bit

Device dev hiện tại (RMX3708): `1240x2772` — ratio 9:20 (non-standard nhưng Play Store vẫn nhận).

---

## Pipeline chụp + resize + review

### Bước 1 — Chuẩn bị data

Screenshot form trống (ví dụ màn Đăng bài) không phù hợp cho Play Store — phải có data thật. 2 phương án:

- **A)** User thao tác trên app (gõ text tiếng Việt có dấu không tự động hóa được)
- **B)** Seed data qua backend API → screenshot màn hiển thị (Chi tiết, Danh sách)

**Khuyến nghị B** vì clean hơn và AI làm được 100%.

### Bước 2 — Seed bài đăng qua API

```powershell
# Dev login lấy JWT (yêu cầu user đã đăng ký qua email)
$token = (Invoke-RestMethod -Uri "http://localhost:3800/user/dev/login" `
  -Method Post -ContentType "application/json" `
  -Body '{"email":"<email>","secret":"<DEV_SECRET>"}').accessToken

# Upload multipart: 3 ảnh + fields (title, price, description, itemCategory, province, district, listingType, postType, latitude, longitude)
# → POST /post trả về post.id

# Bump để bài lên đầu feed (sort mặc định: bumpedAt DESC NULLS LAST, createdAt DESC)
Invoke-RestMethod -Uri "http://localhost:3800/post/<id>/bump" -Method Post `
  -Headers @{ "Authorization" = "Bearer $token" }
```

### Bước 3 — Chụp qua ADB

**KHÔNG** dùng `adb exec-out screencap -p > file.png` qua PowerShell — CRLF conversion làm corrupt PNG.

**Đúng:**
```powershell
adb -s <device> shell "screencap -p /sdcard/_c.png"
adb -s <device> pull /sdcard/_c.png "c:\path\to\screen.png"
adb -s <device> shell "rm /sdcard/_c.png"
```

MSYS Git Bash cũng sai: path `/sdcard/` bị convert thành `C:/Program Files/Git/sdcard/`. Dùng PowerShell hoặc set `MSYS_NO_PATHCONV=1`.

### Bước 4 — Resize preview 1600px

File gốc 1240x2772 vượt giới hạn Claude Code 2000px/chiều trong session nhiều ảnh. Tạo bản preview 716x1600 để Claude đọc, giữ file gốc cho Play Store.

```powershell
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile($src)
# Tính newW/newH giữ ratio, max dimension = 1600
$bmp = New-Object System.Drawing.Bitmap $newW, $newH
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($img, 0, 0, $newW, $newH)
$bmp.Save($preview, [System.Drawing.Imaging.ImageFormat]::Png)
```

### Bước 5 — Auto navigate + tap

Flutter không expose text trong uiautomator dump. Tap tọa độ tính từ layout Dart:

- Feed tabs (`_FeedTab` với `Expanded`): chia đều width. Màn 1240px → mỗi tab 413px, center tab thứ N = `(N - 0.5) * 413`.
- Scale preview → thật: nhân `1240/716 ≈ 1.7325`.
- **Lưu ý**: các banner campaign ("Miễn phí — Khám phá đồ miễn phí gần bạn") nằm giữa feed tabs và card list, chiếm y ≈ 900-1057 trên 1240x2772. Tap card phải tránh vùng này.

### Bước 6 — Dọn dẹp data test

```powershell
Invoke-RestMethod -Uri "http://localhost:3800/post/<id>" -Method Delete `
  -Headers @{ "Authorization" = "Bearer $token" }
```

Backend làm **soft delete** — status = deleted, không hiển thị ra feed.

---

## Danh sách screenshot hiện tại

| # | File | Nội dung | Mục đích marketing |
|---|---|---|---|
| 01 | `01_home.png` | Trang chủ + feed bài đăng | Brand + sự phong phú |
| 02 | `02_vip_detail.png` | Bài VIP chi tiết | Monetization (gói Đẩy bài) |
| 03 | `03_chat.png` | Màn chat 1-1 với banner gợi ý an toàn | Communication + tin cậy |
| 04 | `04_detail.png` | Chi tiết bài MacBook (seed demo) | Commerce + user flow chính |

---

## Checklist trước khi nộp Play Store

- [ ] Đủ tối thiểu 2 ảnh (recommend 4-8)
- [ ] Không ảnh nào có dữ liệu test user thật / số điện thoại cá nhân
- [ ] Không có timestamp ở múi giờ UTC hiển thị ra UI (nên fix về `Asia/Ho_Chi_Minh`)
- [ ] Tiếng Việt đúng chính tả và đủ dấu
- [ ] Không có placeholder "còn 10 chỗ" / "0/100" khi có thể điền data thật
