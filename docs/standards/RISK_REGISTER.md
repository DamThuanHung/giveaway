# Risk Register — Live Document

> ISO 31000 + PMBOK. Live document — review hàng tháng, update khi có
> risk mới phát hiện.

---

## 1. Risk taxonomy

### Probability scale
| Level | Định nghĩa | Tần suất ước tính |
|---|---|---|
| 1 | Rare | < 5% trong 1 năm |
| 2 | Unlikely | 5-25% |
| 3 | Possible | 25-50% |
| 4 | Likely | 50-75% |
| 5 | Almost certain | > 75% |

### Impact scale
| Level | Định nghĩa |
|---|---|
| 1 | Negligible — fix nhanh, ít user thấy |
| 2 | Minor — vài user phàn nàn, fix trong sprint |
| 3 | Moderate — feature core down, fix trong 24h |
| 4 | Major — data loss/leak, mất uy tín, fix khó |
| 5 | Catastrophic — compliance violation, lawsuit, business stop |

### Risk score
```
Score = Probability × Impact (1-25)
```

| Score | Color | Action |
|---|---|---|
| 1-4 | Green | Monitor, no action |
| 5-9 | Yellow | Mitigation plan trong quý |
| 10-15 | Orange | Mitigation plan trong sprint, weekly review |
| 16-25 | Red | Immediate action, daily review until reduced |

---

## 2. Risk template

```markdown
### R-NNN: <Tên risk ngắn>
- **Category:** Technical | Business | Security | Compliance | Vendor | People
- **Description:** Mô tả rủi ro, kịch bản xấu nhất
- **Probability:** 1-5 (lý do estimate)
- **Impact:** 1-5 (lý do estimate)
- **Score:** P×I
- **Owner:** Hoàng thượng / Thần / Vendor X
- **Status:** Open | Mitigating | Closed | Accepted
- **Mitigation plan:** Hành động cụ thể giảm probability hoặc impact
- **Trigger to revisit:** Điều kiện reopen
- **Date logged:** YYYY-MM-DD
- **Last review:** YYYY-MM-DD
```

---

## 3. Risk categories thường gặp

### Technical risks
- R-T01: Single point of failure (database, auth service)
- R-T02: Tech debt tích lũy → velocity giảm
- R-T03: Dependency major version bump break
- R-T04: Performance degradation khi scale 10x
- R-T05: Schema migration corrupt data

### Business risks
- R-B01: Tester crisis (closed testing < số yêu cầu)
- R-B02: Competitor launch tương tự
- R-B03: Pivot scope quá nhiều → confused product
- R-B04: Marketing budget cạn trước traction
- R-B05: User churn cao trước khi có revenue

### Security risks
- R-S01: Account takeover qua password reuse
- R-S02: Database breach (SQL injection, IDOR)
- R-S03: Secret leak (commit, log, exception)
- R-S04: DDoS / abuse signup spam
- R-S05: Insider threat (admin lạm quyền)

### Compliance risks
- R-C01: GDPR — không có DPA với processor
- R-C02: Right to erasure không implement đầy đủ
- R-C03: Cookie consent thiếu / sai
- R-C04: Cross-border data transfer không có SCC
- R-C05: Marketing email thiếu unsubscribe

### Vendor risks
- R-V01: Cloud provider price tăng đột ngột
- R-V02: Third-party API deprecated
- R-V03: Domain registrar problem
- R-V04: Payment gateway suspend account
- R-V05: SaaS tool đóng cửa

### People risks (solo+AI specific)
- R-P01: Hoàng thượng burn out → dự án dừng
- R-P02: Health issue → unavailable extended
- R-P03: Single-knowledge — chỉ hoàng thượng biết X
- R-P04: AI context loss giữa sessions
- R-P05: Lock-in vào 1 AI provider

---

## 4. Mitigation strategies

### 4 chiến lược chuẩn (PMBOK)

| Strategy | Khi dùng | Ví dụ |
|---|---|---|
| **Avoid** | Loại bỏ nguyên nhân | Không lưu password → không có risk leak password |
| **Mitigate** | Giảm probability hoặc impact | Backup 3-2-1 giảm impact data loss |
| **Transfer** | Chuyển sang bên khác | Insurance, SLA với vendor, managed service |
| **Accept** | Chấp nhận, có plan B | "Risk vendor X giảm budget — plan migrate sang Y trong 30 ngày" |

### Anti-pattern
- Mọi risk đều "mitigate" — tốn resource, không thực tế
- Accept mà không có plan B — chỉ là wishful thinking
- Risk register stale, không review → vô dụng

---

## 5. Review cadence

### Hàng tháng
- Đọc qua tất cả risk Open
- Update probability/impact dựa data thực tế
- Score risk mới phát hiện
- Close risk đã mitigated thành công

### Hàng quý
- Re-baseline taxonomy (có category mới không?)
- Review risk Closed — có resurface không?
- Stress test top 5 red risks (tabletop exercise)

### Trigger ad-hoc
- Sau mỗi incident production
- Sau mỗi pivot/scope change >20%
- Khi vendor công bố thay đổi (price, feature, policy)
- Khi compliance regulation mới

---

## 6. Risk register starter — 10 entries cho dự án MỚI

Mọi dự án nên có ít nhất 10 risk này được scored ngày đầu:

```
R-001: Single point of failure — primary database
R-002: Secret leak qua git commit
R-003: Backup chưa được test restore
R-004: Dependency CVE Critical chưa được patch
R-005: Auth không có rate limit/MFA
R-006: GDPR data subject rights chưa implement
R-007: Vendor lock-in (cloud/payment/auth)
R-008: Domain/cert expiration không có alert
R-009: Hoàng thượng burn out
R-010: AI session context loss giữa các tab/session
```

---

## 7. Template file

```markdown
# Risk Register — <Project Name>

Last full review: YYYY-MM-DD
Next scheduled review: YYYY-MM-DD

## Open risks

### R-001: <name>
- ...

### R-002: <name>
- ...

## Closed risks (archive)

### R-XXX: <name> [Closed YYYY-MM-DD]
- Why closed:
- What worked:
```

Lưu file: `docs/RISK_REGISTER.md` (live document, KHÔNG phải standards/).
