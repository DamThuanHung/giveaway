# Documentation Standards

> Universal. Quy định **viết** và **bảo trì** documentation cho mọi dự án.
> Distinguish các loại doc + khi nào dùng cái nào + format chuẩn.

---

## 1. Hierarchy — 5 loại doc, 5 mục đích

```
1. README.md (entry point)
   ↓
2. docs/ (architecture + business + ops)
   ↓
3. ADR (immutable decisions)
   ↓
4. Code comments (inline WHY non-obvious)
   ↓
5. API spec (OpenAPI/GraphQL schema, machine-readable)
```

| Loại | Audience | Mutability | Sống bao lâu |
|---|---|---|---|
| README | Newcomer | Mutable | Cập nhật khi setup đổi |
| docs/ | Dev/ops/biz | Mutable | Cập nhật khi kiến trúc/business đổi |
| ADR | Future dev (kể cả user 1 năm sau) | **Immutable** | Vĩnh viễn — Superseded → ADR mới |
| Code comment | Dev đọc code | Mutable | Cùng vòng đời code |
| API spec | Client devs + tools | Mutable | Versioned — breaking change → version mới |

---

## 2. README.md — template

Mỗi repo phải có README.md ở root với cấu trúc:

```markdown
# <Project Name>

<1-2 câu pitch — what + for who>

## Quick start
\```bash
git clone ...
cp .env.example .env
docker compose up
# Truy cập http://localhost:3000
\```

## Stack
- Frontend: Next.js 14
- Backend: NestJS + Prisma
- DB: PostgreSQL 16
- Deploy: AWS EC2 + Cloudflare

## Project structure
\```
.
├── backend/    NestJS API
├── web/        Next.js static export
├── app/        Flutter mobile
├── docs/       Architecture + business docs
└── scripts/    Deploy + utility
\```

## Documentation
- `docs/PROJECT_BRIEFING.md` — Mục tiêu + ràng buộc
- `docs/TEST_PROTOCOL.md` — Test discipline
- `docs/standards/` — Enterprise-grade standards
- `docs/adr/` — Architecture decisions

## Development
\```bash
npm run dev       # Backend dev mode
npm run test      # Run tests
npm run build     # Production build
\```

## Deploy
Xem `docs/standards/CLAUDE_HOOKS_TEMPLATE/README.md` + `scripts/deploy.sh`.

## Contributing
Tuân thủ:
- `docs/standards/AI_WORKING_RULES.md` (cho AI)
- `docs/standards/AI_COLLABORATION_RULES.md` (cho human)
- Pre-commit hooks: `bash scripts/install-git-hooks.sh`

## License
MIT (hoặc license của dự án)
```

### KHÔNG cho vào README
- Architecture detail (vào `docs/CORE_FRAMEWORK.md`)
- Business strategy (vào `docs/PROJECT_BRIEFING.md`)
- Decision log dài (vào ADR)
- API endpoint chi tiết (vào OpenAPI spec)

---

## 3. docs/ structure

```
docs/
├── PROJECT_BRIEFING.md       ← What + Why + How (Inception output)
├── CORE_FRAMEWORK.md         ← Architecture + conventions
├── DATABASE_SCHEMA.md        ← Tables + relationships + indexes
├── PROJECT_KNOWLEDGE.md      ← Glossary + business rules
├── TEST_PROTOCOL.md          ← Test discipline (universal)
├── PROJECT_KICKOFF.md        ← Kickoff workflow (universal)
├── PRODUCTION_CHECKLIST.md   ← Pre-launch checklist
├── adr/
│   ├── README.md             ← ADR index
│   └── NNNN-*.md             ← Individual decisions
├── postmortems/
│   ├── README.md             ← Index + stats
│   └── YYYY-MM-DD-*.md       ← Individual postmortems
├── runbooks/
│   ├── deploy.md
│   ├── rollback.md
│   ├── db-restore.md
│   └── incident-response.md
├── standards/                ← Universal standards (10 file)
│   ├── README.md
│   ├── ADR_TEMPLATE.md
│   ├── DEFINITION_OF_READY_DONE.md
│   ├── SECURITY_BASELINE.md
│   ├── OBSERVABILITY.md
│   ├── DISASTER_RECOVERY.md
│   ├── RISK_REGISTER.md
│   ├── COMPLIANCE.md
│   ├── INCIDENT_RUNBOOK.md
│   ├── INCEPTION_DECK.md
│   ├── AI_WORKING_RULES.md
│   ├── AI_COLLABORATION_RULES.md
│   ├── DOCUMENTATION_STANDARDS.md (file này)
│   └── PERFORMANCE_AND_FINOPS.md
└── modules/                  ← Per-module business logic (project-specific)
    ├── _index.md
    └── <module>.md
```

