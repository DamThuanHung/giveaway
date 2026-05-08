# Standards — Enterprise-grade cho Solo+AI

> Bộ 10 file standards áp dụng chuẩn AWS Well-Architected + Google SRE +
> ThoughtWorks Tech Radar + Atlassian Team Playbook + Michael Nygard ADR.
> Tối ưu cho mô hình "1 hoàng thượng + 1 AI" — bỏ team coordination
> overhead, giữ industry standards thực chất.

---

## Cấu trúc

| File | Chuẩn ngành | Khi nào đọc |
|---|---|---|
| `INCEPTION_DECK.md` | Agile Inception (Jonathan Rasmusson) | Buổi 1 dự án mới |
| `ADR_TEMPLATE.md` + `adr/` | Architecture Decision Records (Michael Nygard) | Mỗi quyết định kiến trúc |
| `DEFINITION_OF_READY_DONE.md` | Scrum DoR/DoD | Trước mỗi feature/sprint |
| `SECURITY_BASELINE.md` | OWASP Top 10 + STRIDE | Trước viết auth/data handling |
| `OBSERVABILITY.md` | Google SRE 3 pillars + SLI/SLO | Trước deploy production |
| `DISASTER_RECOVERY.md` | AWS Well-Architected Reliability | Trước go-live |
| `RISK_REGISTER.md` | PMBOK + ISO 31000 | Live document, review hàng tháng |
| `COMPLIANCE.md` | GDPR + Privacy by Design (ISO 27701) | Trước collect user data |
| `INCIDENT_RUNBOOK.md` | Google SRE postmortem (blameless) | Mỗi sự cố production |
| `AI_WORKING_RULES.md` | Memory feedback gộp (Trao Tay 2026) | AI tự đọc mỗi session |
| `AI_COLLABORATION_RULES.md` | User-side AI playbook | User đọc khi prompt/review AI |
| `DOCUMENTATION_STANDARDS.md` | Keep a Changelog + OpenAPI + ADR | Trước viết doc/comment/README |
| `PERFORMANCE_AND_FINOPS.md` | Core Web Vitals + Google SRE + FinOps Foundation | Trước launch + monthly review |
| `API_DESIGN_GUIDELINES.md` | Microsoft REST + Stripe + GraphQL best practices | Trước thiết kế endpoint mới |
| `BRANCHING_RELEASE_STRATEGY.md` | Trunk-based / GitHub Flow / Git Flow + semver | Setup buổi 1 + mỗi release |
| `DB_MIGRATION_POLICY.md` | Forward-only + zero-downtime patterns | Mỗi schema change |
| `ACCESSIBILITY_BASELINE.md` | WCAG 2.1 AA + WAI-ARIA | Mọi UI mới |
| `I18N_STRATEGY.md` | ICU MessageFormat + Intl API + RTL | Trước viết string đầu tiên |
| `VENDOR_MANAGEMENT.md` | Build vs Buy + lock-in mitigation + exit strategy | Trước sign vendor mới + quarterly |
| `UPGRADE_ROADMAP.md` | 8 upgrade trigger-based để 95% → 99% solo+AI ceiling | Quarterly review + khi đạt metric trigger |

---

## Solo+AI mapping

| Vai trò chuẩn ngành | Solo+AI tương đương |
|---|---|
| Product Owner | Hoàng thượng |
| Tech Lead | Thần (AI) |
| Reviewer / QA | Thần tự review + tự test theo TEST_PROTOCOL |
| Approver / DACI Driver | Hoàng thượng |
| Stakeholder | Hoàng thượng (cuối cùng) |
| On-call / SRE | Hoàng thượng (vật lý) + thần (analyze logs) |

Khi standards yêu cầu "team approval" / "change advisory board" → diễn
giải thành "hoàng thượng phê chuẩn + thần ghi vào ADR".

---

## Cadence (định kỳ)

| Activity | Tần suất |
|---|---|
| Risk register review | Đầu mỗi tháng |
| Security baseline audit | Mỗi quý |
| DR drill (restore từ backup thật) | Mỗi 6 tháng |
| Incident postmortem | Trong 48h sau sự cố |
| ADR review (decisions còn relevant?) | Đầu năm |
| Definition of Done compliance audit | Mỗi sprint kết thúc |

---

## Khi qua dự án mới

```
[ ] Copy toàn bộ docs/standards/ sang repo mới
[ ] Đọc INCEPTION_DECK.md, trả lời 10 câu trong buổi 1
[ ] Tạo adr/0001-initial-stack.md ghi quyết định stack
[ ] Setup observability từ ngày đầu (không để sau)
[ ] Tạo RISK_REGISTER.md live, populate 5 risks đầu tiên
[ ] Tạo INCIDENT_RUNBOOK.md với contact info + escalation
```

KHÔNG đợi go-live mới làm — preventive cost rẻ hơn corrective 10-100 lần.
