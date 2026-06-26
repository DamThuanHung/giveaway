# Postmortem: Threads vượt giới hạn 500 ký tự chặn queue, gây đăng trùng lặp lên Facebook + Instagram

**Date of incident:** 2026-06-26 ~03:00 UTC (10:00 VN) → phát hiện 2026-06-26 ~15:29 UTC (22:29 VN)
**Date of postmortem:** 2026-06-26
**Author:** Thần (AI)
**Severity:** SEV-3 (đề xuất — channel marketing bị lỗi hoàn toàn + side-effect đăng trùng công khai, nhưng không ảnh hưởng app/backend/user thật của Trao Tay) — **cần anh xác nhận**
**Status:** Draft
**Total downtime:** ~12h (Threads không đăng được lần nào) + đăng trùng 13 lần lên FB/IG
**Affected users:** Follower Facebook Page (14) + Instagram (41) nhìn thấy 13 bài giống nhau liên tiếp trong feed/profile. Không ảnh hưởng user thật của app Trao Tay.

## Summary

Threads được kết nối live lúc 2026-06-25 19:12 UTC (.env thêm `THREADS_USER_ID`/`THREADS_ACCESS_TOKEN`), nhưng caption marketing chuẩn của dự án (~800-1000 ký tự, theo quy tắc "≤400 từ") luôn vượt giới hạn cứng 500 ký tự của Threads API. `post-all.js` coi lỗi Threads ngang hàng với lỗi Facebook/Instagram — bất kỳ platform nào lỗi cũng chặn `markDone`, khiến file không tiến được sang bài kế. Hệ quả: 1 bài (`100-v1.txt`) bị cron đăng lại **13 lần thật** lên Facebook Page + Instagram (mỗi giờ 1 lần) suốt từ 10h đến 22h, mỗi lần tạo ra 1 post ID mới — trong khi Threads thất bại cả 13/13 lần. Phát hiện khi anh hỏi tiếp về Threads trong lúc đang research khả năng auto-post Reels. Đã fix: Threads dùng bản caption rút gọn riêng (≤500 ký tự) + tách "critical" platform (FB/IG chặn retry khi lỗi) khỏi "best-effort" (Threads lỗi không chặn ai khác).

## Impact

- Số user ảnh hưởng: 14 follower Facebook Page + 41 follower Instagram (con số thật, query trực tiếp Graph API) — không phải user app Trao Tay
- Business impact: kênh marketing chính trông spam (13 bài giống nhau liên tiếp) đúng ngày đang làm việc tăng reach — phản tác dụng trực diện với mục tiêu đang theo đuổi. Không có revenue/churn risk vì không đụng tới app/backend.
- Data impact: Không — không mất dữ liệu, chỉ là nội dung public bị trùng lặp

## Timeline

*Lưu ý: `post-all.log` không có timestamp trên từng dòng (xem "What went wrong") — giờ dưới đây suy ra từ giờ cron cố định (`0 1-15 * * *` UTC) + thời điểm phát hiện thật.*

