#!/bin/bash
# Chạy 1 lần trên EC2 để setup cron tự động đăng bài 24/24 (quyết định 2026-10-03:
# user chủ động chọn phủ full ngày đêm, chấp nhận đánh đổi bớt bài ở khung giờ vàng
# tối để đổi lấy có bài xuyên suốt cả đêm khuya).
# Usage: bash scripts/social/setup-cron.sh
#
# Lịch: đúng 1 bài/giờ, mọi giờ trong ngày (24 lượt/ngày), không giới hạn khung
# giờ như trước (08h-22h). QUAN TRỌNG: KHÔNG chạy dày rồi cắt theo trần như kiểu
# cũ (0,30 1-15 — 30 lượt dồn trong 14.5 tiếng) — nếu áp dụng kiểu đó cho 24/24
# (chạy mỗi 30 phút suốt 24h = 48 lượt/ngày), trần 25 bài/ngày (đếm theo thứ tự
# cron chạy trước) sẽ bị dùng hết ngay từ nửa đêm → trưa, khiến khung giờ vàng
# tối 19h-22h hoàn toàn KHÔNG có bài nào. Lịch mỗi-giờ-1-lần ở đây tránh lỗi đó:
# 24 lượt/ngày luôn thấp hơn trần 25, nên không có giờ nào trong ngày bị bỏ sót.
#
# Trần thật 25 bài/ngày (giới hạn cứng Instagram Graph API) vẫn được chặn TRONG
# post-all.js (xem DAILY_CAP/reserveDailySlot) — với lịch 24 lượt/ngày, trần này
# gần như không bao giờ bị chạm tới, chỉ còn tác dụng phòng hờ.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="$SCRIPT_DIR/post-all.log"
NODE_BIN="$(which node)"

# Mỗi giờ đúng 1 lần, 24/24 — giờ UTC hay VN không quan trọng vì chu kỳ 1 tiếng
# là như nhau ở mọi múi giờ, không cần quy đổi UTC+7 như lịch cũ.
CRON_HOURLY="0 * * * * $NODE_BIN $SCRIPT_DIR/post-all.js >> $LOG_FILE 2>&1"

# Hàng tuần thứ 2 08:00 VN = 01:00 UTC — kiểm tra hạn token FB/IG (cảnh báo qua
# email nếu <14 ngày, không tự sửa được) + tự refresh token Threads (60 ngày/lần,
# refresh được qua API nếu làm TRƯỚC khi hết hạn — tránh lặp lại sự cố 2026-08-24
# token Threads chết âm thầm 6 ngày không ai biết). Xem check-tokens.js.
TOKEN_LOG="$SCRIPT_DIR/check-tokens.log"
CRON_WEEKLY="0 1 * * 1 $NODE_BIN $SCRIPT_DIR/check-tokens.js >> $TOKEN_LOG 2>&1"

# Xóa cron cũ của post-all.js/check-tokens.js rồi thêm cron mới
(crontab -l 2>/dev/null | grep -v "post-all.js" | grep -v "check-tokens.js"
  echo "$CRON_HOURLY"
  echo "$CRON_WEEKLY"
) | crontab -

echo "✅ Đã setup cron 1 bài/giờ, 24/24 (tối đa 25 bài/ngày là trần phòng hờ, chặn trong post-all.js):"
echo "   ⏰ $CRON_HOURLY"
echo "✅ Đã setup kiểm tra token hàng tuần (thứ 2, 08:00 VN):"
echo "   ⏰ $CRON_WEEKLY"
echo ""
echo "⚠️  Khi queue/ hết bài, script tự tái sử dụng bài cũ trong queue/done/ theo vòng (cũ nhất trước)."
echo "   Để tránh lặp bài trong cùng 1 ngày, hãy chạy /len-bai thường xuyên để bổ sung caption mới."
echo ""
echo "📋 Crontab hiện tại:"
crontab -l
echo ""
echo "📄 Log: $LOG_FILE"
echo ""
echo "Kiểm tra queue:"
echo "   node $SCRIPT_DIR/post-all.js --queue"
