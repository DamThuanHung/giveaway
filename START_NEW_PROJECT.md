# Start New Project — Quick Reference

> 1 trang. Áp dụng bộ luật + quy trình cho dự án mới chỉ trong 1-2 giờ.
> Mọi thứ bộ luật đề cập đều nằm ở đường dẫn rõ ràng bên dưới.

---

## Bộ luật bao gồm gì

**24 file trong `docs/standards/`** + 2 file root (`TEST_PROTOCOL.md`, `PROJECT_KICKOFF.md`):

| Domain | File chính |
|---|---|
| Test discipline | `docs/TEST_PROTOCOL.md` (5 mức pyramid) |
| Project kickoff | `docs/PROJECT_KICKOFF.md` (7 câu mở đầu + Inception 10 câu) |
| AI working style | `docs/standards/AI_WORKING_RULES.md` (authoritative) |
| User playbook | `docs/standards/AI_COLLABORATION_RULES.md` |
| Architecture | `docs/standards/ADR_TEMPLATE.md` |
| Process | `docs/standards/DEFINITION_OF_READY_DONE.md` |
| Security | `docs/standards/SECURITY_BASELINE.md` |
| Observability | `docs/standards/OBSERVABILITY.md` |
| Reliability | `docs/standards/DISASTER_RECOVERY.md` |
| Risk | `docs/standards/RISK_REGISTER.md` |
| Compliance | `docs/standards/COMPLIANCE.md` |
| Incident | `docs/standards/INCIDENT_RUNBOOK.md` |
| Documentation | `docs/standards/DOCUMENTATION_STANDARDS.md` |
| Performance + Cost | `docs/standards/PERFORMANCE_AND_FINOPS.md` |
| API design | `docs/standards/API_DESIGN_GUIDELINES.md` |
| Branching | `docs/standards/BRANCHING_RELEASE_STRATEGY.md` |
| DB migration | `docs/standards/DB_MIGRATION_POLICY.md` |
| Accessibility | `docs/standards/ACCESSIBILITY_BASELINE.md` |
| i18n | `docs/standards/I18N_STRATEGY.md` |
| Vendor | `docs/standards/VENDOR_MANAGEMENT.md` |
| Upgrade roadmap | `docs/standards/UPGRADE_ROADMAP.md` |
| Compliance measure | `docs/standards/COMPLIANCE_MEASUREMENT.md` |

**Enforcement (tự chạy):**
- 4 hooks Claude Code: `.claude/*.sh`
- 5 slash commands: `.claude/commands/*.md`
- 2 git hooks: `scripts/git-hooks/*` (chạy mỗi git commit)
- 2 GitHub Actions workflows: `.github/workflows/*.yml` (chạy mỗi push + Sunday cron)

---

## Quy trình bao gồm gì

**Khi bắt đầu dự án mới:**
1. Buổi 1: 7 câu mở đầu + Inception Deck → output `PROJECT_BRIEFING.md`
2. Stack decision → ADR-0001
3. Setup skeleton (script tự làm) → repo có hooks + structure đầy đủ
4. Pilot task small để verify workflow

**Khi làm mỗi feature:**
1. Check Definition of Ready (DoR đầy đủ chưa?)
2. Code → commit (hooks tự enforce evidence + ADR)
3. Push → GitHub Actions chạy 4 jobs
4. Deploy staging → smoke test theo TEST_PROTOCOL §4
5. Hoàng thượng test → OK → merge main → auto deploy production

**Khi có sự cố:**
1. Status page update
2. Mitigation < 1h
3. Postmortem trong 48h (blameless)
4. Update RISK_REGISTER

**Định kỳ:**
- Mỗi tuần: `/audit-standards` (Sunday auto)
- Mỗi tháng: review RISK_REGISTER
- Mỗi quý: UPGRADE_ROADMAP triggers + security audit
- Mỗi 6 tháng: DR drill thật

---

## Áp dụng cho dự án mới — 4 BƯỚC

### Bước 1: Tạo dự án mới với framework

**Cách A — chạy script từ Trao Tay repo:**
```bash
bash c:/projects/giveaway/scripts/setup-new-project.sh c:/projects/<tên-dự-án> <stack>
```

Stack options: `next-nest` (default) | `django` | `rails` | `go` | `rust` | `generic`

**Cách B — clone Trao Tay từ GitHub trước (nếu chưa có local):**
```bash
git clone https://github.com/DamThuanHung/giveaway
bash giveaway/scripts/setup-new-project.sh /path/to/new-project <stack>
```

Script tự động:
- Copy 24 file standards + hooks + commands + CI workflows + scripts
- Adjust hook regex theo stack
- Tạo CLAUDE.md template + RISK_REGISTER với 10 starter
- `git init` + cài hooks local

### Bước 2: Fill CLAUDE.md

Mở `<dự án>/CLAUDE.md`, thay placeholder `<fill>`:
- Stack (Frontend / Backend / DB / Deploy)
- Ngôn ngữ code/comment/UI
- Tone xưng hô (vd hoàng thượng/thần)
- Quyền hạn AI (tự push? tự deploy? tự destructive?)

### Bước 3: Mở Claude Code và bắt đầu Inception

Trong dự án mới, mở Claude Code, paste:

> "Trẫm muốn làm dự án **<mô tả ý tưởng>**. UI hướng **<warm/minimal/...>**.
> Hãy hỏi 7 câu mở đầu theo PROJECT_KICKOFF.md, sau đó Inception Deck 10 câu.
> Output cuối: `docs/PROJECT_BRIEFING.md` đầy đủ."

Thần sẽ hỏi 7 câu → 10 câu Inception → đề xuất stack ADR → tạo design system tokens.

### Bước 4: Pilot task verify workflow

1 task nhỏ trong buổi 1 (vd "trang chủ với button 'Hello'"):
- Code → commit (hooks chặn nếu thiếu evidence) → push → CI pass → deploy → screenshot

Nếu pilot xong = framework đã work end-to-end. Sang sprint 1 làm feature thật.

---

## Sau buổi 1, mỗi session sau

Chỉ cần nói: **"tiếp tục"**

Thần tự đọc CLAUDE.md + memory + git log → báo cáo state → tiếp feature.

---

## Reference đầy đủ

- **Setup script chi tiết:** `scripts/setup-new-project.sh`
- **Per-stack adjust + verification:** `docs/standards/EXPORT_MANIFEST.md`
- **Workflow chi tiết:** `docs/PROJECT_KICKOFF.md`
- **Bộ luật authoritative:** `docs/standards/AI_WORKING_RULES.md`

---

## Khi update bộ luật

Khi rule mới (vd thêm/sửa standards):
1. Update file ở Trao Tay repo (master copy)
2. Project mới muốn pull update → re-run `setup-new-project.sh` overwrite (script confirm trước)
3. Hoặc cherry-pick file thay đổi: `cp giveaway/docs/standards/X.md <project>/docs/standards/X.md`

Long-term: chuyển framework thành GitHub template repo riêng (`claude-framework`) → `git pull upstream` hợp lý hơn.
