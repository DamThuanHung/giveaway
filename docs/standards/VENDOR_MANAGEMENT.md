# Vendor Management

> Universal. Build vs Buy decision + SLA tracking + lock-in mitigation +
> exit strategy + cost governance theo vendor.

---

## 1. Vendor inventory — Single source of truth

`docs/vendors.md` (live document) liệt kê mọi vendor:

```markdown
| Vendor | Service | Tier/Plan | Cost/month | Contract | Renewal | Owner | Critical? |
|---|---|---|---|---|---|---|---|
| AWS | Compute, storage | t3.micro | $20 | Pay-as-go | — | hoàng thượng | Yes (Tier 1) |
| Cloudflare | CDN, DNS | Free | $0 | — | — | hoàng thượng | Yes (Tier 1) |
| Resend | Email | Free 100/d | $0 | — | — | hoàng thượng | Yes (Tier 2) |
| PayOS | Payment | Pay-per-tx 1% | Variable | Annual | 2027-Q1 | hoàng thượng | Yes (Tier 1) |
| Firebase | Push notify | Free Spark | $0 | — | — | hoàng thượng | Yes (Tier 1) |
| MinIO | Object storage | Self-host | $0 (compute) | — | — | hoàng thượng | Yes (Tier 1) |
| Backblaze B2 | Backup offsite | Pay-per-GB | $5 | Pay-as-go | — | hoàng thượng | Yes (Tier 2) |
| Google Play Console | App store | One-time $25 | — | — | — | hoàng thượng | Yes |
| TenTen | Domain registrar | Annual | $1/m | Annual | 2027-04 | hoàng thượng | Yes |
```

---

## 2. Vendor tier — criticality

| Tier | Định nghĩa | Down impact |
|---|---|---|
| **Tier 1** | Critical, single-supplier | Service down hoàn toàn |
| **Tier 2** | Important, có alternative | Feature degraded |
| **Tier 3** | Nice-to-have | Inconvenience nhỏ |

Mỗi Tier 1 vendor phải có:
- DPA ký (xem `COMPLIANCE.md`)
- SLA understood
- Exit strategy documented
- Backup contact info ở 2 nơi (password manager + email)

---

## 3. Build vs Buy decision

### Buy khi
- Commodity (auth, payment, email, push)
- Faster time-to-market value > customization need
- Có vendor SLA tốt, security audit done
- Cost < 1 dev-month tự làm

### Build khi
- Core differentiation (AI matching algorithm cho marketplace)
- Vendor cost > tự host significantly khi scale
- Compliance yêu cầu data on-premises
- Customization deep, vendor không support

### Hybrid (recommended cho startup)
- Buy ban đầu (MVP, beta) — fast
- Audit sau 6-12 tháng — có pain point lock-in?
- Migrate critical thành self-host khi:
  - Vendor cost > $X/month
  - Lock-in risk cao
  - Performance bottleneck
  - Compliance gap

### Decision template (ADR)
```markdown
## Build vs Buy: <feature>

### Context
- Vendor option: A, B, C
- Self-host option: tech X
- Constraints: budget $Y, timeline Z

### Cost analysis
| Option | Setup | Monthly | Migration cost (year 2) |
|---|---|---|---|
| Vendor A | $0 | $50 | $5000 |
| Self-host | $2000 (1 week dev) | $20 | $0 |

### Decision: Buy A (now), reassess Q4
### Rationale
- Time-to-market > $50/m save
- Vendor SLA 99.9%
- Migration plan documented
```

---

## 4. SLA tracking

### What to track
- **Uptime**: vendor công bố vs thực tế đo qua synthetic monitor
- **Support response time**: SLA tier có khớp ticket history?
- **Incident communication**: status page có cập nhật kịp?
- **Performance**: API latency trend

### Tool
- Status page aggregator: StatusGator, IsItDownRightNow
- Synthetic monitor: UptimeRobot, Pingdom, Better Uptime
- Self-built: ping endpoint vendor mỗi 5 phút, log