---

## 4. Code comments policy

### Default: KHÔNG comment

Lý do: well-named identifier đã làm tốt 90% việc giải thích WHAT.

### Khi nào VIẾT comment

Chỉ viết khi WHY non-obvious:

✅ **Hidden constraint**
```ts
// Phải sleep 100ms — Sentry SDK flush async, exit ngay sẽ mất event
await new Promise(r => setTimeout(r, 100));
```

✅ **Subtle invariant**
```ts
// userId luôn lowercase ở đây — DB collation case-sensitive nhưng input
// có thể mixed case. KHÔNG đổi sang uppercase ở chỗ khác.
const id = userId.toLowerCase();
```

✅ **Workaround cho bug cụ thể**
```ts
// Workaround Chromium bug #1452XXX — paste event không fire trên iOS Safari
// nếu input có readonly. Dùng setTimeout để defer focus.
setTimeout(() => input.focus(), 0);
```

✅ **Behavior surprise reader**
```ts
// Trả về null thay vì throw — caller dùng pattern Either<null, T> để
// distinguish "not found" vs "error", không bao giờ throw NotFound.
return user ?? null;
```

### CẤM viết comment

❌ **Explain WHAT (đã có name)**
```ts
// Lấy user từ DB
const user = await getUserById(id);  // ← thừa
```

❌ **Reference current task / fix**
```ts
// Fix bug #234 — added validation
// Used by signup flow
// Added 2026-05-08
```
→ Thuộc về PR description / commit message / git blame, KHÔNG inline.

❌ **TODO/FIXME mơ hồ**
```ts
// TODO: handle edge case
// FIXME: somehow this works
```
→ Tạo ticket cụ thể, không TODO comment.

❌ **Outdated comment**
```ts
// Returns array of strings  ← function giờ trả về Set<User>
function fetchData() { ... }
```

### Comment block đầu file
Chỉ khi file có public API hoặc complex enough:
```ts
/// Service xử lý Web Push notification.
///
/// Khác FCM (mobile) — Web Push dùng VAPID + browser Push API.
/// Hỗ trợ Chrome/Firefox/Edge desktop+Android, Safari iOS 16.4+ PWA.
///
/// 410 Gone từ push service → tự prune subscription khỏi DB.
```

KHÔNG cần block đầu file cho component UI đơn giản, helper file ngắn.

---

## 5. API documentation

### REST API → OpenAPI 3.x
- File: `backend/openapi.yaml` (hoặc auto-generate từ code)
- Versioning: `/v1/`, `/v2/` trong URL path
- Mỗi endpoint mô tả: summary, parameters, request body schema, response schema, example, error codes
- Tools: Swagger UI để render

### GraphQL → schema-first
- File: `backend/schema.graphql`
- Mỗi type/field có description
- Deprecation: `@deprecated(reason: "...")` thay vì xóa thẳng

### Versioning policy
- Breaking change → version mới, giữ version cũ ít nhất 6 tháng
- Non-breaking → cùng version
- Deprecation announcement trong CHANGELOG.md trước khi xóa

---

