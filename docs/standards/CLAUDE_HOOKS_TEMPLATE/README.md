# Claude Hooks Template — Portable Enforcement

> Bộ template hooks + slash commands + CI/CD để enforce standards.
> Copy nguyên thư mục này sang dự án mới khi kickoff.

---

## Cấu trúc

```
.claude/
├── settings.json              ← register hooks
├── check-commit-evidence.sh   ← Hook: chặn commit thiếu Edge cases + Test level
├── check-schema-adr.sh        ← Hook: chặn schema change không ADR
├── check-deploy-readiness.sh  ← Hook: chặn deploy chưa có ack file
├── inject-deploy-reminder.sh  ← Hook: inject reminder khi user nói "deploy"
└── commands/
    ├── adr.md                 ← /adr <title>
    ├── postmortem.md          ← /postmortem <title>
    ├── risk-add.md            ← /risk-add <description>
    ├── deploy-check.md        ← /deploy-check
    └── audit-standards.md     ← /audit-standards (weekly)

.github/workflows/
└── standards-check.yml        ← CI: ADR check + commit evidence + secret scan + deps audit

.pre-commit-config.yaml        ← Local pre-commit: detect-secrets + conventional commit
```

---

## Cài đặt

### Bước 1: Copy file
```bash
# Trong dự án mới
cp -r path/to/giveaway/.claude .
cp -r path/to/giveaway/.github/workflows/standards-check.yml .github/workflows/
cp path/to/giveaway/.pre-commit-config.yaml .
```

### Bước 2: Setup pre-commit (optional nhưng khuyến nghị)
```bash
pip install pre-commit
pre-commit install --hook-type pre-commit --hook-type commit-msg
detect-secrets scan > .secrets.baseline
git add .secrets.baseline
```

### Bước 3: Customize
Sửa các file:
- `.claude/check-schema-adr.sh` — adjust regex match cho stack mới (Django models? sequelize migrations?)
- `.claude/check-deploy-readiness.sh` — adjust deploy command pattern
- `.github/workflows/standards-check.yml` — adjust path filter, npm/cargo/pip tùy stack

### Bước 4: Test
```bash
# Test hook commit evidence
echo '{"command": "git commit -m \"test\""}' | bash .claude/check-commit-evidence.sh
# Should: exit 1 + show error

# Test hook schema ADR (sau khi staged schema change)
echo '{"command": "git commit -m \"feat: new model\""}' | bash .claude/check-schema-adr.sh
# Should: exit 1 nếu schema staged + ADR chưa staged
```

---

## 3 Layers enforcement

| Layer | Mạnh | Tools |
|---|---|---|
| L1 | ~60% — soft, dựa trí nhớ AI | CLAUDE.md, MEMORY index, docs/standards/ |
| L2 | ~85% — hooks chặn, AI bypass được nếu cố tình | `.claude/settings.json` hooks + commands |
| L3 | ~99% — không bypass được | GitHub Actions + pre-commit local |

L1 đơn lẻ → bug ngầm như Web Push session 2026-05-08.
L1+L2 → phần lớn việc auto-flag nhưng vẫn bypass với `[skip-*]` flag.
L1+L2+L3 → hard gate, an toàn.

---

## Bypass flags

Khi thực sự cần skip (cẩn thận, không lạm dụng):

| Flag | Tác dụng |
|---|---|
| `[skip-evidence]` | Skip Edge cases + Test level check (chỉ docs-only/typo) |
| `[skip-adr]` | Skip ADR requirement cho schema change (chỉ test fixture/seed data) |
| `[emergency-rollback]` | Skip deploy readiness check (rollback sự cố) |
| `[skip-deploy-check]` | Skip deploy readiness check (chỉ pre-prod environment) |

Mỗi lần dùng bypass flag → log vào RISK_REGISTER với risk "process gap".

---

## Khi update standards

Nếu hoàng thượng update `docs/standards/` → check xem hooks có cần update tương ứng không:

| Standards file đổi | Hook ảnh hưởng |
|---|---|
| ADR_TEMPLATE.md | check-schema-adr.sh có thể cần update format check |
| TEST_PROTOCOL.md | check-deploy-readiness.sh có thể cần update checklist items |
| INCIDENT_RUNBOOK.md | postmortem.md command có thể cần update template |
| SECURITY_BASELINE.md | standards-check.yml có thể cần thêm scan |

---

## Anti-pattern khi dùng template

- Copy hooks rồi không setup pre-commit/GH Actions → chỉ có L2, không L3
- Disable hooks vì "annoying" → mất enforcement
- Bypass flag mỗi commit → defeats purpose, không phải bypass nữa
- Không update template khi standards đổi → hooks check cái cũ, miss vi phạm mới
- Không test hook scripts trên dự án mới → silent fail không ai biết

---

## Effectiveness measurement

Setup `/audit-standards` chạy mỗi Chủ Nhật:
- Output % tuân thủ tuần qua
- Nếu < 80% liên tục 2 tuần → review hook config + bypass usage
- Nếu > 95% bền vững → consider relax 1 hook nếu nó "annoying" vô lý
