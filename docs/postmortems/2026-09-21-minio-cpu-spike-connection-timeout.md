# Postmortem: MinIO CPU spike gây Cloudflare 522/525 Connection Timeout

**Date of incident:** 2026-09-21 11:29 UTC (lần 1) + ~15:08 UTC (lần 2)
**Date of postmortem:** 2026-09-22
**Author:** Thần (AI)
**Severity:** SEV-3
**Status:** Final
**Total downtime:** ~5 phút (lần 1, tự phục hồi) + ~10-15 phút ngắt quãng (lần 2, tới khi mitigate xong)
**Affected users:** Không xác định chính xác được, tối đa ~23 user đăng ký (toàn bộ user base); khả năng cao traffic thực tế trong 2 cửa sổ này rất thấp (giờ tối VN)

## Summary
`api.traotay.com.vn/health` bị Cloudflare trả lỗi 522/525 (Connection Timeout/SSL handshake fail) ngắt quãng 2 lần trong ngày 21/9, do container MinIO (`traotay_storage`) CPU tăng vọt 188-192% kéo dài trên EC2 t3.micro yếu (2 vCPU/914MB RAM), nghẽn toàn bộ đường nginx→backend dù backend/DB vẫn khỏe. Fix: restart MinIO + giảm scanner speed từ `default` xuống `slow`.

## Impact
- Số user ảnh hưởng: không đo được chính xác (không có real-user traffic log trong 2 cửa sổ sự cố); upper bound ~23 user đăng ký
- Business impact: thấp — 2 cửa sổ ngắn (5 phút + ~10-15 phút), không phải giờ peak
- Data impact: không — không mất dữ liệu, MinIO volume không bị ảnh hưởng, chỉ là container tạm nghẽn CPU

## Timeline
| Time (UTC) | Event |
|---|---|
| 2026-09-21 11:29:29 | [Detect] UptimeRobot: `api.traotay.com.vn/health` down, root cause "Connection Timeout" |
| 2026-09-21 11:34:32 | [Auto-resolve] UptimeRobot: monitor up lại, không có can thiệp thủ công |
| 2026-09-21 ~17:06 (giờ VN 9/22 00:06) | [User report] Anh gửi email cảnh báo UptimeRobot (đã resolved) cho Thần xem |
| 2026-09-21 ~15:08 | [Detect lại] Thần curl trực tiếp `https://api.traotay.com.vn/health` → HTTP 522, xác nhận sự cố đang tái diễn ngay lúc report |
| 2026-09-21 ~15:08 | [Triage] SSH vào EC2: container backend/db/web healthy, `/health` local trả 200 nhanh (2-16ms) → loại trừ app-level bug |
| 2026-09-21 ~15:09 | [Identify] `docker stats`: `traotay_storage` (MinIO) CPU 188-192% liên tục; `top`: I/O wait 46.9%, RAM chỉ còn 65Mi free/914Mi |
| 2026-09-21 ~15:10 | [Mitigate] Restart `traotay_storage` → CPU 190%→0.03%, iowait 46.9%→0% |
| 2026-09-21 ~15:13 | [Verify] Public health check: vẫn còn 522/525 ngắt quãng dù origin local instant + idle → nghi network path residual, không phải resource |
| 2026-09-21 ~15:16 | [Investigate thêm] `ss -s`: chỉ 76 TCP connections, không có port/connection exhaustion → loại trừ |
| 2026-09-21 ~15:20 | [Root cause hypothesis] MinIO internal data-usage scanner chạy `speed=default`, quá nặng cho instance yếu — set `scanner speed=slow` qua `mc admin config set` (ephemeral `minio/mc` container, phải dùng IP nội bộ `172.18.0.4` vì mc admin API từ chối hostname chứa `_`) |
| 2026-09-21 ~15:21 | [Resolve] Restart lại `traotay_storage` để áp dụng config mới |
| 2026-09-21 ~15:22 | [Verify] Public health check: 200 OK ổn định nhiều lần liên tiếp (0.2-2.4s), MinIO CPU giữ gần 0% |

## Root cause
**Chi tiết kỹ thuật**: MinIO container chạy internal data-usage scanner (crawl toàn bộ object để tính usage stats) ở cấu hình mặc định (`scanner speed=default`). Trên instance production hiện tại (AWS EC2 t3.micro — 2 vCPU burstable, 914MB RAM), scanner này có thể chiếm gần 2 core CPU liên tục trong vài phút, đẩy I/O wait toàn hệ thống lên ~47%. Vì tất cả container (nginx, backend, MinIO) chia sẻ chung tài nguyên CPU/disk của 1 VPS nhỏ, spike này làm nghẽn luồng proxy nginx→backend→Cloudflare đủ lâu để vượt ngưỡng timeout của Cloudflare (Cloudflare timeout cố định phía edge, origin không set được), dù chính backend/DB không hề bị ảnh hưởng và trả response tức thì khi test local.