## 6. Inline doc — ngôn ngữ

### Universal
- Comment bằng ngôn ngữ chính của dự án
- Dự án Việt Nam: tiếng Việt OK trong comment, KHÔNG dùng emoji trừ khi user yêu cầu
- Dự án quốc tế: English

### Mixed code + business term
- Code identifier: English (function/variable/class)
- Comment giải thích business: ngôn ngữ project
- Vd Trao Tay: `boostTier` (variable English) — `// 0=none, 2=Plus, 3=VIP — không dùng tier 1` (comment Việt)

---

## 7. Maintenance — keep doc fresh

### Update trigger
| Sự kiện | Update gì |
|---|---|
| Schema thay đổi | DATABASE_SCHEMA.md + ADR |
| Endpoint thêm/đổi | OpenAPI spec + CORE_FRAMEWORK |
| Module mới | docs/modules/_index.md + module file |
| Stack đổi (vd Postgres → Aurora) | ADR mới (Superseded) |
| Business rule đổi | PROJECT_KNOWLEDGE.md |
| Sự cố production | postmortems/ |
| Vendor mới | COMPLIANCE.md vendor table |

### Stale doc detection
- Mỗi quý: grep doc tìm function/file/path đã rename/delete → update
- Mỗi năm: re-read từng doc, đánh dấu phần stale
- ADR có status `Deprecated`/`Superseded` → KHÔNG xóa, link sang ADR mới

### Doc rot prevention
- Code change → check doc reference cùng commit
- Pre-commit hook (optional): grep changed file's symbol trong docs/
- Squash docs-only commit với feature commit cho atomic update

---

## 8. CHANGELOG.md

Mỗi release tag mới → entry trong CHANGELOG.md theo format Keep a Changelog:

```markdown
# Changelog

## [Unreleased]

## [1.2.0] - 2026-05-08
### Added
- Web Push notification (commit abc123)
- Sort 3 tầng VIP > Plus > Standard (commit def456)

### Changed
- "Tin đăng" → "Bài đăng" toàn UI

### Fixed
- Splash treo iPhone khi TokenStorage throw
- Click thumbnail post detail không đổi ảnh chính

### Security
- Rotate VAPID key

### Deprecated
- (nothing)

### Removed
- (nothing)
```

---

## 9. Memory vs Doc — boundary

| Memory (AI-only) | Doc (human + AI) |
|---|---|
| User preference / role | Business decision (ADR) |
| AI working style feedback | Architecture (CORE_FRAMEWORK) |
| Session resume trigger | Setup instruction (README) |
| External system reference | Vendor list (COMPLIANCE) |
| Lesson learned (nội bộ AI) | Postmortem (public) |

→ Nếu user team grow, memory cần move ra docs (multi-AI/multi-human visible).

---

## 10. Diagram & visuals

### Khi viết
- Architecture overview (PROJECT_BRIEFING + CORE_FRAMEWORK)
- Sequence diagram cho async flow phức tạp (auth, payment, push)
- ER diagram cho schema lớn (>10 table)

### Format
- Mermaid (text-based, render trong GitHub markdown) — preferred
- Excalidraw / draw.io — export PNG + commit source
- Tránh: Photoshop / proprietary format không re-edit được

### Vị trí
- Embed trong markdown qua mermaid block hoặc image link
- Source file: `docs/diagrams/<name>.{mmd,excalidraw}`

---

## 11. Anti-patterns

| Anti-pattern | Đúng |
|---|---|
| README dài 5000 dòng có mọi thứ | Split sang docs/ |
| ADR sửa trực tiếp khi đổi quyết định | Tạo ADR mới Superseded |
| Code comment 80% là explain WHAT | Default no comment, chỉ WHY |
| API change không bump version | Versioning policy strict |
| Doc lưu trên Notion/Confluence ngoài repo | Doc trong repo, version control với code |
| Postmortem private "không cho ai thấy" | Public trong repo, blameless |
