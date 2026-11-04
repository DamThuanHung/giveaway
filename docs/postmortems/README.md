# Postmortems — Trao Tay

Index incidents + postmortems theo Google SRE blameless format.
Xem `docs/standards/INCIDENT_RUNBOOK.md` cho template chi tiết.

## Index

| Date | Title | Severity | MTTR | Action items closed |
|---|---|---|---|---|
| 2026-05-08 | [Web Push schema migration miss](2026-05-08-web-push-schema-miss.md) | SEV-2 | 5 phút (sau identify) | 4/7 |
| 2026-06-26 | [Threads vượt giới hạn 500 ký tự, đăng trùng FB/IG](2026-06-26-threads-caption-limit-duplicate-posts.md) | SEV-3 | ~20 phút (sau identify) | 5/5 |
| 2026-06-29 | [Mail báo cáo gửi nội dung cũ 3 ngày — quên deploy](2026-06-29-stale-mail-content-missing-deploy.md) | SEV-4 | ~10 phút (sau identify) | 3/3 |
| 2026-07-20 | [Ảnh quảng bá /dac-dinh dùng nhầm template marketplace, đăng lỗi 44 tiếng](2026-07-20-dac-dinh-marketing-broken-card-template.md) | SEV-4 | ~10 phút (sau identify) | 4/6 |
| 2026-09-21 | [MinIO CPU spike gây Cloudflare 522/525 Connection Timeout](2026-09-21-minio-cpu-spike-connection-timeout.md) | SEV-3 | ~12 phút (sau identify) | 1/4 |

## Stats

- Total postmortems: 5
- SEV-1: 0
- SEV-2: 1
- SEV-3: 2
- SEV-4: 2
- Average MTTR: ~11 phút
- Action items closure rate: 68% (17/25)

## Trends

(Cần ≥ 3 postmortem để analyze trend.)

## Cadence review

Mỗi quý:
- Đọc lại 5 postmortem gần nhất
- Pattern lặp lại không? → fix pattern, không patch lẻ
- Action item closure rate? Nếu < 80% → discipline issue
- MTTR trend? Improving?
- Sev distribution có đáng lo? (nhiều SEV-1 = systemic problem)