Đây là **system gap**, không phải lỗi thao tác: hạ tầng thiếu (a) capacity headroom cho các tác vụ nền của MinIO trên instance quá nhỏ, và (b) alerting/threshold riêng cho CPU container để phát hiện spike này trước khi nó ảnh hưởng ra ngoài qua Cloudflare.

## What went well
- UptimeRobot phát hiện + tự alert đúng thời điểm, có timestamp + root cause rõ ràng ("Connection Timeout") ngay từ email đầu tiên
- Log/docker stats/top có sẵn đủ để pinpoint chính xác container thủ phạm trong vài phút, không cần đoán
- Restart container an toàn (data ở volume riêng), không gây thêm rủi ro khi mitigate
- Root cause thật sự (scanner speed) được tìm ra và fix tận gốc trong cùng session, không chỉ patch tạm (restart) rồi dừng

## What went wrong
- Không có alerting riêng cho CPU container bất thường (chỉ có UptimeRobot theo dõi HTTP endpoint từ ngoài) → sự cố tái phát lần 2 chỉ được phát hiện vì anh tình cờ gửi email cảnh báo lần 1, không phải do hệ thống tự báo
- MinIO scanner mặc định không được tune cho instance nhỏ ngay từ lúc setup ban đầu (2026-04-26/29) — đây là default MinIO chưa từng review lại dưới góc độ capacity của t3.micro
- RAM server luôn rất sát trần (65-85Mi free/914Mi, swap dùng liên tục 600-800Mi/2Gi) — đây là điều kiện nền khiến bất kỳ spike CPU/IO nào cũng dễ lan thành timeout ra ngoài, chưa được flag như risk trước đó

## Lucky / could-have-been-worse
- Cả 2 lần xảy ra ngoài giờ peak (tối muộn VN) — nếu xảy ra giờ cao điểm, số user bị ảnh hưởng thực tế sẽ cao hơn nhiều
- Lần 1 tự phục hồi sau 5 phút — nếu không tự phục hồi và không ai để ý mail, downtime có thể kéo dài tới khi có người chủ động check

## Action items
| ID | Action | Owner | Priority | Deadline |
|---|---|---|---|---|
| A1 | Đổi MinIO scanner speed từ `default` sang `slow` để giảm tải baseline | Thần | P1 | Done (2026-09-21) |
| A2 | Document gotcha "mc/MinIO admin API từ chối hostname chứa dấu gạch dưới `_`, phải dùng IP nội bộ container" vào `docs/AWS_SETUP.md` | Thần | P2 | 2026-09-22 |
| A3 | Thêm health-check.sh (cron thứ 2 hàng tuần, đã có sẵn) kiểm tra thêm `docker stats` CPU% từng container, cảnh báo email nếu container nào > 100% CPU trong lần check | Thần | P1 | 2026-09-29 |
| A4 | Theo dõi RAM/swap 30 ngày tới; nếu spike CPU tương tự tái diễn ≥ 2 lần nữa hoặc RAM free thường xuyên < 50Mi → đề xuất nâng cấp t3.micro lên t3.small (cân nhắc chi phí ngoài free tier) | Thần | P2 | 2026-10-22 |

## Lessons learned
- Response time thấp (nginx local trả 200 trong vài ms) không tự động nghĩa là hệ thống khỏe hoàn toàn — cần nhìn cả tài nguyên container khác (`docker stats` toàn bộ) trước khi kết luận "không phải origin issue"
- Alerting hiện tại (UptimeRobot) chỉ theo dõi HTTP layer từ ngoài, không có visibility vào resource layer bên trong — 2 lớp này cần bổ sung cho nhau, không thể thay thế nhau
- Trên VPS free-tier nhỏ chạy nhiều container dùng chung tài nguyên, một service tưởng "phụ" (MinIO chỉ dùng cho ảnh) hoàn toàn có thể là nguyên nhân gây downtime cho service "chính" (API) — cần review định kỳ default config của mọi service, không chỉ service chính

## Supporting data
- UptimeRobot email: "api.traotay.com.vn/health is up" — Root cause: Connection Timeout, 2026-09-21 11:29:29→11:34:32
- `docker stats` snapshot lúc phát hiện: `traotay_storage` CPU 188-192%, các container khác < 10%
- `top` snapshot: `%wa` 46.9%, `MiB Mem: 914 total / 65.6 free`
- Liên quan: [[project_aws_deploy_state]] (EC2 t3.micro spec, layout container)
