#!/usr/bin/env bash
# Hook PreToolUse — chặn `git commit` nếu commit message thiếu evidence.
#
# Bắt buộc trong commit message:
#   - "Edge cases:" — list 3+ tình huống xấu đã verify
#   - "Test level:" — build pass | walkthrough | e2e thực
#
# Bypass: thêm "[skip-evidence]" vào commit message (chỉ dùng cho docs-only,
# typo fix, hoặc revert commit không thay đổi logic).
#
# Reason: hoàng thượng yêu cầu enforcement cứng vì self-discipline thuần
# AI không đủ — memory rule có sẵn vẫn bị vi phạm.

# Đọc JSON từ stdin (Claude Code hook protocol)
input=$(cat)

# Filter chỉ check khi tool là git commit
# Match "git commit" trong command field, KHÔNG match "git commit-tree" hay
# "git commit --amend" (vì amend đã commit rồi, chỉ sửa message).
if ! echo "$input" | grep -qE '"command"[[:space:]]*:[[:space:]]*"[^"]*git[[:space:]]+commit'; then
  exit 0
fi
if echo "$input" | grep -qE 'git[[:space:]]+commit[[:space:]]+--amend'; then
  exit 0
fi
if echo "$input" | grep -qE 'git[[:space:]]+commit-tree'; then
  exit 0
fi

# Bypass flag
if echo "$input" | grep -qE '\[skip-evidence\]'; then
  exit 0
fi

missing=()
if ! echo "$input" | grep -qE 'Edge cases:'; then
  missing+=("Edge cases:")
fi
if ! echo "$input" | grep -qE 'Test level:'; then
  missing+=("Test level:")
fi

if [ ${#missing[@]} -eq 0 ]; then
  exit 0
fi

# Block — output stderr để hiển thị
{
  echo ""
  echo "═══════════════════════════════════════════════════════════════"
  echo "❌ COMMIT BỊ CHẶN — thiếu evidence trong commit message"
  echo "═══════════════════════════════════════════════════════════════"
  echo ""
  echo "Thiếu các block sau:"
  for m in "${missing[@]}"; do
    echo "  • $m"
  done
  echo ""
  echo "Format bắt buộc trong commit message:"
  echo ""
  echo "  Edge cases verified:"
  echo "  - First install (token=null): ..."
  echo "  - Upgrade từ version cũ: ..."
  echo "  - Network timeout/fail: ..."
  echo "  - Exception async không catch: ..."
  echo "  - Token corrupt / invalid: ..."
  echo ""
  echo "  Test level: build pass | mental walkthrough | E2E thực"
  echo "  (chỉ dùng 'E2E thực' nếu đã chạy app/web thật và quan sát)"
  echo ""
  echo "Bypass: thêm '[skip-evidence]' vào commit message (chỉ docs-only/typo)."
  echo "═══════════════════════════════════════════════════════════════"
} >&2

exit 1
