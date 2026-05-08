# Postmortems — Trao Tay

Index incidents + postmortems theo Google SRE blameless format.
Xem `docs/standards/INCIDENT_RUNBOOK.md` cho template chi tiết.

## Index

| Date | Title | Severity | MTTR | Action items closed |
|---|---|---|---|---|
| 2026-05-08 | [Web Push schema migration miss](2026-05-08-web-push-schema-miss.md) | SEV-2 | 5 phút (sau identify) | 4/7 |

## Stats

- Total postmortems: 1
- SEV-1: 0
- SEV-2: 1
- Average MTTR: 5 phút
- Action items closure rate: 57% (4/7)

## Trends

(Cần ≥ 3 postmortem để analyze trend.)

## Cadence review

Mỗi quý:
- Đọc lại 5 postmortem gần nhất
- Pattern lặp lại không? → fix pattern, không patch lẻ
- Action item closure rate? Nếu < 80% → discipline issue
- MTTR trend? Improving?
- Sev distribution có đáng lo? (nhiều SEV-1 = systemic problem)
