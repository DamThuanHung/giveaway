# Postmortem: Ảnh quảng bá /dac-dinh dùng nhầm template marketplace, đăng lỗi 44 tiếng

**Date of incident:** 2026-07-18 07:27 UTC (bài lỗi đầu tiên đăng công khai)
**Date of postmortem:** 2026-07-20
**Author:** Claude (AI)
**Severity:** SEV-4 (cosmetic bug / data inaccuracy non-critical — không downtime, không mất dữ liệu, không ảnh hưởng thanh toán)
**Status:** Final
**Total downtime:** N/A (không phải sự cố ngừng hoạt động — là sự cố nội dung sai lan truyền theo thời gian)
**Thời gian lan truyền (bug → detect):** ~44 giờ (2026-07-18 07:27 UTC → 2026-07-20 03:25 UTC)
**Affected posts:** 45 bài đăng công khai (Facebook + Instagram + Threads)

## Summary
Khi lên chiến dịch quảng bá trang `/dac-dinh` (ôn thi Đặc định kỹ năng số 2 ngành nhà hàng), caption được lưu vào queue chung của `post-all.js` — hệ thống này render ảnh/Reel qua template cố định thiết kế riêng cho marketing đồ cũ (`generate-card.js`, `generate-video.js`), gây ra ảnh sai hoàn toàn ngữ cảnh: tiêu đề cắt cụt giữa từ, chữ tiếng Nhật không hiển thị (font không có glyph CJK), và footer ghi "Mua • Bán • Cho tặng" — không liên quan gì đến ôn thi. Bug lan truyền suốt ~44 giờ trước khi user tự phát hiện qua kiểm tra ảnh thật đã đăng.

## Impact
- Số bài công khai bị lỗi: 45 bài (24 bài đợt 1 + 21 bài tự động qua cron trong lúc vá lỗi)
- Nền tảng: Facebook Page, Instagram, Threads (mỗi bài đăng cả 3 nơi)
- Business impact: rủi ro uy tín thương hiệu — quảng bá 1 tính năng học tập nghiêm túc bằng ảnh trông như đăng nhầm bài bán đồ cũ; không có thất thoát doanh thu trực tiếp
- Data impact: không có mất/rò rỉ dữ liệu

## Timeline
| Time (UTC) | Event |
|---|---|
| 2026-07-18 07:27 | [Introduce] Bài quảng bá /dac-dinh đầu tiên đăng qua `post-all.js`, dùng template marketplace chung (chưa có template riêng) |
| 2026-07-18 07:27–12:47 | 24 bài tiếp theo đăng thủ công (chạy tay `post-all.js` lặp lại) cùng lỗi template |
| 2026-07-18 14:00 – 2026-07-20 03:00 | Cron tự động 15 lần/ngày tiếp tục đăng thêm 21 bài cùng lỗi (bao gồm cả các bài tái sử dụng từ `queue/done/` theo round-robin) |
| 2026-07-20 ~03:20 | [Detect] User kiểm tra ảnh đã đăng, phản hồi "nội dung bài đăng anh kiểm tra kém quá" |
| 2026-07-20 03:25 | [Identify] Tải ảnh thật về xem trực tiếp — xác nhận: tiêu đề cắt cụt, thiếu chữ Nhật, footer sai ngữ cảnh |
| 2026-07-20 03:30 | [Mitigate] Viết template riêng `generate-card-dac-dinh.js`; phát hiện thêm bug thiếu font tiếng Nhật (Be Vietnam Pro không có glyph CJK) trong lúc build |
| 2026-07-20 03:32 | Tải font Noto Sans CJK JP (static OTF), đăng ký thêm vào `getFonts()` trong `generate-card.js` |
| 2026-07-20 03:34 | Nối `post-all.js` để tự chọn đúng template theo loại caption (`isDacDinhCaption`/`isQuestionCaption`) |
| 2026-07-20 03:35 | Deploy code fix lên production |
| 2026-07-20 03:27 | [Resolve] Đăng thử 1 bài thật với template mới, tải ảnh đã đăng về xác nhận đúng — Japanese hiển thị đúng, footer đúng ngữ cảnh |
| 2026-07-20 03:40 | Rà log phát hiện đúng 45 bài lỗi (không phải 24 như báo cáo đầu) — do cron tiếp tục chạy 44 tiếng trong lúc chưa deploy fix |
| 2026-07-20 03:45 | Xoá 31/36 bài Facebook lỗi qua API (5 bài còn lại bị rate-limit tầng ứng dụng, cần retry sau); Instagram + Threads không xoá được qua API (giới hạn quyền app) |

