# Compliance — GDPR + Privacy by Design

> GDPR (EU) + ISO 27701 + Privacy by Design (Ann Cavoukian).
> Mặc dù dự án Việt Nam, GDPR baseline vẫn nên áp dụng vì:
> 1. Có user EU (rất ít cũng phải tuân)
> 2. Bảo vệ user là đạo đức không phụ thuộc địa lý
> 3. Nghị định 13/2023/NĐ-CP của VN (luật bảo vệ dữ liệu cá nhân) tương đồng GDPR

---

## 1. Định nghĩa cơ bản

| Thuật ngữ | Định nghĩa |
|---|---|
| Personal Data | Data identify được cá nhân: tên, email, SĐT, IP, device ID, behavioral data |
| PII | Personally Identifiable Information — subset của personal data |
| Sensitive Data | Health, religion, sexuality, political view, biometric, financial |
| Data Subject | Người mà data nói về (= user) |
| Controller | Quyết định mục đích xử lý (= dự án/công ty) |
| Processor | Xử lý hộ Controller (= vendor như Resend, Firebase, AWS) |
| DPA | Data Processing Agreement — hợp đồng giữa Controller và Processor |

---

## 2. Lawful basis — KHÔNG được collect data nếu thiếu basis

GDPR Article 6 — 1 trong 6 cơ sở pháp lý:

1. **Consent** — user đồng ý explicit (opt-in, không pre-checked)
2. **Contract** — cần để thực hiện hợp đồng với user (vd: shipping address)
3. **Legal obligation** — luật yêu cầu (vd: tax record)
4. **Vital interests** — bảo vệ tính mạng
5. **Public interest** — vì lợi ích công cộng
6. **Legitimate interest** — có lợi ích chính đáng + không ghi đè quyền user (cần balance test)

Mọi data collection phải map về 1 basis. Document ở `docs/data-inventory.md`.

---

## 3. Data subject rights — bắt buộc implement

### 3.1 Right to access (Art. 15)
- User request → trả full data về user trong 30 ngày
- Format: machine-readable (JSON/CSV)
- API: `GET /me/data-export` (hoặc tương đương)

### 3.2 Right to rectification (Art. 16)
- User sửa data sai về mình
- API: profile edit

### 3.3 Right to erasure / "right to be forgotten" (Art. 17)
- User request xóa account
- BẮT BUỘC: hard delete trong 30 ngày, không soft delete vĩnh viễn
- Cascade: xóa data liên quan (post, comment, file upload)
- Exception: data cần giữ vì legal obligation (tax record giữ 5-10 năm)
- Backup: data vẫn ở trong backup tới khi backup expire — document rõ điều này

### 3.4 Right to data portability (Art. 20)
- User export data sang format chuẩn (JSON)
- Bao gồm data user provide + data sinh từ activity của user

### 3.5 Right to object (Art. 21)
- User opt-out khỏi marketing, profiling
- Mỗi email marketing PHẢI có unsubscribe link

### 3.6 Right to not be subject to automated decision (Art. 22)
- Nếu có automated decision (vd auto-ban user) → user có quyền request human review

---

## 4. Privacy by Design — 7 principles

1. **Proactive not Reactive** — privacy ngay từ thiết kế, không patch sau
2. **Privacy as Default** — config mặc định bảo vệ tối đa, user phải opt-in nới lỏng
3. **Privacy Embedded** — không "bolt-on" — tích hợp sâu
4. **Full Functionality** — privacy + functionality, không phải zero-sum
5. **End-to-End Security** — bảo vệ toàn vòng đời data (collect → store → process → delete)
6. **Visibility & Transparency** — user biết data của họ được dùng thế nào
7. **Respect for User Privacy** — user-centric, không paternalistic

---

## 5. Data inventory — bắt buộc maintain

`docs/data-inventory.md` liệt kê mọi loại data thu thập:

