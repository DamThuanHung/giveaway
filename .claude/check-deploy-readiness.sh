#!/usr/bin/env bash
# Hook PreToolUse — chặn deploy backend production nếu chưa có production smoke test.
#
# Trigger khi:
#   - Command match: docker compose ... up -d --build (deploy production)
#   - HOẶC: ssh ... 'sudo /opt/.../web-rebuild.sh' (deploy web)
#   - HOẶC: rsync/scp ... production
#
# Yêu cầu: file /tmp/.deploy-checklist-acked.<hash> tồn tại + mới (<10 phút)
# tạo bởi /deploy-check command.

input=$(cat)

# Detect deploy intent — search trong toàn bộ input (input có escaped quotes
# từ JSON nên regex extract command field sẽ break ở \" — search whole input
# pragmatic hơn).
is_deploy=0
if echo "$input" | grep -qE 'docker[[:space:]]+compose.+up.+--build'; then
  is_deploy=1
fi
if echo "$input" | grep -qE 'web-rebuild\.sh|deploy\.sh'; then
  is_deploy=1
fi
if echo "$input" | grep -qE 'prisma[[:space:]]+(db[[:space:]]+push|migrate[[:space:]]+deploy)'; then
  is_deploy=1
fi
# "production" keyword loose match — tránh false positive trong commit message
# vd "fix(prod): ..." → check thêm có command-like context không
if echo "$input" | grep -qE '(ssh|rsync|scp|docker)[^"]*production'; then
  is_deploy=1
fi

if [ $is_deploy -eq 0 ]; then
  exit 0
fi

# Bypass cho rollback emergency
if echo "$input" | grep -qE '\[emergency-rollback\]|\[skip-deploy-check\]'; then
  exit 0
fi

# Check có ack file mới không (trong 10 phút)
ack_files=$(find /tmp -maxdepth 1 -name '.deploy-checklist-acked.*' -mmin -10 2>/dev/null)
if [ -n "$ack_files" ]; then
  exit 0
fi

{
  echo ""
  echo "═══════════════════════════════════════════════════════════════"
  echo "❌ DEPLOY BỊ CHẶN — chưa qua TEST_PROTOCOL §4 checklist"
  echo "═══════════════════════════════════════════════════════════════"
  echo ""
  echo "Detected deploy intent in command."
  echo ""
  echo "Yêu cầu trước deploy production:"
  echo "  ✓ /health endpoint trả 200 (curl test)"
  echo "  ✓ Schema sync (nếu có schema change → prisma db push xong)"
  echo "  ✓ Smoke test endpoint vừa thay đổi (curl + parse response)"
  echo "  ✓ Logs container 2 phút qua sạch errors"
  echo "  ✓ Rollback plan (revert commit + redeploy)"
  echo ""
  echo "Action: chạy /deploy-check để go qua checklist + tạo ack file"
  echo ""
  echo "Bypass khẩn cấp: thêm '[emergency-rollback]' nếu đang rollback sự cố"
  echo "═══════════════════════════════════════════════════════════════"
} >&2

exit 1
