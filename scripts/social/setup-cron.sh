#!/bin/bash
# Chạy 1 lần trên EC2 để setup cron tự động đăng đúng 3 khung giờ vàng VN
# Usage: bash scripts/social/setup-cron.sh
#
# Khung giờ đăng (giờ VN = UTC+7):
#   07:00 sáng — lướt điện thoại lúc mới thức
#   12:00 trưa — nghỉ trưa / ăn cơm
#   20:00 tối  — sau bữa tối, rảnh nhất

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="$SCRIPT_DIR/post-all.log"
NODE_BIN="$(which node)"

CRON_MORNING="0 0 * * * $NODE_BIN $SCRIPT_DIR/post-all.js >> $LOG_FILE 2>&1"
# 07:00 VN = 00:00 UTC

CRON_NOON="0 5 * * * $NODE_BIN $SCRIPT_DIR/post-all.js >> $LOG_FILE 2>&1"
# 12:00 VN = 05:00 UTC

CRON_EVENING="0 13 * * * $NODE_BIN $SCRIPT_DIR/post-all.js >> $LOG_FILE 2>&1"
# 20:00 VN = 13:00 UTC

# Xóa cron cũ của post-all.js rồi thêm 3 cron mới
(crontab -l 2>/dev/null | grep -v "post-all.js"
  echo "$CRON_MORNING"
  echo "$CRON_NOON"
  echo "$CRON_EVENING"
) | crontab -

echo "✅ Đã setup 3 khung giờ vàng:"
echo "   🌅 07:00 sáng VN → $CRON_MORNING"
echo "   ☀️  12:00 trưa VN → $CRON_NOON"
echo "   🌙 20:00 tối  VN → $CRON_EVENING"
echo ""
echo "⚠️  Cần 3 caption/ngày trong queue (21 caption/tuần)"
echo "   Gợi ý: chạy /fb-post mỗi ngày để thêm 3 caption mới"
echo ""
echo "📋 Crontab hiện tại:"
crontab -l
echo ""
echo "📄 Log: $LOG_FILE"
echo ""
echo "Kiểm tra queue:"
echo "   node $SCRIPT_DIR/post-all.js --queue"
