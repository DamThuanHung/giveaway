#!/bin/bash
# Chạy 1 lần trên EC2 để setup cron tự động đăng bài trong khung giờ hoạt động VN
# Usage: bash scripts/social/setup-cron.sh
#
# Khung giờ đăng (giờ VN = UTC+7): mỗi 30 phút từ 08:00 đến 22:00.
# Ngoài khung này (22h-8h sáng) không đăng để tránh spam lúc người dùng ngủ.
#
# Trần thật 25 bài/ngày (giới hạn cứng Instagram Graph API) được chặn TRONG
# post-all.js (xem DAILY_CAP/reserveDailySlot), không phải ở đây — cron cứ
# chạy dày (30 lượt/ngày khả dụng) cho chắc, script tự bỏ qua êm các lượt dư
# sau khi đã đủ 25, không cần canh giờ cron khớp tuyệt đối với trần.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="$SCRIPT_DIR/post-all.log"
NODE_BIN="$(which node)"

# 08:00-22:00 VN = 01:00-15:00 UTC, mỗi 30 phút (phút 0 và 30)
CRON_HOURLY="0,30 1-15 * * * $NODE_BIN $SCRIPT_DIR/post-all.js >> $LOG_FILE 2>&1"

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

echo "✅ Đã setup cron mỗi 30 phút, khung 08:00-22:00 VN (tối đa 25 bài/ngày, chặn trong post-all.js):"
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
