# Performance Baseline & FinOps

> Universal. Measurable target từ ngày đầu — KHÔNG đợi sau khi user phàn nàn.
> Performance: Core Web Vitals + p95 API + mobile cold start.
> FinOps: cloud bill governance + budget alert + savings strategy.

---

## Phần 1: Performance Baseline

## 1.1 Web — Core Web Vitals

Google ranking factor + UX standard.

| Metric | Tốt | Cần cải thiện | Kém |
|---|---|---|---|
| **LCP** (Largest Contentful Paint) | ≤ 2.5s | 2.5-4s | > 4s |
| **INP** (Interaction to Next Paint) | ≤ 200ms | 200-500ms | > 500ms |
| **CLS** (Cumulative Layout Shift) | ≤ 0.1 | 0.1-0.25 | > 0.25 |
| **FCP** (First Contentful Paint) | ≤ 1.8s | 1.8-3s | > 3s |
| **TTFB** (Time to First Byte) | ≤ 800ms | 800-1800ms | > 1800ms |

### Target tier
| Tier | Target |
|---|---|
| Tier 1 (consumer-facing landing) | All metrics "Tốt" cho 75% session |
| Tier 2 (app dashboard) | All metrics "Tốt" cho 50% session |
| Tier 3 (admin/internal) | All metrics "Cần cải thiện" hoặc tốt hơn |

### Tools
- Lighthouse CI (CI gate)
- PageSpeed Insights (manual check)
- Web Vitals Chrome extension
- RUM: web-vitals npm package + ship metric về analytics

---

## 1.2 API — Latency budget

| Endpoint type | p50 | p95 | p99 |
|---|---|---|---|
| Read simple (GET single record) | ≤ 50ms | ≤ 200ms | ≤ 500ms |
| Read complex (list + filter) | ≤ 100ms | ≤ 500ms | ≤ 1s |
| Write simple (POST/PUT) | ≤ 100ms | ≤ 500ms | ≤ 1s |
| Write complex (transaction) | ≤ 300ms | ≤ 1s | ≤ 2s |
| Search full-text | ≤ 200ms | ≤ 800ms | ≤ 2s |

### Action khi vượt budget
- p95 vượt > 1 tuần → optimize (add index, cache, query pattern)
- p99 vượt liên tục → investigate (lock, slow query, network)
- p99 > 2x p95 → tail latency issue (gc, lock contention)

---

## 1.3 Mobile — App startup

### Cold start (clean launch sau force-quit)
| Tier | Target |
|---|---|
| Best-in-class | < 1.5s |
| Acceptable | 1.5 - 3s |
| Cần cải thiện | 3 - 5s |
| Bad | > 5s |

### Warm start (resume từ background)
| Target | < 500ms |

### Reasons hay làm cold start chậm
- Init quá nhiều thứ trong main()/AppDelegate
- Load data từ disk synchronous trên UI thread
- Network call block first frame
- Token storage throw không catch (xem Trao Tay incident 2026-05-07)
- Multidex / large APK / unoptimized images

### Mitigation
- Defer init non-critical sau first frame
- Async load với placeholder
- Lazy import lib không cần ngay
- App Bundle (Android) split theo ABI/DPI

---

## 1.4 Database — Query performance

### Target
| Query type | Target |
|---|---|
| Index lookup (PK, unique) | < 5ms |
| Index range scan | < 50ms |
| Aggregation (COUNT/SUM với index) | < 100ms |
| Full table scan | **CẤM** trong production query |

### Detection
- `pg_stat_statements` (Postgres) → top 20 slow query
- EXPLAIN ANALYZE mỗi query mới trước khi merge
- Alert: query > 1s trong production

### Mitigation
- Index missing → add index
- N+1 → batch query / DataLoader
- OFFSET lớn → cursor-based pagination
- Lock contention → tách read/write replica

---

## 1.5 Performance budget — CI gate

### Web
```yaml
# .github/workflows/lighthouse.yml
- run: lhci autorun
  env:
    LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_TOKEN }}
# Fail PR nếu LCP > 2.5s, CLS > 0.1, etc.
```

### Mobile
- Android: APK size budget (vd < 30MB)
- iOS: IPA size budget (vd < 50MB)
- Cold start measure trên CI device farm (Firebase Test Lab)

