#!/usr/bin/env bash
# Setup framework universal cho dự án mới.
# Copy 21 file standards + hooks + commands + CI + scripts.
#
# Usage:
#   bash scripts/setup-new-project.sh <target-dir> [stack]
#
# stack: next-nest (default) | django | rails | go | rust | generic
#
# Output: target-dir đầy đủ framework, ready để dùng Claude Code.

set -e

TARGET="${1:-}"
STACK="${2:-next-nest}"

if [ -z "$TARGET" ]; then
  cat <<EOF
Usage: $0 <target-dir> [stack]

Stack options:
  next-nest  — Next.js + NestJS + Prisma (default, cùng Trao Tay)
  django     — Django + Python
  rails      — Ruby on Rails
  go         — Go + GORM/sqlc
  rust       — Rust + Diesel/sqlx
  generic    — không adjust gì, manual config

Examples:
  bash $0 ../petcare-app next-nest
  bash $0 /c/projects/saas-tool django
EOF
  exit 1
fi

# Resolve absolute path
TARGET=$(realpath "$TARGET" 2>/dev/null || readlink -f "$TARGET" 2>/dev/null || echo "$TARGET")

# Detect SOURCE — 3 modes:
#   1. $FRAMEWORK_SOURCE env var override (bundled installer set)
#   2. Git repo (chạy từ Trao Tay hoặc project có framework)
#   3. Script's parent dir (chạy từ extracted tarball)
if [ -n "$FRAMEWORK_SOURCE" ]; then
  SOURCE="$FRAMEWORK_SOURCE"
elif git rev-parse --show-toplevel > /dev/null 2>&1; then
  SOURCE=$(git rev-parse --show-toplevel)
else
  SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
  SOURCE=$(dirname "$SCRIPT_DIR")
fi

if [ -d "$TARGET" ] && [ -f "$TARGET/CLAUDE.md" ]; then
  echo "⚠️  Target đã có CLAUDE.md — overwrite? [y/N]"
  read -r confirm
  [ "$confirm" != "y" ] && exit 0
fi

echo "═══════════════════════════════════════════════════════════════"
echo "Setup Claude Universal Framework"
echo "═══════════════════════════════════════════════════════════════"
echo "Source: $SOURCE"
echo "Target: $TARGET"
echo "Stack:  $STACK"
echo ""

# Create directory structure
mkdir -p "$TARGET/docs/standards/CLAUDE_HOOKS_TEMPLATE"
mkdir -p "$TARGET/docs/adr"
mkdir -p "$TARGET/docs/postmortems"
mkdir -p "$TARGET/docs/audits"
mkdir -p "$TARGET/docs/runbooks"
mkdir -p "$TARGET/.claude/commands"
mkdir -p "$TARGET/.github/workflows"
mkdir -p "$TARGET/scripts/git-hooks"

# ─── Copy docs/standards/ (21 file) ────────────────────────────────
echo "📋 Copying docs/standards/..."
cp -r "$SOURCE/docs/standards/"* "$TARGET/docs/standards/" 2>/dev/null
echo "  ✓ 21 standards files"

# ─── Copy root docs ───────────────────────────────────────────────
cp "$SOURCE/docs/TEST_PROTOCOL.md" "$TARGET/docs/" 2>/dev/null
cp "$SOURCE/docs/PROJECT_KICKOFF.md" "$TARGET/docs/" 2>/dev/null
echo "  ✓ TEST_PROTOCOL + PROJECT_KICKOFF"

# ─── Create README in adr/ ────────────────────────────────────────
cat > "$TARGET/docs/adr/README.md" <<'EOF'
# Architecture Decision Records

Index ADRs theo chronological order. Format: Michael Nygard.

| # | Title | Status | Date |
|---|---|---|---|
| (Tạo ADR đầu tiên qua /adr command) | | | |

Xem `docs/standards/ADR_TEMPLATE.md` cho template.
EOF

cat > "$TARGET/docs/postmortems/README.md" <<'EOF'
# Postmortems

Index incidents + postmortems. Blameless format theo Google SRE.

| Date | Title | Severity | MTTR | Action items closed |
|---|---|---|---|---|
| (Postmortem đầu tiên qua /postmortem command) | | | | |