| Time (UTC) | Event |
|---|---|
| 2026-06-25 19:12 | `.env` cập nhật, Threads credentials thêm vào — Threads chính thức live trong `postThreads()` |
| 2026-06-26 ~01:00–02:00 | Queue xử lý bình thường các file 092→098 (Threads skip hoặc lỗi rồi recover — chưa xác nhận chính xác lần đầu lỗi) |
| 2026-06-26 ~03:00 | Queue đến file `100-v1.txt` (882 ký tự) → Threads lỗi `Param text must be at most 500 characters long` → `allOk=false` → không `markDone` → `process.exit(1)` |
| 2026-06-26 03:00–15:00 (10h–22h VN) | Cron lặp lại đúng `100-v1.txt` mỗi giờ × 13 lần — Facebook + Instagram đăng thành công 13 lần (13 post ID mới mỗi nền tảng), Threads lỗi 13/13 lần |
| 2026-06-26 ~15:29 | [Detect] Anh hỏi "thread thì sao?" tiếp nối câu hỏi Reels → Thần grep `post-all.log` → phát hiện 13 dòng lỗi Threads giống nhau + file `100-v1.txt` lặp 13 lần |
| 2026-06-26 ~15:35 | [Identify] Root cause: `allOk` chặn theo bất kỳ platform nào lỗi, không phân biệt critical/best-effort; Threads chưa có bản caption rút gọn |
| 2026-06-26 ~15:40 | [Mitigate/Fix] Sửa `post-all.js`: thêm `buildThreadsText()` (rút gọn ≤500 ký tự) + `PLATFORM_CRITICAL = [true, true, false]` (FB/IG critical, Threads best-effort) |
| 2026-06-26 ~15:45 | Commit `8e58ce5`, push GitHub, deploy EC2 (`git pull --ff-only`) |
| 2026-06-26 ~15:48 | [Verify] Test thật Threads với đúng nội dung từng lỗi → đăng thành công (post ID `18114904984895108`), 279 ký tự |
| 2026-06-26 ~15:50 | [Resolve] Chuyển `100-v1.txt` vào `done/` (đã đăng FB/IG đủ rồi) → queue tiến lại bình thường (97→95 bài) |

## Root cause

**System gap (KHÔNG blame ai):**

1. `post-all.js` thiết kế ban đầu coi 3 platform (Facebook, Instagram, Threads) đồng hạng — bất kỳ platform nào trả `ok: false` (không phải `skipped`) đều set `allOk = false`, chặn `markDone`. Logic này hợp lý khi Threads chưa có credentials (trả về `skipped`, không tính vào `allOk`), nhưng không còn đúng khi Threads được kết nối thật mà có một giới hạn nội dung (500 ký tự) khác hẳn FB (~63K) và Instagram (~2200).
2. Caption marketing được thiết kế thống nhất 1 bản dùng chung cho mọi platform (chỉ tách riêng hashtag cho IG, xem fix trước đó cùng ngày) — chưa từng tính đến việc Threads cần một bản **ngắn hơn về cấu trúc**, không chỉ khác ở hashtag.
3. Lỗi Threads là **deterministic** (caption nào cũng dài hơn 500 ký tự, retry không thay đổi kết quả) nhưng code xử lý y như lỗi **transient** (network/rate-limit, retry hợp lý) — không có cơ chế phân loại lỗi permanent vs temporary.
4. Không có alert/log nào cảnh báo khi cùng 1 file bị retry liên tục nhiều lần — phải đợi người chủ động hỏi và grep log mới phát hiện.
5. `post-all.log` không ghi timestamp theo dòng → không thể xác định chính xác giờ bắt đầu sự cố sau khi xảy ra, chỉ suy luận được từ lịch cron.

## What went well

- Token/credentials đã đủ quyền publish ngay từ đầu (không phải chờ Meta App Review) — phát hiện và fix nhanh không bị nghẽn ở xin quyền
- Fix xong → verify ngay bằng 1 lệnh post thật lên Threads trước khi unstick queue, tránh báo "done" mà chưa chắc đã hết lỗi
- Facebook/Instagram (2 platform chính) không hề downtime — bài vẫn lên đều, chỉ là lên trùng

## What went wrong

- **Không phân biệt critical vs best-effort platform** trong logic advance queue — đây là root cause chính
- **Không có giới hạn nội dung riêng theo platform** khi thiết kế caption — giả định 1 bản dùng chung cho cả 3 là sai khi platform thứ 3 (Threads) có constraint khác biệt lớn
- **Thiếu observability**: không timestamp trong log, không alert khi 1 file bị stuck >1-2 lần retry — phải phát hiện thủ công qua câu hỏi của user, không phải qua hệ thống tự cảnh báo

## Lucky / could-have-been-worse