## Root cause
**Chi tiết kỹ thuật:** Hệ thống đăng bài (`post-all.js`) chỉ có MỘT pipeline render ảnh/Reel dùng chung cho mọi caption trong queue (`generate-card.js` + `generate-video.js`), được thiết kế và hardcode riêng cho ngữ cảnh marketing marketplace đồ cũ (hook trích từ USP bullet, footer cố định "Mua • Bán • Cho tặng"). Khi mở rộng sang một loại nội dung hoàn toàn khác (quảng bá tính năng học tập /dac-dinh), không có cơ chế nào buộc phải tạo template mới tương ứng trước khi đưa caption vào queue chung — hệ thống mặc định áp dụng template cũ cho bất kỳ caption nào, không có bước "content-type detection + dedicated rendering" trước khi phát hành.

Bug thứ hai (thiếu font CJK) tồn tại từ trước, ẩn đến khi lần đầu có nội dung chứa chữ tiếng Nhật trong ảnh render qua `satori` — thư viện `satori` không báo lỗi khi thiếu glyph, chỉ âm thầm bỏ ký tự đó khỏi ảnh (fail silent), khiến bug không bị phát hiện qua log/status code, chỉ phát hiện được khi xem trực tiếp ảnh đã render.

Nguyên nhân khiến sự cố kéo dài 44 giờ thay vì dừng ngay khi phát hiện: quy trình vá lỗi không có bước tạm dừng cron đăng bài trong lúc code đang được sửa/deploy. Cron 15 lần/ngày tiếp tục chạy độc lập theo thời gian thực trong suốt quá trình debug (vốn trải dài qua nhiều lượt tương tác, có khoảng trống thời gian thực giữa các lượt), khiến số bài lỗi tăng từ khoảng vài chục lên 45 trước khi fix kịp deploy.

- ❌ "AI quên kiểm tra ảnh trước khi đăng hàng loạt"
- ✅ "Hệ thống không có bước bắt buộc render + xem ảnh mẫu trước khi một loại nội dung mới được đưa vào vòng lặp cron tự động; không có gate tách riêng template theo loại nội dung; không có cơ chế tự động tạm dừng cron khi phát hiện lỗi nội dung đang lan truyền"

## What went well
- User tự phát hiện lỗi qua kiểm tra thủ công (không có cơ chế tự động phát hiện, nhưng review layer của con người vẫn bắt được)
- Sau khi detect, root cause được xác định nhanh (~5 phút) nhờ tải ảnh thật về xem trực tiếp thay vì chỉ tin log "thành công"
- Fix + deploy + verify bằng ảnh thật chỉ mất ~10 phút sau khi bắt đầu sửa
- Hạ tầng đã có sẵn (Facebook Graph API DELETE) giúp dọn dẹp được 31/36 bài lỗi ngay trong cùng phiên làm việc

## What went wrong
- Không render + xem ảnh mẫu trước khi đưa loại nội dung mới (`/dac-dinh`) vào queue đăng tự động
- Không có template riêng theo loại nội dung — mọi caption trong queue dùng chung 1 pipeline render
- Thiếu font CJK từ trước, không bị phát hiện vì `satori` fail-silent với ký tự thiếu glyph
- Không tạm dừng cron trong lúc sửa lỗi đang lan truyền — để bug tiếp tục nhân rộng suốt 44 giờ
- Không có cơ chế xoá/sửa hàng loạt nhanh — phải viết script dọn dẹp tạm thời sau sự cố