Xem `docs/standards/INCIDENT_RUNBOOK.md` cho template.
EOF

# ─── Copy .claude/ ────────────────────────────────────────────────
echo "🔧 Copying .claude/ hooks..."
cp "$SOURCE/.claude/settings.json" "$TARGET/.claude/"
cp "$SOURCE/.claude/check-commit-evidence.sh" "$TARGET/.claude/"
cp "$SOURCE/.claude/check-schema-adr.sh" "$TARGET/.claude/"
cp "$SOURCE/.claude/check-deploy-readiness.sh" "$TARGET/.claude/"
cp "$SOURCE/.claude/inject-deploy-reminder.sh" "$TARGET/.claude/"
cp "$SOURCE/.claude/commands/"*.md "$TARGET/.claude/commands/"
echo "  ✓ 4 hooks + 5 slash commands"

# ─── Copy .github/workflows/ ──────────────────────────────────────
cp "$SOURCE/.github/workflows/standards-check.yml" "$TARGET/.github/workflows/"
cp "$SOURCE/.github/workflows/weekly-audit.yml" "$TARGET/.github/workflows/"
echo "  ✓ 2 GitHub Actions workflows"

# ─── Copy scripts/ ────────────────────────────────────────────────
cp "$SOURCE/scripts/git-hooks/"* "$TARGET/scripts/git-hooks/"
cp "$SOURCE/scripts/install-git-hooks.sh" "$TARGET/scripts/"
cp "$SOURCE/scripts/audit-compliance.sh" "$TARGET/scripts/"
cp "$SOURCE/scripts/cross-ai-review.sh" "$TARGET/scripts/"
cp "$SOURCE/scripts/synthetic-rule-test.sh" "$TARGET/scripts/"
echo "  ✓ 7 scripts"

# Make executable
chmod +x "$TARGET/scripts/"*.sh
chmod +x "$TARGET/scripts/git-hooks/"*
chmod +x "$TARGET/.claude/"*.sh

# ─── Adjust hooks per stack ───────────────────────────────────────
echo "🔨 Adjusting hooks for stack: $STACK"
case "$STACK" in
  next-nest)
    echo "  ✓ Default Next.js + NestJS + Prisma — không cần adjust"
    ;;
  django)
    sed -i.bak \
      -e 's|prisma/schema\.prisma|*/models.py|g' \
      -e 's|prisma/migrations/|*/migrations/|g' \
      "$TARGET/.claude/check-schema-adr.sh" \
      "$TARGET/scripts/git-hooks/pre-commit"
    rm -f "$TARGET/.claude/check-schema-adr.sh.bak" "$TARGET/scripts/git-hooks/pre-commit.bak"
    echo "  ✓ Adjusted for Django (models.py + migrations/)"
    ;;
  rails)
    sed -i.bak \
      -e 's|prisma/schema\.prisma|db/schema.rb|g' \
      -e 's|prisma/migrations/|db/migrate/|g' \
      "$TARGET/.claude/check-schema-adr.sh" \
      "$TARGET/scripts/git-hooks/pre-commit"
    rm -f "$TARGET/.claude/check-schema-adr.sh.bak" "$TARGET/scripts/git-hooks/pre-commit.bak"
    echo "  ✓ Adjusted for Rails (db/schema.rb + db/migrate/)"
    ;;
  go)
    sed -i.bak \
      -e 's|prisma/schema\.prisma|*.sql|g' \
      -e 's|prisma/migrations/|migrations/|g' \
      "$TARGET/.claude/check-schema-adr.sh" \
      "$TARGET/scripts/git-hooks/pre-commit"
    rm -f "$TARGET/.claude/check-schema-adr.sh.bak" "$TARGET/scripts/git-hooks/pre-commit.bak"
    echo "  ✓ Adjusted for Go (.sql + migrations/)"
    ;;
  rust)
    sed -i.bak \
      -e 's|prisma/schema\.prisma|migrations/*.sql|g' \
      -e 's|prisma/migrations/|migrations/|g' \
      "$TARGET/.claude/check-schema-adr.sh" \
      "$TARGET/scripts/git-hooks/pre-commit"
    rm -f "$TARGET/.claude/check-schema-adr.sh.bak" "$TARGET/scripts/git-hooks/pre-commit.bak"
    echo "  ✓ Adjusted for Rust (migrations/)"
    ;;
  generic)
    echo "  ⚠️  Generic stack — adjust .claude/check-schema-adr.sh manually"
    echo "      Edit regex pattern theo schema/migration path của stack"
    ;;
