# Postmortem: Mail báo cáo hàng ngày gửi nội dung cũ 3 ngày — quên deploy sau commit

**Date of incident:** 2026-06-26 → 2026-06-29 (phát hiện)
**Date of postmortem:** 2026-06-29
**Author:** Thần (AI)
**Severity:** SEV-4 (data inaccuracy non-critical — chỉ admin tự thấy, không user/app nào bị ảnh hưởng)
**Status:** Resolved
**Affected:** 1 người (admin nhận mail báo cáo) — không liên quan user/app thật

## Summary

Commit `2d751fd` (26/06, 12:27 JST) mở rộng nội dung mail báo cáo hàng ngày (thêm tăng trưởng + doanh thu). Code đã đúng và đã push GitHub, nhưng container `traotay_backend` trên production **không được rebuild** sau commit này — container đang chạy được tạo lúc 01:53 JST cùng ngày, sớm hơn commit ~1.5h. Hệ quả: cron `sendDailyReport` (8h sáng mỗi ngày) gửi bản mail **cũ** suốt 3 ngày (27, 28, 29/06) dù code mới đã nằm sẵn trên server (đã `git pull` xong qua các commit sau không liên quan). Anh phát hiện vì nhớ đã yêu cầu đổi nội dung mail nhưng vẫn thấy bản cũ.

## Root cause

Quy trình lúc đó coi "commit xong + test dev OK" = done, không có bước bắt buộc verify container production đã chạy đúng code mới — đặc biệt nguy hiểm với code chạy qua **cron job** (không có request HTTP từ user để tự lộ lỗi ngay, phải chờ tới lần cron kế tiếp mới phát hiện được, ở đây là 3 ngày).

Đây là lần thứ 2 gặp class lỗi "code đúng nhưng production không sync" — lần đầu là [Web Push schema migration miss](2026-05-08-web-push-schema-miss.md) (08/05, thiếu `prisma db push` sau đổi schema). Cả 2 lần đều do thiếu bước deploy bị xem là "đương nhiên đã làm" mà không có cách verify khách quan.

## Fix

1. Rebuild + recreate `traotay_backend` ngay khi phát hiện → gửi thử lại qua endpoint `POST /admin/analytics/send-report` → xác nhận nội dung mới.
2. Thêm `GIT_SHA` build arg vào `backend/Dockerfile` + `docker-compose.prod.yml`, expose qua `GET /health` → verify deploy bằng 1 lệnh `curl`, không cần so thủ công timestamp `docker inspect` (cách verify cũ không đủ tin cậy — chỉ phản ánh lúc container được tạo, không chắc phản ánh code nào đang chạy bên trong).
3. Bổ sung rule vào `docs/standards/AI_WORKING_RULES.md` §3.2: code chạy qua cron/scheduled job (Docker `@Cron` hoặc cron riêng trên EC2 như `scripts/social/*`, `scripts/backup.sh`) → bắt buộc mức test 5, deploy + verify ngay trong cùng session, không tách "commit" và "deploy" thành 2 việc độc lập.

## Action items

| ID | Action | Status |
|---|---|---|
| A1 | Rebuild + verify mail content trên production | ✅ Done 2026-06-29 |
| A2 | `GIT_SHA` trong `GET /health` để verify deploy khách quan | ✅ Done (commit theo sau) |
| A3 | Rule mới AI_WORKING_RULES.md §3.2 cho code chạy qua cron (Docker + EC2) | ✅ Done |

## Lessons learned

1. **Code chạy qua cron là blind spot** — không có HTTP traffic thật để tự lộ lỗi như API thường, nên "deploy" phải là một phần bắt buộc của "done", không phải bước tách riêng dễ quên.
2. **So sánh timestamp thủ công không đủ tin cậy để làm safety net** — `docker inspect Created` có thể lệch với code thực tế đang chạy bên trong image. Cần tín hiệu khách quan (git SHA) thay vì suy luận qua giờ.
3. **Pattern lặp lại lần 2** (sau Web Push schema 08/05) cho thấy đây là rủi ro hệ thống của quy trình deploy, không phải lỗi ngẫu nhiên — đáng để tổng quát hoá rule thay vì patch lẻ từng lần.