### API
- Load test với k6/Artillery trước release lớn
- Fail nếu p95 > target trong 5 phút sustained

---

## 1.6 Optimization checklist (theo thứ tự ROI)

### High ROI (làm trước)
- [ ] Image optimization: webp + lazy load + size attr
- [ ] Bundle size: tree-shake + code-split route-based
- [ ] CDN cache static assets (CSS/JS/img) — TTL 1 năm với hash filename
- [ ] HTTP/2 + Brotli compression
- [ ] Database index cho top 10 query
- [ ] N+1 → batch

### Medium ROI
- [ ] Server-side rendering / static generation cho landing
- [ ] Service worker cache offline-first
- [ ] Image CDN (Cloudinary, ImageKit) thay tự host
- [ ] Connection pool DB tunining
- [ ] Read replica DB

### Low ROI (chỉ khi đã exhaust trên)
- [ ] Edge functions / CDN compute
- [ ] Custom-tuned GC settings
- [ ] HTTP/3 QUIC
- [ ] WebAssembly cho hot path

---

## Phần 2: FinOps — Cloud cost governance

## 2.1 Budget structure

### Tier theo stage
| Stage | Monthly budget | Hard cap |
|---|---|---|
| MVP (pre-revenue) | $0 - $50 | $100 |
| Beta (early users) | $50 - $200 | $500 |
| GA early (< 10k MAU) | $200 - $1000 | $2000 |
| Scale (> 10k MAU) | Tùy unit economics | Set theo runway |

Solo+AI startup: **luôn có hard cap** để tránh runaway bill.

### Budget alert
- 50% budget reached → email warning
- 80% budget reached → email + investigate
- 100% reached → page (treat as P1) + emergency cost cut

---

## 2.2 Cost monitoring tools

### Cloud-specific
| Cloud | Tool |
|---|---|
| AWS | Cost Explorer + Budgets + Anomaly Detection |
| GCP | Billing reports + Budget alerts |
| Azure | Cost Management + Budgets |
| Cloudflare | Analytics + spend dashboard |
| Vercel/Netlify | Usage dashboard |

### Multi-cloud aggregator
- Infracost (IaC cost preview)
- CloudHealth / Spot.io / Vantage (paid, cho team)

### Setup BẮT BUỘC
- [ ] Budget alert email (50/80/100%)
- [ ] Anomaly detection ML (AWS có sẵn)
- [ ] Tag every resource: project / environment / owner
- [ ] Monthly review: top 10 expensive services

---

## 2.3 Cost categories — biết rõ tiền đi đâu

### Compute (~30-50% bill thường)
- EC2 / Compute Engine / VM
- Lambda / Cloud Functions
- ECS / GKE / AKS

**Optimization:**
- Right-sizing (CPU/RAM thực sự dùng)
- Auto-scale + spot instance
- Reserved Instance / Savings Plan (1y commit -30%, 3y -50%)
- Serverless cho workload spiky

### Storage (~10-20%)
- S3 / GCS / Azure Blob
- EBS / Persistent Disk
- CDN cache

**Optimization:**
- Lifecycle policy: hot → warm → cold → archive
- Image compression + format (webp/avif)
- Delete old logs/backup theo retention
- CDN cache aggressive cho static

### Network (~10-30%, hay leak)
- Egress (out of cloud) — đắt nhất
- Inter-AZ / inter-region
- Load balancer hours

**Optimization:**
- Egress tới end-user qua CDN (Cloudflare miễn phí)
- Same-AZ communication
- VPC endpoint thay public internet

### Database (~10-20%)
- RDS / managed Postgres
- Aurora Serverless
- DynamoDB / Firestore

**Optimization:**
- Right-size instance
- Reserved Instance
- Read replica chỉ khi thực sự cần
- DynamoDB on-demand vs provisioned theo pattern

### AI/ML (mới, có thể spike)
- OpenAI / Anthropic / Gemini API
- GPU hours cho training
- Vector DB (Pinecone, Weaviate)

**Optimization:**
- Cache LLM response cho prompt giống nhau
- Fine-tune nhỏ thay vì always large model
- Batch API thay vì sync khi không cần realtime
- Set token budget per request