esac

# ─── Create CLAUDE.md template ────────────────────────────────────
echo "📝 Creating CLAUDE.md template..."
cat > "$TARGET/CLAUDE.md" <<EOF
# CLAUDE.md — <Tên dự án>

## VAI TRÒ AI
Bạn là Tech Lead AI / Pair Programmer của dự án này.

---

## ĐỌC TRƯỚC MỖI SESSION

Mỗi session mới, PHẢI đọc theo thứ tự:

| # | File | Mục đích |
|---|---|---|
| 1 | \`docs/PROJECT_BRIEFING.md\` | Mục tiêu + ràng buộc + stack quyết (Inception output) |
| 2 | \`docs/standards/AI_WORKING_RULES.md\` | **Authoritative** — quy tắc AI phải tuân |
| 3 | \`docs/TEST_PROTOCOL.md\` | 5 mức test pyramid + checklist verify production |
| 4 | \`docs/standards/README.md\` | Index 21 file standards |
| 5 | \`docs/standards/UPGRADE_ROADMAP.md\` | 8 upgrade trigger-based |
| 6 | \`docs/standards/COMPLIANCE_MEASUREMENT.md\` | 4-layer measurement đo AI compliance |

---

## CHECKLIST TRƯỚC KHI CODE

\`\`\`
[ ] Đã đọc đủ tài liệu bắt buộc?
[ ] Task qua Definition of Ready (xem DEFINITION_OF_READY_DONE)?
[ ] Mức test mục tiêu rõ (TEST_PROTOCOL §3)?
[ ] Schema change → có ADR mới (xem ADR_TEMPLATE)?
[ ] Edge cases liệt kê (5+ items)?
[ ] Long-term thinking 5 câu hỏi (AI_WORKING_RULES §9.0)?
\`\`\`

---

## STACK

- Frontend: <fill>
- Backend: <fill>
- DB: <fill>
- Deploy: <fill>
- Testing: <fill>

---

## NGÔN NGỮ

- Code/comment: <Vietnamese / English>
- Commit message: Conventional Commits + Edge cases + Test level
- User-facing UI: <fill>
- Tone xưng hô: <fill, vd hoàng thượng/thần>

---

## QUYỀN HẠN AI

| Action | AI tự làm | Cần xin phép | CẤM |
|---|---|---|---|
| Edit/Write file | ☐ | ☐ | ☐ |
| Run script test | ☐ | ☐ | ☐ |
| Git commit | ☐ | ☐ | ☐ |
| Git push | ☐ | ☐ | ☐ |
| Deploy production | ☐ | ☐ | ☐ |
| DB migration | ☐ | ☐ | ☐ |
| \`rm -rf\`, force push | ☐ | ☐ | ☐ |
| Spend money (cloud, API) | ☐ | ☐ | ☐ |

---

## DEFINE "DONE"

Theo TEST_PROTOCOL.md §3 mức tương ứng task:
- Đổi label/icon: mức 2 (mental walkthrough)
- Sửa logic frontend: mức 3 (integration)
- Sửa API backend: mức 4 (E2E local)
- Schema migration: **mức 5** (production smoke + verify table)
- Cross-service feature: **mức 5** + trigger E2E pipeline

---

## SESSION TRIGGERS

- "sync tình hình" → đọc CLAUDE.md + memory + git log → báo cáo 4 mục
- "tiếp tục" → resume task dở từ session trước
- "compact" → tổng hợp session vào memory trước reset

---

## DECISION LOG

| Date | Quyết định | Lý do | ADR |
|---|---|---|---|
| | | | |
EOF

# ─── Create initial RISK_REGISTER ─────────────────────────────────
echo "⚠️  Creating RISK_REGISTER.md template..."
cat > "$TARGET/docs/RISK_REGISTER.md" <<'EOF'
# Risk Register — <Project Name>

Last full review: YYYY-MM-DD
Next scheduled review: YYYY-MM-DD (đầu tháng kế)

Xem `docs/standards/RISK_REGISTER.md` cho template + 10 risk starter.

## Open risks

### R-001: Single point of failure — primary database
- Category: Technical
- Probability: 3 / Impact: 5 / Score: 15 (Orange)
- Owner: hoàng thượng
- Status: Open
- Mitigation: Daily backup 3-2-1 + offsite (xem DISASTER_RECOVERY.md)

### R-002: Secret leak qua git commit
- Category: Security
- Probability: 2 / Impact: 5 / Score: 10 (Orange)
- Status: Mitigating
- Mitigation: pre-commit hook detect secret, gitleaks CI

(Thêm 8 risk starter còn lại theo template trong docs/standards/RISK_REGISTER.md §6)

## Closed risks

(empty)
EOF

# ─── Create empty .secrets.baseline ────────────────────────────────
touch "$TARGET/.secrets.baseline"

# ─── Create .gitignore ────────────────────────────────────────────
if [ ! -f "$TARGET/.gitignore" ]; then
  cat > "$TARGET/.gitignore" <<'EOF'
# Dependencies
node_modules/
__pycache__/
target/
vendor/

# Build
dist/
build/
out/
.next/

# Env
.env
.env.local
.env.*.local
!.env.example

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Claude Code session-local (whitelist managed hooks)
.claude/*
!.claude/check-commit-evidence.sh
!.claude/check-schema-adr.sh
!.claude/check-deploy-readiness.sh
!.claude/inject-deploy-reminder.sh
!.claude/settings.json
!.claude/commands/
!.claude/commands/**

# Audits (generated)
docs/audits/*.md
!docs/audits/.gitkeep
EOF
fi
touch "$TARGET/docs/audits/.gitkeep"

# ─── Init git + install hooks ─────────────────────────────────────
cd "$TARGET"
if [ ! -d .git ]; then
  echo "🔨 Init git repo..."
  git init -q
fi

echo "🔗 Install git hooks..."
bash scripts/install-git-hooks.sh > /dev/null

# ─── Done ─────────────────────────────────────────────────────────
FRAMEWORK_VERSION=$(cd "$SOURCE" && git log -1 --format=%h)

cat <<EOF

═══════════════════════════════════════════════════════════════
✅ Framework setup COMPLETE: $TARGET
═══════════════════════════════════════════════════════════════

Framework version: $FRAMEWORK_VERSION (commit từ Trao Tay)
Stack: $STACK
Files created:
  - 21 files in docs/standards/
  - 4 hooks + 5 slash commands in .claude/
  - 2 GitHub Actions workflows
  - 7 scripts (audit + cross-AI + synthetic + git hooks)
  - CLAUDE.md template (cần fill)
  - RISK_REGISTER.md với 10 starter risks
  - .gitignore + .secrets.baseline + audits dir

═══════════════════════════════════════════════════════════════
NEXT STEPS
═══════════════════════════════════════════════════════════════

1. cd $TARGET

2. Fill CLAUDE.md với thông tin dự án mới (stack, ngôn ngữ, quyền hạn AI)

3. Mở Claude Code, bắt đầu Inception Deck (10 câu — xem docs/standards/INCEPTION_DECK.md):
   "Trẫm muốn làm dự án X. Hãy hỏi 7 câu mở đầu theo PROJECT_KICKOFF.md"

4. Output Inception → docs/PROJECT_BRIEFING.md

5. Tạo ADR đầu tiên qua slash command:
   /adr <tựa đề stack initial>

6. Pilot task small (1-2h) để verify entire workflow:
   - Code → commit (hooks chặn nếu thiếu evidence/ADR) → push → CI pass → deploy → smoke

7. Setup GitHub repo + push:
   gh repo create <name> --private --source=. --remote=origin --push

8. Verify L3 GitHub Actions kích hoạt:
   gh run list --limit 3

═══════════════════════════════════════════════════════════════

Tham khảo: docs/standards/EXPORT_MANIFEST.md cho full file list
+ adjust per stack chi tiết.

EOF
