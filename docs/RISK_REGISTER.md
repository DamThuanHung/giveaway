# Risk Register — Trao Tay

Last full review: 2026-06-30
Next scheduled review: 2026-08-01

Format theo `docs/standards/RISK_REGISTER.md`. Score = Probability × Impact (1-25).
Color: Green (1-4) | Yellow (5-9) | Orange (10-15) | Red (16-25).

---

## Open risks

### R-001: Single point of failure — primary database
- **Category:** Technical
- **Probability:** 3 / **Impact:** 5 / **Score:** 15 (Orange)
- **Owner:** Hoàng thượng
- **Status:** Mitigating
- **Description:** Postgres chạy 1 instance trên EC2 t3.micro. EBS disk fail hoặc instance crash → service down toàn phần.
- **Mitigation:** Backup 3-2-1 (local hourly + B2 daily). RTO target < 4h. Snapshot trước mọi migration.
- **Trigger to revisit:** DAU > 1k → cân nhắc RDS multi-AZ
- **Date logged:** 2026-04-26

### R-002: Secret leak qua git commit
- **Category:** Security
- **Probability:** 2 / **Impact:** 5 / **Score:** 10 (Orange)
- **Owner:** Hoàng thượng
- **Status:** Mitigating
- **Description:** AWS key, JWT secret, DB password có thể leak nếu commit `.env` hoặc hardcode.
- **Mitigation:** `.env*` trong `.gitignore`, gitleaks GitHub Action chạy mỗi PR, pre-commit hook detect-secrets pattern AKIA + ghp_ + private key.
- **Trigger to revisit:** Sau mọi rotation secret
- **Date logged:** 2026-04-26

### R-004: Tester crisis Closed Testing
- **Category:** Business
- **Probability:** 5 / **Impact:** 4 / **Score:** 20 (Red) → **Accepted/Deferred 2026-05-08** (strategy pivot)
- **Owner:** Hoàng thượng
- **Status:** Accepted/Deferred — strategy pivot sang web-first acquisition
- **Description (cũ):** Closed Testing Google Play yêu cầu 12 tester active 14 ngày. Hiện 4-5 tester active. Nếu < 12 → reset 14-ngày clock.
- **Decision 2026-05-08 (hoàng thượng)**: Web đã LIVE và bắt đầu chạy → chấp nhận risk Google đánh trượt đợt Closed Testing này. Pivot focus sang đẩy mạnh acquisition web. App Closed Testing thành option B, retry sau khi web có user mass + social proof.
- **New mitigation strategy**: Growth web-first (OG image động + analytics + landing improvement + early adopter survey). Khi web reach 500-1000 MAU organic, retry Closed Testing với social proof mạnh hơn.
- **Trigger to revisit**: Web MAU > 500 hoặc 3 tháng (2026-08-08), whichever comes first → đánh giá lại có retry Closed Testing không.
- **Date deferred:** 2026-05-08
- **Trigger to revisit:** Hằng tuần đếm tester active
- **Date logged:** 2026-04-30

### R-005: Auth không có MFA cho admin
- **Category:** Security
- **Probability:** 3 / **Impact:** 4 / **Score:** 12 (Orange)
- **Owner:** Hoàng thượng
- **Status:** Open
- **Description:** Admin account hiện chỉ password + JWT. Nếu password leak → full takeover.
- **Mitigation:** Implement TOTP 2FA cho admin trong sprint kế. Backup code 10 mã.
- **Trigger to revisit:** Trước khi onboard admin thứ 2
- **Date logged:** 2026-05-08

### R-006: GDPR right to erasure chưa implement đầy đủ
- **Category:** Compliance
- **Probability:** 2 / **Impact:** 5 / **Score:** 10 (Orange)
- **Owner:** Hoàng thượng
- **Status:** Open
- **Description:** User request xóa account → soft delete (deletedAt). Chưa hard delete sau 30 ngày + cascade post/comment/file.
- **Mitigation:** Implement cron job hard-delete user soft-deleted > 30 ngày + cascade. Document trong COMPLIANCE.
- **Trigger to revisit:** Khi có user EU đầu tiên hoặc compliance audit
- **Date logged:** 2026-05-08

