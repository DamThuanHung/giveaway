# Export Manifest — Bringing framework to new project

> Universal. Bảng kê đầy đủ files cần copy + adjust per-stack +
> verification checklist sau setup.

---

## 1. One-liner setup (recommended)

```bash
# Từ thư mục Trao Tay (hoặc bất kỳ project nào đã có framework):
bash scripts/setup-new-project.sh /path/to/new-project [stack]

# Stack options:
#   next-nest (default — Next.js + NestJS + Prisma)
#   django    (Django + Python)
#   rails     (Ruby on Rails)
#   go        (Go + GORM/sqlc)
#   rust      (Rust + Diesel/sqlx)
#   generic   (manual config)
```

Script tự động:
- Copy 35+ file framework
- Adjust hook regex theo stack
- Init git + install hooks local
- Tạo CLAUDE.md template + RISK_REGISTER starter
- Tạo .gitignore + .secrets.baseline + audits dir

---

## 2. Manual file list (nếu không dùng script)

### 2.1 Universal docs (21 files)

```
docs/TEST_PROTOCOL.md
docs/PROJECT_KICKOFF.md
docs/standards/README.md
docs/standards/AI_WORKING_RULES.md       ← Authoritative
docs/standards/AI_COLLABORATION_RULES.md
docs/standards/INCEPTION_DECK.md
docs/standards/ADR_TEMPLATE.md
docs/standards/DEFINITION_OF_READY_DONE.md
docs/standards/SECURITY_BASELINE.md
docs/standards/OBSERVABILITY.md
docs/standards/DISASTER_RECOVERY.md
docs/standards/RISK_REGISTER.md          ← template
docs/standards/COMPLIANCE.md
docs/standards/INCIDENT_RUNBOOK.md
docs/standards/DOCUMENTATION_STANDARDS.md
docs/standards/PERFORMANCE_AND_FINOPS.md
docs/standards/API_DESIGN_GUIDELINES.md
docs/standards/BRANCHING_RELEASE_STRATEGY.md
docs/standards/DB_MIGRATION_POLICY.md
docs/standards/ACCESSIBILITY_BASELINE.md
docs/standards/I18N_STRATEGY.md
docs/standards/VENDOR_MANAGEMENT.md
docs/standards/UPGRADE_ROADMAP.md
docs/standards/COMPLIANCE_MEASUREMENT.md
docs/standards/CLAUDE_HOOKS_TEMPLATE/README.md
```

### 2.2 Enforcement hooks + commands (`.claude/`)

```
.claude/settings.json                    ← register hooks
.claude/check-commit-evidence.sh
.claude/check-schema-adr.sh              ← cần adjust regex per stack
.claude/check-deploy-readiness.sh        ← cần adjust deploy command per stack
.claude/inject-deploy-reminder.sh
.claude/commands/adr.md
.claude/commands/postmortem.md
.claude/commands/risk-add.md
.claude/commands/deploy-check.md
.claude/commands/audit-standards.md
```

### 2.3 CI/CD workflows (`.github/workflows/`)

```
.github/workflows/standards-check.yml    ← 4 jobs PR check
.github/workflows/weekly-audit.yml       ← Sunday cron
```

### 2.4 Scripts

```
scripts/install-git-hooks.sh
scripts/git-hooks/pre-commit
scripts/git-hooks/commit-msg
scripts/audit-compliance.sh              ← Layer 1 measurement
scripts/cross-ai-review.sh               ← Layer 2 (cần API key)
scripts/synthetic-rule-test.sh           ← Layer 4 (cần API key)
scripts/setup-new-project.sh             ← chính file này export
```

---

## 3. Per-stack adjustments

### 3.1 Schema/migration path regex
File `.claude/check-schema-adr.sh` + `scripts/git-hooks/pre-commit` có regex:

| Stack | Pattern |
|---|---|
| **Prisma** (default) | `prisma/schema.prisma`, `prisma/migrations/` |
| **Django** | `*/models.py`, `*/migrations/` |
| **Rails** | `db/schema.rb`, `db/migrate/` |
| **Go (sqlc/migrate)** | `*.sql`, `migrations/` |
| **Rust (Diesel/sqlx)** | `migrations/*.sql` |
| **Sequelize** | `models/*.js`, `migrations/*.js` |
| **TypeORM** | `*.entity.ts`, `migrations/*.ts` |

### 3.2 Deploy command pattern
File `.claude/check-deploy-readiness.sh`:

| Stack | Pattern detect |
|---|---|
| **Docker Compose** (default) | `docker compose ... up -d --build` |
| **Kubernetes** | `kubectl apply`, `helm upgrade` |
| **Vercel/Netlify** | `vercel deploy --prod`, `netlify deploy --prod` |
| **AWS direct** | `aws elasticbeanstalk deploy`, `eb deploy` |
| **Custom shell** | adjust theo `./deploy.sh prod` |