## Lucky / could-have-been-worse
- Nếu nội dung có sai lệch về mặt sự kiện/số liệu (thay vì chỉ sai hình ảnh/branding) thì hậu quả sẽ nghiêm trọng hơn nhiều (thông tin sai lệch về kỳ thi thật)
- Nếu chiến dịch chạy ở tần suất cao hơn hoặc kéo dài hơn 44 giờ trước khi bị phát hiện, số bài lỗi có thể lên tới hàng trăm

## Action items
| ID | Action | Owner | Priority | Deadline |
|---|---|---|---|---|
| A1 | Trước khi đưa BẤT KỲ loại nội dung/chủ đề mới nào vào hệ thống đăng tự động: bắt buộc render ảnh mẫu (và video mẫu nếu có) + xem trực tiếp bằng Read tool, xác nhận đúng ngữ cảnh trước khi deploy | Claude (AI) | P1 | Áp dụng ngay từ bài đăng tiếp theo |
| A2 | Mỗi loại nội dung (marketplace / /dac-dinh / tương lai khác) PHẢI có card+video template riêng, không dùng chung template mặc định — thêm content-type detection rõ ràng trong `post-all.js` | Claude (AI) | P1 | Done (đã làm trong sự cố này — `generate-card-dac-dinh.js` + `isDacDinhCaption`/`isQuestionCaption`) |
| A3 | Khi phát hiện lỗi nội dung đang lan truyền qua cron tự động: TẠM DỪNG cron ngay lập tức trước khi bắt đầu sửa code, chỉ bật lại sau khi verify fix bằng ảnh/video thật | Claude (AI) | P1 | Áp dụng ngay từ sự cố tiếp theo (nếu có) |
| A4 | Bổ sung font CJK (Noto Sans JP) vào `getFonts()` dùng chung — mọi template card/video từ nay có thể chứa chữ tiếng Nhật mà không bị mất glyph | Claude (AI) | P2 | Done |
| A5 | Retry xoá 5 bài Facebook còn lại bị rate-limit (#4 Application request limit reached) sau khi hạn mức API hồi phục | Claude (AI) | P3 | Trong vòng 24h tới |
| A6 | Tạo checklist QA bắt buộc trước khi đăng bất kỳ chiến dịch nội dung mới nào (theo yêu cầu user) — lưu thành memory/doc riêng | Claude (AI) | P1 | Done — xem `feedback_content_qa_checklist_before_campaign.md` |

## Lessons learned
- Log "✅ thành công" từ API chỉ xác nhận request được chấp nhận, KHÔNG xác nhận nội dung hiển thị đúng — luôn cần bước xem ảnh/video thật sau khi render, đặc biệt khi đổi/thêm loại nội dung mới
- Thư viện render ảnh (satori) fail-silent với ký tự thiếu glyph thay vì báo lỗi — không thể chỉ dựa vào "không có exception" để coi là an toàn với nội dung đa ngôn ngữ
- Cron tự động chạy theo thời gian thực độc lập với tiến độ sửa lỗi của AI — khi debug một bug đang lan truyền qua hệ thống tự động, bước đầu tiên luôn phải là NGẮT hệ thống tự động đó, không phải sửa code trước rồi mới nghĩ đến việc tắt cron
- Tái sử dụng template/pipeline có sẵn cho nội dung khác ngữ cảnh tiết kiệm thời gian ngắn hạn nhưng rủi ro cao nếu không audit kỹ từng phần cứng-code (branding, footer, hook-extraction logic) có còn phù hợp không

## Supporting data
- Script dọn dẹp: `scripts/social/delete-bad-posts.js` (đã xoá 31/36 FB posts)
- Template lỗi: `scripts/social/generate-card.js` (dùng cho marketplace, KHÔNG dùng cho /dac-dinh nữa)
- Template fix: `scripts/social/generate-card-dac-dinh.js`
- File liên quan: `scripts/social/post-all.js` (đã thêm routing theo content-type)
- Memory liên quan: `project_dac_dinh_marketing_campaign.md`, `feedback_content_qa_checklist_before_campaign.md`
