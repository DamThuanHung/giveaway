# IOS DEPLOYMENT — Trao Tay trước & sau khi lên App Store

> Hai con đường để người dùng iOS dùng được Trao Tay: **PWA** (free, dùng ngay hôm nay) và **TestFlight** (bản native, cần Apple Developer Program).
> Tham khảo thêm: [PRODUCTION_CHECKLIST.md §13](PRODUCTION_CHECKLIST.md#13-pre-production--ios--app-store).

---

## Tổng quan 2 track

| | PWA | TestFlight |
|---|---|---|
| Chi phí | Free | $99/năm (Apple Developer Program) |
| Cần Mac? | Không | Không (build qua Codemagic cloud) |
| Sẵn sàng | Code đã xong, chỉ cần deploy | Code đã chuẩn bị, cần tài khoản + build |
| Trải nghiệm | Web app cài qua Safari, gần như native | Native thật 100% |
| Apple review? | Không | Internal Testing: không · External: 24-48h |

---

## Track 1 — PWA (đã code xong, chỉ cần deploy + verify)

### Đã làm trong code
- [web/app/manifest.ts](../web/app/manifest.ts) — PWA manifest (name, icon, display standalone, theme `#10B981`)
- [web/app/layout.tsx](../web/app/layout.tsx) — `appleWebApp` metadata (capable, status bar style, title)
- [web/public/icons/](../web/public/icons/) — icon 192/512 + maskable variant (copy từ `app/web/icons/`, cùng bộ icon Flutter web)
- [web/app/tai-app/page.tsx](../web/app/tai-app/page.tsx) — hướng dẫn "Add to Home Screen" từng bước cho iOS

### [Cần anh] Deploy lên production
```bash
ssh vps
cd /opt/traotay
git pull origin main
docker compose -f docker-compose.prod.yml build web
docker compose -f docker-compose.prod.yml up -d --no-deps --force-recreate web
```

### [Cần anh] Verify trên iPhone thật
1. Mở `https://traotay.com.vn/manifest.webmanifest` trên browser bất kỳ → phải trả JSON hợp lệ (name, icons, display: standalone)
2. Trên iPhone: Safari → `traotay.com.vn` → Share → **Thêm vào màn hình chính**
3. Kiểm tra: icon đúng, tên "Trao Tay", mở từ Home Screen không có thanh địa chỉ Safari (standalone mode)
4. Test luồng chính: đăng nhập, xem bài, đăng bài có ảnh, chat, bật Web Push (nếu đã quan tâm 1 bài) → nhận push test
5. Regression check trên Android Chrome — đảm bảo PWA mới không phá UI hiện tại

---

## Track 2 — TestFlight (native, cần Apple Developer Program)

### Đã làm trong code
| Việc | File |
|---|---|
| Đổi bundle ID `com.example.choVaTang` → `vn.traotay.app` | `app/ios/Runner.xcodeproj/project.pbxproj` (6 chỗ) |
| Thêm permission keys (camera/ảnh/vị trí) | `app/ios/Runner/Info.plist` |
| Bật icon iOS + tránh alpha channel reject | `app/pubspec.yaml` (`flutter_icons.ios: true`, `remove_alpha_ios: true`) — đã chạy `flutter pub run flutter_launcher_icons` |
| CI build + auto-publish TestFlight | `codemagic.yaml` (repo root) |

### Còn thiếu — phải làm trước khi build được
**Firebase iOS chưa có config** — `app/lib/firebase_options.dart` hiện chỉ có case `android`. Nếu build & chạy ngay trên iOS mà chưa thêm case `ios`, app sẽ **crash ngay khi mở** (`Firebase.initializeApp()` throw `UnsupportedError`).

### Bước 1 — [Cần anh] Đăng ký iOS app trong Firebase Console
1. Vào https://console.firebase.google.com → project **chovatang-b5bd9**
2. Add app → iOS → Bundle ID: `vn.traotay.app`
3. App nickname: "Trao Tay iOS"
4. Download **GoogleService-Info.plist**
5. Gửi file này cho AI (hoặc tự đặt vào `app/ios/Runner/GoogleService-Info.plist`)

### Bước 2 — Thêm case `ios` vào `firebase_options.dart`
AI sẽ lấy `API_KEY`/`GOOGLE_APP_ID` từ file plist, thêm:
```dart
case TargetPlatform.iOS:
  return ios;
// ...
static const FirebaseOptions ios = FirebaseOptions(
  apiKey: '...',
  appId: '...',
  messagingSenderId: '734551474520',
  projectId: 'chovatang-b5bd9',
  storageBucket: 'chovatang-b5bd9.firebasestorage.app',
  iosBundleId: 'vn.traotay.app',
);
```

### Bước 3 — [Cần anh] Đăng ký Apple Developer Program
1. https://developer.apple.com/programs/enroll → $99/năm, cần Apple ID + thẻ quốc tế
2. Verify mất 1-2 ngày làm việc

### Bước 4 — [Cần anh] Tạo App Store Connect app record
1. https://appstoreconnect.apple.com → My Apps → "+" → New App
2. Platform: iOS, Bundle ID: `vn.traotay.app`, Name: "Trao Tay", Primary language: Vietnamese

### Bước 5 — [Cần anh] Tạo App Store Connect API Key (cho Codemagic)
1. App Store Connect → Users and Access → Integrations → App Store Connect API
2. Tạo key mới, role **App Manager**
3. Download file `.p8` (**chỉ download được 1 lần** — lưu ngay vào password manager)
4. Ghi lại **Key ID** và **Issuer ID**

### Bước 6 — [Cần anh] Setup Codemagic
1. https://codemagic.io → Sign up, connect GitHub repo
2. Codemagic tự đọc `codemagic.yaml` ở repo root (đã có sẵn workflow `ios-testflight`)
3. Tạo group biến môi trường `app_store_credentials` với:
   - `APP_STORE_CONNECT_PRIVATE_KEY` (nội dung file `.p8`)
   - `APP_STORE_CONNECT_KEY_IDENTIFIER` (Key ID từ bước 5)
   - `APP_STORE_CONNECT_ISSUER_ID` (Issuer ID từ bước 5)

### Bước 7 — [Cần anh] Trigger build đầu tiên
```bash
git tag ios-v1.0.7
git push origin ios-v1.0.7
```
Codemagic tự build + ký + đẩy lên TestFlight. Build đầu thường fail 1-2 lần do signing config — gửi log lỗi cho AI để sửa `codemagic.yaml`.

### Bước 8 — [Cần anh] Internal Testing
App Store Connect → TestFlight → Internal Testing → add tester (≤100 người, available ngay, không cần Apple review) → cài qua app TestFlight trên iPhone thật.

### Bước 9 — [Cần anh] External/Public TestFlight (khi sẵn sàng mở rộng)
Tạo External Group hoặc Public Link → cần Apple Beta App Review (24-48h) → share link công khai cho người dùng cài thử.

---

## Verification checklist

**PWA:**
- [ ] `/manifest.webmanifest` trả JSON đúng
- [ ] Cài được qua Safari "Add to Home Screen" trên iPhone thật
- [ ] Mở standalone, không thanh địa chỉ
- [ ] Web Push vẫn hoạt động sau khi cài PWA

**TestFlight:**
- [ ] Codemagic build xanh (`flutter build ipa` thành công)
- [ ] App "Ready to Test" trên App Store Connect
- [ ] Cài qua TestFlight trên iPhone thật, mở app không crash (Firebase init OK)
- [ ] Permission prompt camera/ảnh/vị trí xuất hiện đúng lúc, không crash
- [ ] Đăng bài có ảnh, chat, push FCM hoạt động
- [ ] Crashlytics nhận report nếu có crash (verify symbolication)

---

## Lịch sử update

| Ngày | Thay đổi |
|---|---|
| 2026-06-24 | Tạo mới — PWA track triển khai xong code, TestFlight track chuẩn bị code + runbook |