### R-007: Vendor lock-in MinIO → S3 migration cost
- **Category:** Vendor
- **Probability:** 2 / **Impact:** 3 / **Score:** 6 (Yellow)
- **Owner:** Hoàng thượng
- **Status:** Accepted
- **Description:** Khi volume > 200GB hoặc DAU > 10k, có thể cần migrate MinIO → S3/R2 cho cost + scale.
- **Mitigation:** S3-compatible API → migrate chỉ đổi endpoint + credentials. Backup B2 daily là parallel data nguồn.
- **Trigger to revisit:** Volume > 100GB
- **Date logged:** 2026-04-26

### R-008: Domain expiration
- **Category:** Vendor
- **Probability:** 1 / **Impact:** 5 / **Score:** 5 (Yellow)
- **Owner:** Hoàng thượng
- **Status:** Mitigating
- **Description:** `traotay.com.vn` expire → site down + danh tiếng tổn hại.
- **Mitigation:** Auto-renewal bật tại TenTen.vn 12 tháng. Lock domain (registrar lock). Backup expiration date trong calendar + password manager.
- **Trigger to revisit:** Hằng năm trước expire 60 ngày
- **Date logged:** 2026-04-26

### R-009: Hoàng thượng burnout
- **Category:** People
- **Probability:** 3 / **Impact:** 5 / **Score:** 15 (Orange)
- **Owner:** Hoàng thượng
- **Status:** Open
- **Description:** Solo dev → high cognitive load. Burnout → dự án dừng vĩnh viễn.
- **Mitigation:** AI delegate technical tasks max. Hard limits: không code sau 22:00. Weekly review pace.
- **Trigger to revisit:** Khi work > 60h/tuần liên tiếp 2 tuần
- **Date logged:** 2026-05-08

### R-010: Schema migration miss → bug ngầm production
- **Category:** Technical
- **Probability:** 2 / **Impact:** 4 / **Score:** 8 (Yellow)
- **Owner:** Thần (AI)
- **Status:** Mitigating
- **Description:** Sự cố Web Push 2026-05-08: schema mới WebPushSubscription quên `prisma db push` prod → chat fail âm thầm 1 ngày.
- **Mitigation:** Hook `check-schema-adr.sh` chặn commit schema không ADR. Memory rule `feedback_prisma_db_push_after_schema_change`. Deploy checklist BẮT BUỘC verify schema sync.
- **Trigger to revisit:** Sau mỗi schema change → audit có execute đủ checklist không
- **Date logged:** 2026-05-08

### R-011: AI refactor aggressive non-2xx status → false ErrorState
- **Category:** Technical (AI working pattern)
- **Probability:** 3 / **Impact:** 3 / **Score:** 9 (Yellow)
- **Owner:** Thần (AI)
- **Status:** Mitigating
- **Description:** Sự cố G-01 commit 5547723 (2026-05-08): AI refactor `setPosts([])` → `setFetchError(true)` cho mọi `!res.ok`. Aggressive với 401/403/404 (auth stale, user mới) → user thấy ErrorState false alarm thay vì empty state. Hoàng thượng phát hiện sau test thật trên /favorites.
- **Mitigation:** Pattern smart-fetch đã apply commit e4df360 (favorites + chat). Memory cần lưu rule "khi refactor !res.ok handling, BẮT BUỘC differentiate auth (401/403) / not-found (404) / transient (5xx) / network".
- **Trigger to revisit:** Mỗi refactor aggregate fetch logic — audit pattern non-2xx handling
- **Date logged:** 2026-05-08

### R-013: PostView count không phân biệt bot/spam/F5/self-view
- **Category:** Technical (data quality)
- **Probability:** 3 / **Impact:** 2 / **Score:** 6 (Yellow)
- **Owner:** Thần (AI)
- **Status:** Accepted (deferred to v2)
- **Description:** ADR-0010 PostView aggregate count mọi `getPostById` request, KHÔNG phân biệt: (a) F5 spam cùng user cùng ngày, (b) author tự xem bài mình (endpoint không có auth context để kiểm tra), (c) bot/scrape user-agent, (d) anonymous view. Match hành vi `Post.viewCount` cũ — lỗi về phía inflate đều, không lệch tương đối giữa post nên ranking vẫn relative-correct.
- **Mitigation v1:** Chấp nhận inflate. Note rõ ở ADR-0010 + UI period-note để admin hiểu semantics. Không filter user-agent vì có thể block legit Facebook/Zalo scraper preview.
- **Mitigation v2 trigger-based:** Khi DAU > 500 hoặc phát hiện 1 post inflate >10x organic baseline → thêm rate-limit theo IP+session (max 1 view / post / hour). Khi cần loại self-view → endpoint nhận optional userId từ JWT.
- **Trigger to revisit:** Top bài lượt xem có outlier nghi ngờ bot, hoặc admin báo cáo inflate suspicious; DAU vượt 500
- **Date logged:** 2026-05-08