### When SLA breached
- Document incident (status page screenshot, ticket #)
- Claim credit theo SLA terms
- Nếu lặp lại → reconsider vendor choice

---

## 5. Lock-in risk

### Indicator high lock-in
- Proprietary data format (không export ra standard)
- API không có open spec (custom auth, custom protocol)
- Pricing model thay đổi đột ngột
- Migration tool không có
- Vendor là single supplier loại đó (vd VPN provider niche)

### Indicator low lock-in
- Open standard (S3-compatible API, OAuth 2.0, OpenID, SMTP)
- Data export sang format chuẩn (JSON, CSV, SQL dump)
- Multi-vendor compatible (vd mọi cloud có same DB engine)

### Lock-in mitigation
- Abstraction layer: tự viết wrapper, swap vendor → swap implementation
- Standard protocol: prefer S3 API thay vì proprietary blob
- Periodic export: backup data ra format portable đều đặn
- POC với alternative vendor mỗi năm (eat your own dogfood)

---

## 6. Exit strategy template

Mỗi Tier 1 vendor cần exit plan documented:

```markdown
## Exit plan: <vendor>

### Trigger conditions
- Vendor giá tăng > 50%
- SLA breach > 3 tháng liên tiếp
- Vendor sunset service
- Compliance gap mới
- Better alternative xuất hiện

### Migration steps
1. Setup alternative (vendor B hoặc self-host)
2. Dual-write: data ghi cả 2 nơi 30 ngày
3. Verify data consistency
4. Switch read sang B
5. Stop write sang A
6. Cancel A subscription

### Time estimate
- Total: 30-60 ngày
- Critical path: dual-write setup (1 tuần)

### Risk
- Data drift trong dual-write phase
- Bug khi switch (rollback plan: switch back read)

### Cost
- Migration time: ~40h dev
- Parallel running: $50/m × 1 tháng
```

---

## 7. Cost governance per vendor

### Track
- Monthly spend per vendor
- Cost per active user (CAU) cho mỗi vendor
- YoY trend (alert nếu growth > MAU growth)

### Optimize
- **Rightsize**: vendor offer multiple tier, đang dùng đúng không?
- **Reserved/Commit**: discount cho 1y/3y commit (AWS RI, GCP CUD)
- **Volume discount**: negotiate khi cross threshold
- **Free tier maximization**: structure usage để stay trong free tier (multiple account, batching)

### Anti-pattern
- Vendor zombie: subscription quên cancel
- Over-provisioning: dùng tier cao hơn mức cần
- Multiple SaaS overlap: 3 tool monitoring làm cùng việc

---

## 8. Vendor onboarding checklist

Khi sign up vendor mới:

```
[ ] Privacy policy + DPA reviewed
[ ] Cross-border data transfer (GDPR)
[ ] Pricing model understood (free → pay tier transition)
[ ] Free tier limit
[ ] Hard cap budget alert setup
[ ] API rate limit
[ ] Status page subscribed
[ ] Support tier + escalation path
[ ] Credentials stored in password manager
[ ] 2FA enabled cho dashboard
[ ] Backup contact / shared account (nếu cần)
[ ] Exit plan drafted
[ ] Added to vendors.md inventory
```

---

## 9. Vendor offboarding checklist

Khi cancel vendor:

```
[ ] Data export saved (full)
[ ] Data deletion request submit (GDPR right to erasure)
[ ] Subscription cancel confirmed (screenshot/email)
[ ] DNS records remove (nếu có)
[ ] API key revoke
[ ] Backup contact remove
[ ] Update vendors.md (move to "Past vendors" section)
[ ] Cost monitoring stopped
[ ] Postmortem nếu offboard do incident: retro
```

---

## 10. Vendor red flags

### Pre-signup
- Privacy policy mơ hồ về data usage
- Pricing tăng đột ngột tin tức gần đây
- Không có DPA available
- Status page không có lịch sử (mới setup hoặc che dấu incident)
- Customer review âm tính lặp lại
- Funding/business viability nghi vấn

### During usage
- Support response time > SLA
- Sudden feature deprecation < 30 ngày warning
- Pricing email "unfortunately we need to..."
- API breaking change không backward compat
- Security incident từ vendor (phishing, breach)
- Vendor acquired bởi competitor lớn hơn

→ Khi gặp red flag, accelerate exit plan.

---

## 11. Free tier strategy

### Maximize free tier
- Đếm exact limit (req/month, GB storage, user count)
- Tracker dashboard riêng cho mỗi vendor
- Alert khi dùng > 80% free tier
- Plan migrate sang paid OR alternative khi sắp cap

### Free tier graduation
| Stage | Approach |
|---|---|
| MVP | Free tier mọi thứ (chấp nhận limit) |
| Beta | Free + occasional pay-as-go cho spike |
| GA early | Paid plan khi traffic stable cao |
| Scale | Negotiate custom plan, reserved instance |

### Khi paid plan unavoidable
- Compare 3 vendor + spreadsheet TCO 12 tháng
- Negotiate annual prepay discount (~10-20%)
- Lock price 1-2 năm tránh tăng

---

## 12. Compliance per vendor

Tham chiếu `COMPLIANCE.md` §7 vendor list.

Mỗi processor (vendor xử lý PII) cần:
- DPA ký
- SCC (Standard Contractual Clauses) nếu cross-border
- Sub-processor list disclosed
- Audit right (vendor cho phép audit định kỳ?)
- Breach notification timeline (vendor commit báo trong bao lâu?)

---

## 13. Anti-patterns

| Anti-pattern | Đúng |
|---|---|
| Mọi credential trong head 1 người | Password manager + backup ở 2 nơi |
| Không tracking spend per vendor | Monthly review |
| Lock-in cho convenience ngắn hạn | Abstraction + portable format |
| Sign 3 năm contract khi pricing đang giảm | Annual hoặc month-to-month |
| Không có exit plan Tier 1 | Document trước khi sign |
| Vendor zombie subscription | Audit quarterly |
| Buy mỗi tool có promo email | Cost-per-value analysis |
| Build cái commodity (auth, email) thay vì buy | Buy + focus core diff |

---

## 14. Setup checklist

```
[ ] vendors.md inventory created
[ ] All Tier 1 vendor: DPA + exit plan
[ ] All Tier 1 vendor: 2FA + backup contact
[ ] Status page aggregator setup (StatusGator)
[ ] Synthetic monitor cho mỗi Tier 1 endpoint
[ ] Cost dashboard per vendor
[ ] Budget alert per vendor (50/80/100%)
[ ] Quarterly vendor review scheduled
[ ] Annual: build vs buy reassess Tier 1
```
