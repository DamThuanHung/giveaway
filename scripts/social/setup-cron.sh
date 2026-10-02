#!/bin/bash
# Chạy 1 lần trên EC2 để setup cron tự động đăng bài, 24/24 không ngừng nghỉ
# (quyết định 2026-10-03: user muốn 30 phút/bài liên tục, không chỉ 08h-22h).
# Usage: bash scripts/social/setup-cron.sh
#
# KIẾN TRÚC TÁCH LỊCH THEO NỀN TẢNG — bắt buộc vì lý do kỹ thuật thật, không
# phải lựa chọn tuỳ ý: Instagram có trần cứng 25 bài/24h do chính Meta Graph
# API áp đặt (vượt trần là bị lỗi "User request limit reached", không có cách
# nào vượt qua). Facebook Page và Threads KHÔNG có giới hạn tương tự. Muốn vừa
# đăng 30 phút/bài không ngừng nghỉ, vừa không làm Instagram vượt trần, phải
# chạy 2 cron độc lập, mỗi cron gọi post-all.js với --mode khác nhau (xem chi
# tiết trong post-all.js, phần "Mode: lịch đăng tách riêng theo nền tảng"):
#
#   - CRON_FAST (--mode=fast): Facebook + Threads, mỗi 30 phút, không trần
#     → 48 bài/ngày, phủ kín 24/24 không gián đoạn.
#   - CRON_IG (--mode=ig): Instagram riêng, mỗi giờ 1 lần, có trần 25/ngày
#     → 24 bài/ngày, vẫn phủ 24/24 nhưng chậm hơn để không vượt trần Meta.
#
# HỆ QUẢ CẦN BIẾT: vì 2 luồng tiêu thụ queue độc lập (không đồng bộ), nội dung
# Facebook/Threads sẽ KHÔNG còn giống hệt Instagram tại cùng 1 thời điểm nữa —
# Facebook/Threads đăng nhiều caption hơn Instagram trong cùng 1 ngày. Đây là
# đánh đổi user đã đồng ý (2026-10-03) để đổi lấy tần suất 30 phút/bài.
#
# 2 cron lệch phút khởi chạy (fast ở phút 0/30, ig ở phút 15) để tránh đụng độ
# đọc/ghi cùng lúc vào file queue khi cả 2 vô tình trùng giờ chạy.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="$SCRIPT_DIR/post-all.log"
IG_LOG_FILE="$SCRIPT_DIR/post-all-ig.log"
NODE_BIN="$(which node)"

# Facebook + Threads — mỗi 30 phút, 24/24, không trần
CRON_FAST="0,30 * * * * $NODE_BIN $SCRIPT_DIR/post-all.js --mode=fast >> $LOG_FILE 2>&1"

# Instagram riêng — mỗi giờ tại phút 15 (lệch với CRON_FAST), có trần 25/ngày
CRON_IG="15 * * * * $NODE_BIN $SCRIPT_DIR/post-all.js --mode=ig >> $IG_LOG_FILE 2>&1"

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

echo "✅ Đã setup cron Facebook + Threads — 30 phút/bài, 24/24, không trần:"
echo "   ⏰ $CRON_FAST"
echo "✅ Đã setup cron Instagram riêng — 1 bài/giờ, trần 25/ngày (giới hạn thật của Meta):"
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