---

## 2.4 Anti-patterns FinOps

| Anti-pattern | Hậu quả |
|---|---|
| Không tag resource | Không biết tiền đi đâu khi audit |
| Không budget alert | Bill shock cuối tháng |
| Default instance size | Over-provisioned 2-10x |
| Public S3 bucket cho asset (egress đắt) | Bill leak qua user/bot |
| Test data trên production tier | Tốn tiền không cần |
| Quên xóa resource POC/test | Resource zombie tốn tiền vĩnh viễn |
| Không Reserved Instance khi load stable | Trả full price 2-3x giá RI |
| Cron job mỗi phút khi 1 lần/giờ đủ | 60x cost vô ích |
| Log/metric retention vô hạn | Tốn dài hạn |

---

## 2.5 FinOps practices

### Daily
- Check anomaly alert dashboard

### Weekly
- Review top 10 services, có resource zombie không?
- Check budget vs actual

### Monthly
- Right-sizing review
- Reserved Instance / Savings Plan analysis
- Compare vs last month, anomaly?

### Quarterly
- Vendor consolidation (giảm SaaS overlap)
- Negotiate enterprise discount nếu volume đủ
- Architecture review: có optimize được không?

---

## 2.6 AI cost specific

AI usage scale theo user → có thể thành cost lớn nhất.

### Budget per feature
- Free tier user: limit token/day (vd 5000 tokens)
- Paid tier: pass-through cost + margin
- Internal/admin: unlimited nhưng audit log

### Optimization
- **Cache aggressively**: same prompt + same context → cache 24h
- **Smaller model first**: thử Haiku/GPT-4o-mini trước, escalate Opus/GPT-4 nếu fail
- **Prompt caching** (Anthropic): system prompt cache 90%+
- **Batch API** (50% giảm cho non-realtime)
- **Streaming**: user thấy tiến độ → giảm timeout perceived
- **Truncate context**: chỉ send relevant chunk, không full history

### Monitoring
- Daily token spend per feature
- Cost per active user
- Cache hit rate
- Latency (slow = cost spike)

---

## 2.7 Cost-aware design

### Khi thiết kế feature mới, hỏi 5 câu
1. Cost per request là bao nhiêu (compute + storage + AI)?
2. Có scale theo user không? (linear / sub-linear / spike)
3. Có cache được không?
4. Có sync vs async option không (async cheaper)?
5. Free tier có thể limit gì để bảo vệ cost?

### Kill switch
Mỗi feature scale-sensitive cần feature flag:
- Off: feature disabled toàn cầu
- Throttle: rate limit tăng
- Quota: cap per user

Khi cost spike → flip switch ngay, không đợi fix code.

---

## 3. Performance + FinOps integration

### Trade-off thường gặp
| Performance up | Cost up? |
|---|---|
| Cache aggressively | Cost down (đỡ recompute) |
| Read replica | Cost up (nhân instance) |
| CDN edge | Cost down (đỡ origin egress) |
| Bigger instance | Cost up |
| Optimize query | Cost down (đỡ DB scaling) |
| Parallelism / concurrency | Cost up (nhân throughput) |

→ Optimization tốt = win cả Performance + FinOps. Optimization tệ = trade một thứ lấy thứ kia.

### Quy tắc thứ tự
1. Đo trước (don't optimize without metric)
2. Fix algorithm/architecture trước (free win)
3. Cache trước khi scale up
4. Reserved/Savings Plan khi pattern đã ổn định
5. Multi-region/multi-cloud chỉ khi có business case rõ

---

## 4. Setup checklist — Day 1 dự án mới

```
[ ] Lighthouse CI configured trong repo (.github/workflows/lighthouse.yml)
[ ] Performance budget set trong lighthouserc.json
[ ] Cloud cost budget alert (50/80/100%)
[ ] Resource tagging policy (project/env/owner)
[ ] Anomaly detection ML enabled
[ ] AI API spend dashboard (nếu dùng LLM)
[ ] Feature flag system (LaunchDarkly / GrowthBook / Unleash)
[ ] Kill switch process documented
[ ] Right-sizing review scheduled (monthly)
[ ] Reserved Instance review scheduled (sau 3 tháng stable)
```
