# ADR-0012 — AppDownloadLog: bảng tracking lượt tải app

**Ngày:** 2026-05-24
**Trạng thái:** Accepted
**Người quyết định:** Team (Hùng + Claude)

## Bối cảnh

Admin dashboard cần thống kê lượt tải app Android (APK direct download + Play Store).
Cloudflare Analytics không phân biệt được request `.apk` khỏi các request S3 khác trên free plan.
Cần tracking chính xác theo ngày/tuần/tháng/năm.

## Quyết định

Tạo bảng `AppDownloadLog` trong PostgreSQL với schema tối thiểu:
- `id` cuid
- `platform` string (android | ios)
- `createdAt` datetime với index

Endpoint `/download/:platform` (public, no-auth) ghi 1 row mỗi lượt redirect, sau đó redirect 302 đến APK URL.

## Lý do chọn phương án này

- **Không dùng S3/MinIO access log**: phức tạp, không real-time, không group theo ngày dễ dàng.
- **Không dùng CF Analytics path filter**: không có trên free plan (`httpRequestsAdaptiveGroups` yêu cầu Pro).
- **Không dùng counter trong Redis**: chưa có Redis trong stack, tránh dependency mới.
- Bảng đơn giản, chỉ insert không update, index trên `createdAt` đủ cho admin queries.

## Hậu quả

- Chỉ đếm được lượt tải qua link `/download/android` của backend, không đếm direct S3 link cũ.
- APK_DOWNLOAD_URL cần update trong `.env.docker` mỗi lần release APK mới.
- Lượt tải Play Store không được track — cần Google Play Developer Reporting API (defer sau Production submit).
