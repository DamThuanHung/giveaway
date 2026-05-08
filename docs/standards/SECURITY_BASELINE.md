# Security Baseline

> OWASP Top 10 (2021) + STRIDE threat modeling + NIST Cybersecurity Framework.
> Áp dụng từ ngày đầu, KHÔNG đợi sau go-live.

---

## 1. OWASP Top 10 (2021) checklist

| # | Risk | Mitigation bắt buộc |
|---|---|---|
| A01 | Broken Access Control | RBAC/ABAC mỗi endpoint; mặc định deny; test với user khác cố tình truy cập |
| A02 | Cryptographic Failures | TLS 1.2+ mọi communication; password bcrypt/argon2 (cost ≥10); secrets quản qua vault, không commit |
| A03 | Injection | Parameterized query; input validation; ORM/parameterized API; CSP header |
| A04 | Insecure Design | Threat model trước code (xem §3); abuse case; rate limit |
| A05 | Security Misconfiguration | Hardening checklist; remove default cred; CSP/HSTS/CORS đúng |
| A06 | Vulnerable Components | `npm audit` / `pip-audit` / `cargo audit` weekly; auto-update minor; review major |
| A07 | Authentication Failures | MFA cho admin; password policy; session timeout; brute force protection (rate limit + captcha) |
| A08 | Software & Data Integrity | Dependency lock files; container image signing; verify checksum |
| A09 | Logging Failures | Log auth events, privilege change, data access; KHÔNG log password/token; log to external (xem OBSERVABILITY) |
| A10 | SSRF | Whitelist outbound URL; disable redirect follow trên server-side fetch; metadata service block (cloud) |

---

## 2. Secrets management

### Cấm tuyệt đối
- Hardcode secret trong source code
- Commit `.env` chứa secret
- Log secret/token (kể cả debug)
- Truyền secret qua URL query string

### Bắt buộc
- File `.env.example` với placeholder, KHÔNG có giá trị thật
- `.env*` trong `.gitignore` (trừ `.env.example`)
- Production: secrets qua AWS Secrets Manager / HashiCorp Vault / Doppler / dotenv-vault
- Dev: `.env` local, không sync, phân quyền 600
- Rotation cadence: 90 ngày cho key, 180 ngày cho DB password
- Khi leak (kể cả nghi ngờ): rotate trong 1h, không đợi confirm

### Pre-commit hook
```bash
# Detect secrets trước commit
git secrets --install
git secrets --register-aws
# Hoặc: pre-commit + detect-secrets
```

---

## 3. Threat modeling — STRIDE

Trước khi code feature có data sensitive, chạy STRIDE:

| Letter | Threat | Câu hỏi |
|---|---|---|
| **S**poofing | Giả danh | Ai có thể giả là user khác? Auth có robust không? |
| **T**ampering | Sửa data | Ai có thể sửa data ngoài ý muốn (request tampering, replay)? |
| **R**epudiation | Phủ nhận | User có thể chối là không làm hành động X không? Audit log đủ không? |
| **I**nformation Disclosure | Lộ data | Endpoint có leak data sensitive (PII, internal ID, error stack)? |
| **D**enial of Service | DoS | Endpoint nào có thể bị spam? Rate limit? Resource exhaustion? |
| **E**levation of Privilege | Leo quyền | User thường có thể làm action admin không? IDOR? Privilege escalation path? |

Output: `docs/threat-models/<feature>.md` cho mỗi feature có data sensitive.

---

## 4. Auth baseline

### Password
- bcrypt cost ≥10 hoặc argon2id (m=64MB, t=3, p=4)
- Min length 8, không max length cứng (cho password manager)
- KHÔNG enforce complexity rule cứng (NIST 800-63B mới khuyên ngược lại)
- Check breach (haveibeenpwned API) khi sign up

### Session/Token
- JWT: HS256 với key ≥256-bit, hoặc RS256/ES256
- Access token TTL: 15-60 phút
- Refresh token TTL: 30 ngày, rotate mỗi lần dùng
- Revocation: blacklist refresh token khi logout/đổi password
- HttpOnly + Secure + SameSite=Lax cho cookie

### MFA
- Bắt buộc cho admin/owner
- TOTP (Google Authenticator) tối thiểu, optional WebAuthn/FIDO2
- Backup code 10 mã, hash trước khi store

### Rate limit
- Login: 5 lần/phút/IP, 10 lần/phút/account
- OTP: 3 lần/phút/account, 1h cooldown sau 10 fail
- API public: 100 req/phút/IP (adjust theo use case)

---

## 5. Input validation & output sanitization

### Input
- Whitelist > blacklist
- Validate ở backend (KHÔNG TRUST frontend)
- Boundary: length, type, range, format (regex/schema)
- File upload: extension whitelist, MIME check, magic bytes verify, size limit, virus scan

### Output
- HTML context: escape (React tự làm, Vue/Svelte cũng); cẩn thận `dangerouslySetInnerHTML`
- URL context: encodeURIComponent
- JSON: response không trả PII không cần thiết
- SQL: parameterized query (KHÔNG concat string)
- Shell: KHÔNG `exec(userInput)` — dùng `execFile` với arg array

---

## 6. CORS / CSP / Security headers

### Required headers
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY (hoặc SAMEORIGIN nếu cần iframe)
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Content-Security-Policy: default-src 'self'; ...
```

### CORS
- Origin allowlist cụ thể, KHÔNG `*` cho endpoint có cookie
- Credentials: `true` chỉ khi cần
- Methods: chỉ list method dùng, không OPTIONS+ALL

### CSP
- `default-src 'self'`, `script-src 'self' [trusted CDN]`
- Cấm `unsafe-inline`, `unsafe-eval` nếu có thể
- `report-uri` để monitor violation

---

## 7. Dependency security

### Cadence
- `npm audit` / `cargo audit` / `pip-audit` chạy CI mỗi PR
- Dependabot/Renovate auto-PR cho patch + minor
- Major upgrade review thủ công

### Policy
- License whitelist: MIT, Apache-2.0, BSD, ISC
- License cấm: GPL/AGPL (trừ khi cố ý), proprietary với restrictive term
- Lock file (package-lock.json, Cargo.lock, requirements.txt với hash) BẮT BUỘC commit

---

## 8. Audit checklist (mỗi quý)

```
[ ] Rotate secrets >90 ngày tuổi
[ ] Run dependency audit, fix CVE Critical/High trong 7 ngày
[ ] Review IAM permissions (least privilege check)
[ ] Test backup restore (xem DISASTER_RECOVERY)
[ ] Review failed login spike trong logs
[ ] Test rate limit còn work không
[ ] Pen test 1 endpoint random (manual)
[ ] Update threat model nếu kiến trúc đổi
```

---

## 9. Incident — security specific

Khi nghi ngờ breach:
1. **Containment trong 1h**: rotate secret, revoke session, isolate compromised host
2. **Đánh giá scope**: data nào bị access? bao nhiêu user?
3. **Notification**: GDPR yêu cầu notify trong 72h nếu personal data lộ
4. **Postmortem**: theo `INCIDENT_RUNBOOK.md`, ghi rõ root cause + mitigation
5. **Update threat model + baseline**: khóa lỗ hổng có hệ thống, không patch lẻ
