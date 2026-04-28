# Monitoring Setup — Firebase Analytics + Crashlytics + Sentry

> Setup 30 phút để có data sau launch: D1 retention, crash rate, error tracking.
> Code đã integrate sẵn — bạn chỉ cần bật service trong dashboard + lấy keys.

---

## 1. Firebase Analytics + Crashlytics (15 phút)

### 1.1 Bật Analytics
1. Vào https://console.firebase.google.com → project **`chovatang-b5bd9`**
2. Sidebar trái → **Analytics** → **Dashboard**
3. Nếu hiện banner "Enable Google Analytics" → click **Enable**
4. Chọn account hoặc tạo mới (free)
5. Confirm location: **Vietnam**, currency: **VND**

→ Sau 24h, dashboard sẽ có data đầu tiên (active users, retention).

### 1.2 Bật Crashlytics
1. Sidebar trái → **Crashlytics**
2. Click **Enable Crashlytics**
3. Đợi build app lần đầu — Crashlytics tự detect khi user open app

### 1.3 Test crash (sau khi build APK)
Để verify Crashlytics nhận crash, thêm test button vào 1 màn hình admin:
```dart
ElevatedButton(
  onPressed: () => FirebaseCrashlytics.instance.crash(),
  child: const Text('Test Crash'),
)
```
Build release APK → cài → bấm nút → app crash → mở app lại → đợi 5-10 phút → vào Firebase Crashlytics dashboard thấy crash.

**Xóa nút test** trước khi submit Play Store.

### 1.4 Event tracking đã có sẵn
Code track sẵn các event quan trọng (file `app/lib/services/analytics.dart`):
- `sign_up` (method: phone | email_otp)
- `login` (method)
- `post_create` (category, listing_type, image_count)
- `post_view` (post_id)
- `search` (keyword, result_count)
- `deal_create`, `deal_complete`
- `review_submit` (rating)
- `bump_initiate`, `bump_complete` ← track revenue
- `follow_user`
- `chat_message_send`

Trong Firebase Console → Analytics → Events, sau 24h sẽ thấy các event này.

---

## 2. Sentry backend (15 phút)

### 2.1 Tạo project
1. Vào https://sentry.io → Sign up (free, GitHub login OK)
2. Create new project:
   - Platform: **Node.js**
   - Project name: `traotay-backend`
3. Sentry sẽ generate **DSN** dạng:
   ```
   https://abc123@o456.ingest.sentry.io/789
   ```
4. Copy DSN này

### 2.2 Set env var
Trên VPS sau khi deploy, edit `/opt/traotay/.env.docker`:
```
SENTRY_DSN=https://abc123@o456.ingest.sentry.io/789
SENTRY_RELEASE=v1.0.0
```
Restart backend:
```bash
docker compose -f docker-compose.prod.yml restart backend
```

Khi backend start, log sẽ ghi: `[Sentry] Sentry error tracking enabled`

### 2.3 Test Sentry (sau deploy)
Trigger 1 lỗi 500 bằng cách gọi endpoint không tồn tại hoặc force throw error trong dev. Sau 1-2 phút, vào sentry.io → Issues sẽ thấy lỗi với stack trace + URL + userId + IP.

### 2.4 Setup alert
Sentry → Alerts → Create Alert → Issue Alert:
- Condition: **First seen** trong issue mới
- Action: **Send notification to email** `damhungtpt@gmail.com`

→ Khi lỗi mới xuất hiện, bạn nhận mail trong 1 phút.

---

## 3. UptimeRobot — uptime monitoring (5 phút)

Free, monitor `/health` endpoint mỗi 5 phút. Alert email khi server down.

1. Vào https://uptimerobot.com → Sign up
2. Add New Monitor:
   - Type: **HTTP(s)**
   - URL: `https://api.traotay.com.vn/health`
   - Monitoring Interval: **5 minutes** (free max)
3. Alert Contacts: email
4. Save

→ Khi backend down hoặc DB không reachable, bạn nhận mail trong 5-10 phút.

---

## 4. Free tier limits

| Service | Free | Khi nào hết |
|---|---|---|
| Firebase Analytics | Unlimited events | — |
| Firebase Crashlytics | Unlimited crashes | — |
| Sentry | 5,000 events/tháng | Khi nhiều lỗi (cần fix gấp), upgrade $26/tháng |
| UptimeRobot | 50 monitors, 5' interval | Đủ cho ≥10 endpoint |

---

## 5. Dashboard hàng ngày (sau launch)

Mỗi sáng check 4 chỗ trong 5 phút:

1. **Firebase Analytics** → Engagement → Events → xem event `bump_complete` (revenue) + `post_create` (engagement)
2. **Firebase Crashlytics** → Issues → có crash mới không?
3. **Sentry** → Issues → có lỗi 5xx mới không?
4. **UptimeRobot** → uptime tuần qua > 99% không?

Nếu cả 4 xanh → ngày tốt. Nếu 1 cái đỏ → fix ngay.

---

## 6. Privacy compliance

Code track **userId** (qua `Analytics.setUser`) — đảm bảo trong privacy policy đã ghi rõ:
- ✅ Đã ghi: "Chúng tôi thu thập dữ liệu sử dụng app (analytics) để cải thiện sản phẩm"

Khi user xóa tài khoản (`deleteAccount`), code nên gọi `Analytics.clearUser()` — đã làm trong `auth_provider.logout()`.

---

## Lịch sử update

| Ngày | Thay đổi |
|---|---|
| 2026-04-25 | Tạo mới — setup Analytics + Crashlytics + Sentry |