- Facebook Page + Instagram hiện chỉ 14 và 41 follower — impact thương hiệu thấp vì ít người thấy. Nếu xảy ra lúc có vài nghìn follower, 13 bài trùng liên tiếp sẽ rất tổn hại uy tín và có thể bị Meta đánh dấu spam/giảm reach toàn Page.
- Cadence cron tối đa 15 lần/ngày (8h-22h) — nếu cadence cao hơn (vd mỗi 15 phút) thì cùng sự cố sẽ tạo ra 50+ bài trùng trong cùng khung thời gian.

## Action items

| ID | Action | Owner | Priority | Deadline | Status |
|---|---|---|---|---|---|
| A1 | Tách `PLATFORM_CRITICAL` — Threads best-effort không chặn FB/IG advance queue | Thần | P1 | 2026-06-26 | ✅ Done (commit 8e58ce5) |
| A2 | `buildThreadsText()` — caption rút gọn riêng ≤500 ký tự cho Threads | Thần | P1 | 2026-06-26 | ✅ Done (commit 8e58ce5) |
| A3 | Thêm timestamp vào mỗi dòng log `post-all.js` (hiện không có) để truy vết sự cố chính xác hơn lần sau | Thần | P2 | 2026-06-26 | ✅ Done (commit theo sau, `console.log` ISO timestamp đầu mỗi run) |
| A4 | Thêm cảnh báo khi cùng 1 file bị retry > 2 lần liên tiếp (log dòng `⚠️ STUCK: file X đã thử N lần`) — phát hiện sớm hơn, không phải đợi user hỏi | Thần | P1 | 2026-06-26 | ✅ Done (`trackRetry()` + `.retry-state.json`) |
| A5 | Trước khi connect platform mới vào `post-all.js`, BẮT BUỘC kiểm tra giới hạn nội dung (caption length, media spec) của platform đó và xử lý riêng nếu khác — ghi thành rule trong `docs/AI_RULES.md` | Thần | P1 | 2026-06-26 | ✅ Done (rule thêm vào `AI_RULES.md` §5) |

## Lessons learned

1. **"Đăng cùng 1 nội dung lên N platform" không có nghĩa N platform có cùng constraint.** Phải audit giới hạn (độ dài, định dạng media, rate limit) riêng cho từng platform trước khi coi chúng đồng hạng trong pipeline.
2. **Lỗi deterministic (luôn lỗi, mọi lần) phải xử lý khác lỗi transient (đôi khi lỗi).** Logic "lỗi → giữ lại retry" chỉ đúng với lỗi transient; lỗi deterministic mà cứ retry sẽ lặp vô hạn và gây hại (ở đây là đăng trùng).
3. **Một thay đổi cấu hình nhỏ (.env thêm credentials) có thể kích hoạt code path cũ chưa từng test thật** — `postThreads()` tồn tại từ trước nhưng chỉ chạy nhánh `skipped` cho đến khi có token; nhánh lỗi thật chưa bao giờ được exercise.
4. **Log thiếu timestamp = mất khả năng điều tra chính xác sau sự cố.** Cần coi observability (timestamp, structured log) là yêu cầu tối thiểu ngay từ khi viết script, không phải thêm sau khi cần.

## Supporting data

- Commit fix: `8e58ce5` (fix(social): Threads lỗi 500 ký tự đang chặn FB/IG đăng trùng lặp)
- Commit liên quan cùng ngày: `316e90f` (tách hashtag theo platform — cùng file `post-all.js`)
- Log: `/opt/traotay/repo/scripts/social/post-all.log` trên EC2 (13 dòng lỗi Threads liên tiếp cho `100-v1.txt`)
- 13 cặp post ID trùng lặp (Facebook / Instagram) — đã liệt kê đầy đủ trong hội thoại, anh quyết định giữ nguyên không xóa (2026-06-26)
- Threads post ID verify fix: `18114904984895108`
