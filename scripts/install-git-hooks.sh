#!/usr/bin/env bash
# Install git hooks Layer 3 enforcement.
# Chạy 1 lần sau khi clone repo: bash scripts/install-git-hooks.sh
# Idempotent — chạy nhiều lần không hại.

set -e

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
if [ -z "$REPO_ROOT" ]; then
  echo "❌ Không phải git repo"
  exit 1
fi

cd "$REPO_ROOT"

HOOKS_SRC="scripts/git-hooks"
HOOKS_DEST=".git/hooks"

if [ ! -d "$HOOKS_SRC" ]; then
  echo "❌ $HOOKS_SRC không tồn tại"
  exit 1
fi

mkdir -p "$HOOKS_DEST"

for hook in pre-commit commit-msg; do
  src="$HOOKS_SRC/$hook"
  dest="$HOOKS_DEST/$hook"
  if [ ! -f "$src" ]; then
    echo "⚠️  $src không tồn tại, skip"
    continue
  fi
  # Backup nếu hook cũ tồn tại + không phải file managed
  if [ -f "$dest" ] && ! grep -q "scripts/git-hooks" "$dest" 2>/dev/null; then
    cp "$dest" "$dest.bak.$(date +%s)"
    echo "📦 Backup hook cũ: $dest.bak.*"
  fi
  # Copy thay vì symlink (Windows symlink phức tạp)
  cp "$src" "$dest"
  chmod +x "$dest"
  echo "✅ Installed: $hook"
done

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "Git hooks installed. Mọi git commit từ giờ sẽ chạy:"
echo "  • pre-commit:  schema-ADR check + secret scan + large file warn"
echo "  • commit-msg:  Edge cases + Test level evidence check"
echo ""
echo "Test bypass khi cần (cẩn thận):"
echo "  [skip-evidence]  — docs-only/typo"
echo "  [skip-adr]       — schema test fixture / seed data"
echo "═══════════════════════════════════════════════════════════════"