### 3.3 CI workflow per language
File `.github/workflows/standards-check.yml` job `dependency-audit`:

| Stack | Tool |
|---|---|
| **Node.js** | `npm audit --audit-level=high` |
| **Python** | `pip-audit` |
| **Ruby** | `bundle audit` |
| **Go** | `govulncheck ./...` |
| **Rust** | `cargo audit` |
| **PHP** | `composer audit` |

---

## 4. Post-setup verification

### 4.1 Hooks installed correctly
```bash
ls -la .git/hooks/
# Expect: pre-commit, commit-msg (executable)

bash scripts/install-git-hooks.sh
# Expect: ✅ Installed: pre-commit + commit-msg
```

### 4.2 Test hooks E2E
```bash
# Test commit-msg block
echo "test no evidence" > /tmp/msg
bash .git/hooks/commit-msg /tmp/msg
echo "Exit: $?"   # Expect 1 nếu có non-doc staged

# Test với evidence
echo "fix
Edge cases:
- a
Test level: E2E thực" > /tmp/msg
bash .git/hooks/commit-msg /tmp/msg
echo "Exit: $?"   # Expect 0
```

### 4.3 Test audit script
```bash
bash scripts/audit-compliance.sh 7
# Expect: docs/audits/YYYY-MM-DD-weekly.md generated
```

### 4.4 Verify CLAUDE.md đã fill
```bash
grep "<fill>" CLAUDE.md
# Expect: empty (đã fill hết placeholder)
```

### 4.5 First ADR tạo qua slash command
```
/adr stack initial choice
```

### 4.6 GitHub Actions trigger
```bash
git push origin main
gh run list --limit 3
# Expect: standards-check + weekly-audit (Sunday) listed
```

---

## 5. Project-specific files (KHÔNG copy, tạo mới)

Mỗi dự án có riêng:

| File | Tạo khi nào |
|---|---|
| `CLAUDE.md` | Buổi 1 — fill template |
| `docs/PROJECT_BRIEFING.md` | Buổi 1 — Inception Deck output |
| `docs/CORE_FRAMEWORK.md` | Buổi 1-2 — architecture overview |
| `docs/DATABASE_SCHEMA.md` | Khi có DB schema |
| `docs/PROJECT_KNOWLEDGE.md` | Khi có business rules cần document |
| `docs/RISK_REGISTER.md` | Buổi 1 — populate 10 starter |
| `docs/COMPLIANCE_DASHBOARD.md` | Sau audit đầu tiên |
| `docs/adr/0001-*.md` | Sau quyết định stack đầu tiên |
| `docs/postmortems/*.md` | Khi có incident |

---

## 6. Memory portable (`~/.claude/projects/<id>/memory/`)

KHÔNG sync giữa dự án (mỗi project memory riêng), nhưng **3 file MUST có** từ buổi 1:

```
memory/
├── MEMORY.md
├── user_role.md                          ← user là ai
├── project_goal.md                       ← mục tiêu cao tầng
└── feedback_collaboration_style.md       ← ngôn ngữ + tone + quyền AI
```

---

## 7. Update framework khi có nâng cấp

Khi framework gốc (Trao Tay) update:

```bash
# Trong project mới
cd /path/to/new-project

# Backup customization
cp .claude/check-schema-adr.sh .claude/check-schema-adr.sh.local

# Pull updates từ Trao Tay (nếu có git remote)
# HOẶC re-run setup script (overwrite)
bash /path/to/giveaway/scripts/setup-new-project.sh . <stack>

# Re-apply customization
diff .claude/check-schema-adr.sh.local .claude/check-schema-adr.sh
# Manual merge nếu cần
```

Đề xuất: tạo **GitHub template repo** cho framework để dùng `git pull upstream`:
```bash
gh repo create claude-framework --template
# Add framework files
# Trong project mới:
git remote add upstream git@github.com:user/claude-framework.git
git fetch upstream
git merge upstream/main --allow-unrelated-histories
```

---

## 8. Troubleshooting

### Hooks không chạy
```bash
# Verify
ls -la .git/hooks/pre-commit .git/hooks/commit-msg
# Phải executable

# Re-install
bash scripts/install-git-hooks.sh
```

### Audit script lỗi date command (macOS vs Linux)
```bash
# macOS dùng BSD date, Linux dùng GNU date
# Script đã handle both via fallback
```

### CI workflow không trigger
```bash
# Verify Actions enabled
gh repo view --json hasIssuesEnabled,hasProjectsEnabled
# Settings → Actions → Allow all actions
```

### Slash command không recognize
```bash
# .claude/commands/*.md cần frontmatter ---description---
head -3 .claude/commands/adr.md
# Verify format
```
