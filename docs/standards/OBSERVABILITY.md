# Observability — 3 Pillars + SLI/SLO

> Google SRE standard: Logs, Metrics, Traces.
> SLI (indicator) → SLO (objective) → SLA (agreement).
> Setup từ ngày đầu, KHÔNG để sau.

---

## 1. Three Pillars

### 1.1 Logs (events)
**Mục đích**: trace 1 request cụ thể, debug bug rare.

Required:
- Structured (JSON), không free-text
- Correlation ID (trace_id) trong mỗi log line
- Severity: DEBUG / INFO / WARN / ERROR / FATAL
- Centralized: ship lên log aggregator (CloudWatch / Loki / ELK / Datadog)
- Retention: 30-90 ngày tùy compliance

CẤM:
- Log password, token, secret (kể cả mã hóa)
- Log toàn bộ request body với PII
- Log user-controlled string mà không escape (log injection)

### 1.2 Metrics (aggregated numbers over time)
**Mục đích**: alert + dashboard + capacity planning.

Required:
- RED: **R**ate (req/s), **E**rrors (%), **D**uration (p50/p95/p99)
- USE (cho infrastructure): **U**tilization, **S**aturation, **E**rrors
- Business metrics: signup/day, MAU, conversion rate, ...

Stack: Prometheus + Grafana, hoặc CloudWatch, hoặc Datadog.

### 1.3 Traces (distributed)
**Mục đích**: hiểu latency root cause khi request đi qua nhiều service.

Required khi:
- Microservice >2 service
- Có async pipeline (queue, job)
- Latency p99 thường xuyên > target

Stack: OpenTelemetry SDK + Jaeger/Tempo/Zipkin/Honeycomb.

Solo monolith: có thể skip ban đầu, add khi cần.

---

## 2. SLI — Service Level Indicators

Đo lường gì? 3 nhóm chính:

### 2.1 Availability
```
SLI = (số request thành công) / (tổng số request)
```
- "Thành công" = HTTP 2xx/3xx (không tính 4xx do client lỗi)

### 2.2 Latency
```
SLI = p95/p99 latency request (ms)
```

### 2.3 Quality (correctness)
```
SLI = (số response đúng dữ liệu) / (tổng số response)
```
- Đo qua synthetic test hoặc canary check

### 2.4 Custom business SLI
- Time to first byte
- Search result relevance
- Push notification delivery rate

---

## 3. SLO — Service Level Objectives

Target cụ thể cho SLI, theo loại service:

### Tier 1 (critical, user-facing)
- Availability: 99.9% (=43 phút downtime/tháng)
- Latency p95: < 500ms
- Latency p99: < 2s

### Tier 2 (important, internal)
- Availability: 99.5%
- Latency p95: < 1s

### Tier 3 (best effort, batch job)
- Availability: 99%
- Latency p95: không cứng

**SLO ≠ 100%**. 100% SLO = không thể deploy/maintenance. Bù bằng "error budget":

```
Error budget = (1 - SLO) × thời gian
99.9% SLO/tháng → 43 phút/tháng có thể down
```

Chính sách:
- Còn budget: ship feature aggressive
- Hết budget: freeze feature, focus reliability

---

## 4. SLA — Service Level Agreement

SLA = SLO + commitment với customer + penalty.

Solo+AI thường KHÔNG ký SLA với external customer (chưa B2B). Nhưng nên có "internal SLA" tự cam kết:
- Critical bug: fix trong 24h
- Down toàn hệ thống: notify user trong 30 phút (status page)

---

## 5. Alert strategy

### Symptom-based, không cause-based
- Cause-based: "CPU > 80%" → có thể không impact user
- Symptom-based: "p99 latency > 2s" → user thực sự đau

### Severity tier
| Severity | Phản ứng | Ví dụ |
|---|---|---|
| P1 | Page immediately (dù 3am) | Site down, payment fail >5% |
| P2 | Page giờ làm việc | Latency spike, error rate 1-5% |
| P3 | Email, fix trong sprint | Slow query, disk 80% |
| P4 | Dashboard, no page | Info pattern |

### Anti-pattern
- Quá nhiều P1 alert → alert fatigue → ignore real issue
- P1 fire 1 lần/tuần → tinh chỉnh threshold
- Alert không có runbook → tốn thời gian mỗi lần fire

---

## 6. Dashboard

### Mỗi service phải có
1. **Overview dashboard**: RED metrics tổng thể, availability, error budget
2. **Drill-down dashboard**: by endpoint, by user segment, by region
3. **Business dashboard**: signup, MAU, revenue (cho hoàng thượng)

### Tool
- Grafana (open source, mọi backend)
- CloudWatch Dashboards (AWS native)
- Datadog (paid, all-in-one)

---

## 7. Logging best practices

### Structured log
```json
{
  "timestamp": "2026-05-08T03:15:45Z",
  "level": "INFO",
  "service": "backend",
  "trace_id": "abc123",
  "user_id": "u_456",
  "event": "user.signup.success",
  "duration_ms": 230,
  "metadata": { "method": "email" }
}
```

### Anti-pattern log
```
2026-05-08 ERROR Something failed
[Sat May 8] crash :( see attached
```

### Sampling
- Volume cao? → sample DEBUG/INFO (vd 10%)
- WARN/ERROR luôn 100%
- Sampling phải có trace_id để recover full request khi cần

---

## 8. Setup checklist (ngày đầu)

```
[ ] Structured logger (Pino/Winston/zap/structlog)
[ ] Correlation ID middleware (request → response)
[ ] Health endpoint (/health) trả 200 + uptime
[ ] Ready endpoint (/ready) check DB/cache/dependencies
[ ] Error tracking (Sentry/Rollbar/Bugsnag) free tier
[ ] Uptime monitor external (UptimeRobot/Pingdom) 5 phút interval
[ ] CloudWatch/Loki nhận log ship
[ ] Dashboard "RED + business metrics" Day-1
[ ] Alert P1: site down, error >5%, latency p99 > 5s
[ ] Runbook cho mỗi alert (link từ alert message)
```

KHÔNG đợi production launch mới setup — observability tích lũy data, càng sớm càng có baseline.

---

## 9. Privacy in observability

- KHÔNG log PII (email, phone, password, payment)
- Log ID tham chiếu (user_id) thay vì email
- Hash/redact PII nếu phải log để debug
- Compliance scope: log retention <90 ngày trừ khi có legal hold
- Right to erasure (GDPR): có quy trình xóa log liên quan user khi yêu cầu

---

## 10. Cost monitoring

Observability tốn tiền — log + metric + trace volume cao. Phải có:
- Budget alert (cloud bill > $X/month → email)
- Sampling chiến lược cho service volume cao
- Log retention rotation (S3 lifecycle, CloudWatch retention)
- Trace sampling 1-10% (không trace 100%)