### R-012: Backend service trả Post raw không qua formatPost helper
- **Category:** Technical (architecture pattern)
- **Probability:** 3 / **Impact:** 3 / **Score:** 9 (Yellow)
- **Owner:** Thần (AI)
- **Status:** Mitigating
- **Description:** Sự cố 2026-05-08: hoàng thượng phát hiện /favorites hiện 4/6 thẻ placeholder 📦 thay ảnh. Audit: /favorite + /follow/feed + /admin/posts đều `prisma.post.findMany` raw không qua formatPost helper → field imageUrl undefined (computed từ images[0]). Pattern lặp lại 3 service.
- **Mitigation:** Export formatPost từ post.service. Apply ở 3 service đã fix (favorite + follow + admin). Memory rule `feedback_format_post_helper_pattern` cho session sau. Long-term: cân nhắc Prisma middleware tự động transform khi có team.
- **Trigger to revisit:** Mỗi service mới có Post relation → checklist BẮT BUỘC apply formatPost; mỗi PR review prisma.post.findMany audit
- **Date logged:** 2026-05-08

---

## Closed risks

### R-003: Backup restore chưa được test thực — RESOLVED 2026-06-30
- **Category:** Technical
- **Probability:** 4 / **Impact:** 5 / **Score:** 20 (Red) → **0 (Resolved)**
- **Owner:** Hoàng thượng
- **Status:** ✅ Resolved
- **Description (cũ):** Backup tưởng chạy auto từ 2026-04-30 nhưng chưa restore thử nghiệm.
- **Phát hiện 2026-06-30 (audit nâng cấp hệ thống):** Thực tế nặng hơn doc cũ ghi — `scripts/backup.sh` mất execute bit từ **2026-05-08** (`-rw-rw-r--`, có thể do 1 lần git operation ghi đè permission), cron `0 20 * * *` fail "Permission denied" **mọi ngày suốt 53 ngày liên tiếp**, không có alert nên không ai phát hiện. Backup gần nhất trước khi fix: `db-2026-05-07_2000.sql.gz` (cả local lẫn B2).
- **Fix:** `chmod +x scripts/backup.sh` → chạy thử thành công → file mới `db-2026-06-30_1201.sql.gz` xuất hiện cả local lẫn B2. Cron tối nay (20:00) tự chạy lại bình thường.
- **DR drill thực hiện ngay sau fix:** Restore `db-2026-06-30_1201.sql.gz` vào Postgres tạm cô lập (Docker container riêng, không đụng production) → **RTO đo được: 11 giây**. So sánh 20 bảng + sample data (users=13, posts=60, bumpOrders=18, tiktokCred=1) → **khớp 100%** với production. Container + volume tạm đã xoá sạch sau drill.
- **Risk còn lại:** Drill mới test restore DB dump (Postgres), CHƯA test restore MinIO data (ảnh bài đăng) từ B2 sync. Chưa test kịch bản mất nguyên EC2 instance (chỉ test mất DB).
- **Trigger to revisit:** Drill kế tiếp nên test luôn restore MinIO + kịch bản rebuild EC2 từ đầu — Q4 2026 hoặc khi volume dữ liệu tăng đáng kể.
- **Date logged:** 2026-04-30
- **Date resolved:** 2026-06-30

---

## Trao Tay-specific risks (post-Stage 1)

Chưa active vì pre-trigger:

- **R-101 (pre-trigger):** Payment gateway PayOS suspend account — trigger khi có 100 transaction
- **R-102 (pre-trigger):** Bot abuse signup spam — trigger khi DAU > 500
- **R-103 (pre-trigger):** Cross-border data transfer GDPR — trigger khi có user EU
- **R-104 (pre-trigger):** Tax compliance khi có revenue — trigger khi MRR > 50M VND