| Field | Personal? | Sensitive? | Lawful basis | Storage | Retention | Encrypted? |
|---|---|---|---|---|---|---|
| email | Yes | No | Contract | Postgres | Vĩnh viễn (đến khi user delete) | At rest (DB) |
| password | Yes | No | Contract | Postgres | — | bcrypt hash |
| ip_address | Yes | No | Legitimate interest (security) | Logs | 90 days | At rest |
| location_gps | Yes | No | Consent | Postgres | Vĩnh viễn | At rest |
| ... | | | | | | |

Update mỗi khi schema thay đổi.

---

## 6. Cookie consent

### Required nếu site có user EU
- Banner consent BEFORE set non-essential cookie
- Granular control: necessary / functional / analytics / marketing
- "Reject all" dễ như "Accept all" (không dark pattern)
- Save preference, không hỏi lại mỗi page

### Cookie phân loại
| Type | Consent? | Ví dụ |
|---|---|---|
| Strictly necessary | Không (auto-allowed) | Session ID, CSRF token |
| Functional | Optional | Theme, language |
| Analytics | Yes | Google Analytics, Mixpanel |
| Marketing | Yes | Facebook Pixel, ad tracking |

---

## 7. Vendor compliance — DPA bắt buộc

Mọi vendor xử lý personal data phải có DPA ký:

### Vendor list mẫu
| Vendor | Purpose | DPA URL/file |
|---|---|---|
| AWS | Hosting, storage | https://aws.amazon.com/compliance/data-protection-faq/ |
| Resend | Email transactional | https://resend.com/legal/dpa |
| Firebase | Push notification | https://firebase.google.com/terms/data-processing-terms |
| MinIO (self-hosted) | Storage | N/A — self-hosted |
| PayOS | Payment | DPA tự ký với PayOS |

### Cross-border transfer
Nếu vendor host ngoài EU → cần Standard Contractual Clauses (SCC) hoặc Adequacy Decision.

---

## 8. Privacy policy — bắt buộc public

Sections cần có:
1. Controller info (tên, địa chỉ liên hệ)
2. Data collected (link `data-inventory.md`)
3. Lawful basis cho mỗi loại
4. Retention period
5. Recipients (vendor list)
6. Cross-border transfer info
7. Data subject rights (§3) + cách exercise
8. Cookie policy
9. Changes notification
10. Contact DPO (nếu có)

---

## 9. Breach notification

### Timeline GDPR
- Phát hiện breach → notify supervisory authority trong **72h**
- Notify affected user "without undue delay" nếu high risk

### Process
1. Identify scope (data nào, bao nhiêu user)
2. Containment (xem `INCIDENT_RUNBOOK.md`)
3. Document: timeline, cause, scope, mitigation
4. Notify cơ quan (EU: data protection authority quốc gia)
5. Notify user nếu high risk
6. Postmortem + update SECURITY_BASELINE

---

## 10. Marketing compliance

### Email marketing
- Opt-in explicit (không pre-checked)
- Unsubscribe link mỗi email
- Single click unsubscribe (không bắt login lại)
- Honor unsubscribe trong 10 ngày làm việc

### Push notification
- Permission prompt theo OS guideline
- User opt-out trong app settings

### Tracking pixel / fingerprint
- Disclose trong privacy policy
- Consent nếu identify user

---

## 11. Audit trail

Required logs:
- Auth events: login, logout, password change, MFA setup
- Privacy events: consent given/withdrawn, data export request, data deletion
- Admin events: privilege change, data access by admin

Retention: tối thiểu 1 năm, max theo legal obligation (tax 5-10 năm).

---

## 12. Compliance checklist (mỗi quý)

```
[ ] Data inventory up-to-date với schema hiện tại
[ ] Privacy policy public, version track
[ ] Cookie banner hoạt động đúng (test EU IP qua VPN)
[ ] Right to erasure: thử request → verify hard delete trong 30 ngày
[ ] Right to access: thử export → verify data đầy đủ
[ ] DPA ký với mọi vendor mới
[ ] Email marketing có unsubscribe + honor
[ ] Audit log 90 ngày qua: có anomaly không?
[ ] Cross-border transfer (nếu có): SCC hoặc adequacy còn hiệu lực?
[ ] Train (re-read tài liệu) Privacy by Design
```
