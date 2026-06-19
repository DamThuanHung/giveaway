#!/bin/bash
# Chạy 1 lần trên EC2 để setup cron tự động đăng 1 bài/giờ trong khung giờ hoạt động VN
# Usage: bash scripts/social/setup-cron.sh
#
# Khung giờ đăng (giờ VN = UTC+7): mỗi giờ từ 08:00 đến 22:00 (15 lần/ngày)
# Ngoài khung này (22h-8h sáng) không đăng để tránh spam lúc người dùng ngủ.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="$SCRIPT_DIR/post-all.log"
NODE_BIN="$(which node)"

# 08:00-22:00 VN = 01:00-15:00 UTC
CRON_HOURLY="0 1-15 * * * $NODE_BIN $SCRIPT_DIR/post-all.js >> $LOG_FILE 2>&1"

# Xóa cron cũ của post-all.js rồi thêm cron mới
(crontab -l 2>/dev/null | grep -v "post-all.js"
  echo "$CRON_HOURLY"
) | crontab -

echo "✅ Đã setup đăng 1 bài/giờ, khung 08:00-22:00 VN (15 lần/ngày):"
echo "   ⏰ $CRON_HOURLY"
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
