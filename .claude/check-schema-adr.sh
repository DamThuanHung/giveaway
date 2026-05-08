#!/usr/bin/env bash
# Hook PreToolUse — chặn `git commit` nếu sửa schema.prisma mà không kèm ADR mới.
#
# Trigger khi:
#   - Command là git commit (không phải amend/commit-tree)
#   - Staged files có *schema.prisma hoặc migrations/
#   - Staged files KHÔNG có docs/adr/NNNN-*.md mới
#
# Bypass: [skip-adr] trong commit message.

input=$(cat)

# Filter git commit
if ! echo "$input" | grep -qE '"command"[[:space:]]*:[[:space:]]*"[^"]*git[[:space:]]+commit'; then
  exit 0
fi
if echo "$input" | grep -qE 'git[[:space:]]+commit[[:space:]]+--amend|git[[:space:]]+commit-tree'; then
  exit 0
fi
if echo "$input" | grep -qE '\[skip-adr\]'; then
  exit 0
fi

# Lấy danh sách staged files
staged=$(git diff --cached --name-only 2>/dev/null)

# Detect schema/migration change
schema_changed=$(echo "$staged" | grep -E '(prisma/schema\.prisma|prisma/migrations/|migrations/.*\.sql$|/schema\.(sql|graphql|proto)$)' || true)
if [ -z "$schema_changed" ]; then
  exit 0
fi

# Check có ADR mới không (file mới trong adr/, status A trong git diff)
adr_new=$(git diff --cached --name-status 2>/dev/null | grep -E '^A[[:space:]]+docs/adr/[0-9]+-.+\.md$' || true)
if [ -n "$adr_new" ]; then
  exit 0
fi

{
  echo ""
  echo "═══════════════════════════════════════════════════════════════"
  echo "❌ COMMIT BỊ CHẶN — schema thay đổi cần ADR"
  echo "═══════════════════════════════════════════════════════════════"
  echo ""
  echo "Schema/migration files staged:"
  echo "$schema_changed" | sed 's/^/  • /'
  echo ""
  echo "Yêu cầu: tạo ADR mới trong docs/adr/NNNN-tieu-de.md trước khi commit."
  echo "Lý do: schema change ảnh hưởng kiến trúc, phải có Decision Record"
  echo "       (xem docs/standards/ADR_TEMPLATE.md)"
  echo ""
  echo "Slash command: /adr <tựa đề> để tạo ADR mới với numbering tự động"
  echo ""
  echo "Bypass: thêm '[skip-adr]' vào commit message (chỉ khi thật sự không"
  echo "        cần ADR — vd test fixture, seed data, không change kiến trúc)"
  echo "═══════════════════════════════════════════════════════════════"
} >&2

exit 1
