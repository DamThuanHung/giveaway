#!/bin/bash
# Chạy 1 lần trên VPS để setup cron tự động đăng bài, 24/24 không ngừng nghỉ.
#
# Quyết định 2026-11-09: GIẢM tần suất còn 1 nửa so với cấu hình cũ (30 phút/bài
# FB+Threads, 1 giờ/bài IG) — lúc khôi phục lại sau sự cố AWS, Trang chỉ có 15
# follower, tần suất cũ (72 bài/ngày) trên 1 trang gần như trống dễ bị thuật
# toán coi là spam, giảm reach tự nhiên ngay từ đầu. Mức mới: FB+Threads
# 24 bài/ngày (1 bài/giờ), Instagram 12 bài/ngày (1 bài/2 giờ) — tổng 36 bài/ngày.
#
# KIẾN TRÚC TÁCH LỊCH THEO NỀN TẢNG — vẫn giữ nguyên lý do kỹ thuật thật (không
# đổi dù giảm tần suất): Instagram có trần cứng 25 bài/24h do chính Meta Graph
# API áp đặt (vượt trần là bị lỗi "User request limit reached"). Facebook Page
# và Threads KHÔNG có giới hạn tương tự — tách 2 cron độc lập, mỗi cron gọi
# post-all.js với --mode khác nhau (xem chi tiết trong post-all.js, phần
# "Mode: lịch đăng tách riêng theo nền tảng"):
#
#   - CRON_FAST (--mode=fast): Facebook + Threads, mỗi giờ → 24 bài/ngày.
#   - CRON_IG (--mode=ig): Instagram riêng, mỗi 2 giờ → 12 bài/ngày, well
#     dưới trần 25/ngày của Meta.
#
# HỆ QUẢ CẦN BIẾT: vì 2 luồng tiêu thụ queue độc lập (không đồng bộ), nội dung
# Facebook/Threads sẽ KHÔNG còn giống hệt Instagram tại cùng 1 thời điểm.
#
# 2 cron lệch phút khởi chạy (fast ở phút 0, ig ở phút 15) để tránh đụng độ
# đọc/ghi cùng lúc vào file queue khi cả 2 vô tình trùng giờ chạy.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="$SCRIPT_DIR/post-all.log"
IG_LOG_FILE="$SCRIPT_DIR/post-all-ig.log"
NODE_BIN="$(which node)"

# Facebook + Threads — mỗi giờ, 24/24 → 24 bài/ngày
CRON_FAST="0 * * * * $NODE_BIN $SCRIPT_DIR/post-all.js --mode=fast >> $LOG_FILE 2>&1"

# Instagram riêng — mỗi 2 giờ tại phút 15 (lệch với CRON_FAST) → 12 bài/ngày
CRON_IG="15 */2 * * * $NODE_BIN $SCRIPT_DIR/post-all.js --mode=ig >> $IG_LOG_FILE 2>&1"

# Hàng tuần thứ 2 08:00 VN = 01:00 UTC — kiểm tra hạn token FB/IG (cảnh báo qua
# email nếu <14 ngày, không tự sửa được) + tự refresh token Threads (60 ngày/lần,
# refresh được qua API nếu làm TRƯỚC khi hết hạn — tránh lặp lại sự cố 2026-08-24
# token Threads chết âm thầm 6 ngày không ai biết). Xem check-tokens.js.
TOKEN_LOG="$SCRIPT_DIR/check-tokens.log"
CRON_WEEKLY="0 1 * * 1 $NODE_BIN $SCRIPT_DIR/check-tokens.js >> $TOKEN_LOG 2>&1"

# Xóa cron cũ của post-all.js/check-tokens.js rồi thêm cron mới
(crontab -l 2>/dev/null | grep -v "post-all.js" | grep -v "check-tokens.js"
  echo "$CRON_FAST"
  echo "$CRON_IG"
  echo "$CRON_WEEKLY"
) | crontab -

echo "✅ Đã setup cron Facebook + Threads — 1 bài/giờ, 24/24 → 24 bài/ngày:"
echo "   ⏰ $CRON_FAST"
echo "✅ Đã setup cron Instagram riêng — 1 bài/2 giờ → 12 bài/ngày (trần thật Meta là 25/ngày):"
echo "   ⏰ $CRON_IG"
echo "✅ Đã setup kiểm tra token hàng tuần (thứ 2, 08:00 VN):"
echo "   ⏰ $CRON_WEEKLY"
echo ""
echo "⚠️  Facebook/Threads và Instagram giờ tiêu thụ queue ĐỘC LẬP — nội dung 2 bên"
echo "   sẽ không còn giống hệt nhau tại cùng thời điểm (Facebook/Threads đăng"
echo "   nhiều caption hơn Instagram mỗi ngày). Đây là đánh đổi đã xác nhận."
echo ""
echo "⚠️  Khi queue/ hết bài, script tự tái sử dụng bài cũ trong queue/done/ theo vòng (cũ nhất trước)."
echo "   Để tránh lặp bài trong cùng 1 ngày, hãy chạy /len-bai thường xuyên để bổ sung caption mới."
echo ""
echo "📋 Crontab hiện tại:"
crontab -l
echo ""
echo "📄 Log Facebook/Threads: $LOG_FILE"
echo "📄 Log Instagram: $IG_LOG_FILE"
echo ""
echo "Kiểm tra queue:"
echo "   node $SCRIPT_DIR/post-all.js --queue"
