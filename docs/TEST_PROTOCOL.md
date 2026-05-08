# Test Protocol — Universal

> Bộ luật test cho mọi dự án mà thần làm việc với hoàng thượng.
> Áp dụng để KHÔNG bao giờ claim "done" khi chưa thực sự verify.
> Soạn 2026-05-08 dựa trên lessons learned từ Trao Tay.

---

## 0. Tại sao cần bộ luật này

Bài học cụ thể từ Trao Tay:

| Sự cố | Thần đã làm gì | Hậu quả |
|---|---|---|
| Web Push deploy `9ad4835` | Test endpoint `/vapid-key` trả 200 → claim done | Schema chưa migrate → mọi tin nhắn chat fail âm thầm 1 ngày |
| Splash treo iPhone (1.0.6+8) | Build APK pass → claim done | TokenStorage throw → splash treo vô tận |
| Sync VIP/Plus badge | Tự nghĩ design web → claim sync mobile | Thiếu animated border + sparkles + shimmer + glow + sold overlay |
| "Tin đăng" → "Bài đăng" | Grep source clean → claim deploy | Server còn ở commit cũ do permission denied → user vẫn thấy cũ |

**Pattern chung**: thần test ở mức "lower" rồi claim ở mức "higher".

---

## 1. Định nghĩa "DONE"

> "Done" = task đã được verify ở mức **đủ cao** để user **không cần làm gì thêm** trước khi nhận giá trị.

Không bao giờ dùng từ "done", "xong", "tested" khi chưa đạt mức tương ứng task.

---

## 2. Pyramid 5 mức test

```
                    ┌──────────────────────┐
              5     │  PRODUCTION SMOKE     │  ← curl prod, query prod DB, đọc prod log
                    ├──────────────────────┤
              4     │  E2E THỰC             │  ← mở app/browser thật, click flow đầy đủ
                    ├──────────────────────┤
              3     │  INTEGRATION          │  ← gọi API local + check response shape
                    ├──────────────────────┤
              2     │  MENTAL WALKTHROUGH   │  ← đi qua flow trên giấy + edge cases
                    ├──────────────────────┤
              1     │  STATIC CHECK         │  ← typecheck, lint, compile pass
                    └──────────────────────┘
```

### Mức 1 — Static check
- TypeScript: `tsc --noEmit`
- Flutter: `flutter analyze`
- Rust: `cargo check`
- Lint pass

**Đủ cho**: rename biến, format, comment, di chuyển import.
**KHÔNG đủ cho**: bất cứ task có logic.

### Mức 2 — Mental walkthrough
Tự đi qua flow user end-to-end **bằng cách đọc code, KHÔNG chạy**:
- Vẽ mental model: user vào → thấy gì → tap gì → state đổi gì → API gọi gì → DB query gì → response ra sao → render gì.
- 5+ edge cases (xem checklist ở §5).

**Đủ cho**: sửa label/icon UI thuần, thay magic number, port code 1-1.
**KHÔNG đủ cho**: thêm async flow, đổi state machine, thay API contract.

### Mức 3 — Integration
- Backend: `curl localhost:3000/api/...` + check status + response shape.
- Frontend: dev server `npm run dev` + click flow trên localhost.
- DB: `psql -c "SELECT..."` verify data shape sau migration.

**Đủ cho**: feature isolated, không cross-service, không deploy.
**KHÔNG đủ cho**: feature cross-service (mobile + backend + push), feature có deploy bước.

### Mức 4 — E2E thực
- Mobile: build APK/IPA, install lên **device thật** (không emulator), thực hiện flow đúng intent của user.
- Web: mở browser thật, hard refresh, click flow đầy đủ, mở DevTools network/console.
- Multi-device: khi feature có realtime/push → cần ít nhất 2 client cùng lúc.

**Đủ cho**: feature local đã deploy lên dev environment.
**KHÔNG đủ cho**: feature đã ship production.

### Mức 5 — Production smoke
Sau khi deploy production:
- `curl https://api.../endpoint` xem trả gì thật.
- `ssh server + docker logs --since 5m | grep -iE "error|exception"`.
- `psql production -c "SELECT..."` verify schema/data.
- Trigger pipeline thật (vd: gọi API → tới DB → tới push service) — đảm bảo không có bug ngầm.

**Bắt buộc cho**: mọi task có deploy production.

---

## 3. Mức tối thiểu theo loại task

| Loại task | Mức tối thiểu trước khi báo done |
|---|---|
| Đổi label / màu / icon UI | 2 (mental walkthrough) |
| Sửa logic frontend đơn giản | 3 (integration) |
| Sửa API backend | 4 (E2E local) |
| Schema migration (Prisma/Django/...) | **5** (production smoke + verify table/index thật trên prod DB) |
| Cross-service feature (mobile + backend + push) | **5** + trigger end-to-end pipeline 1 lần thật |
| Deploy có DB change | **5** + verify schema sync giữa code và prod DB |
| Bug fix tester báo cáo | 4 + reproduce bug trước, verify fix bằng cách reproduce lại |

**Quy tắc vàng**: nếu nghi ngờ → mức cao hơn 1 nấc.

---

## 4. Checklist verify production (mức 5)

Sau mọi deploy có touching:

### 4.1 Backend deploy
```
[ ] Container started? (docker ps + uptime)
[ ] /health endpoint trả 200?
[ ] docker logs --since 2m grep -iE "error|exception" sạch?
[ ] Endpoint vừa thay đổi: curl thật, parse response, verify shape mới
[ ] Nếu touching schema: query psql verify table/column/index tồn tại
[ ] Trigger 1 pipeline E2E thật (vd: tạo bản ghi → fanout → notification → verify ở consumer)
```

### 4.2 Frontend deploy
```
[ ] Build pass + push lên hosting/CDN
[ ] curl URL trang ảnh hưởng → grep content mới có trong HTML
[ ] Nếu CDN có cache: bypass cache (curl -H "Cache-Control: no-cache" + cb=$(date +%s))
[ ] Verify chunk hash mới đã được serve (curl HTML grep page-{hash}.js)
[ ] Cross-origin/cookie/CORS không bị break: kiểm DevTools network
```

### 4.3 Mobile release
```
[ ] APK/IPA build pass
[ ] Install lên device thật → cold start không crash
[ ] Cold start = clear app data → mở lại; warm start = đã chạy ngầm
[ ] Verify không treo splash, không crash khi mất mạng
[ ] Verify upgrade từ version cũ → keystore signing khớp
```

### 4.4 Schema migration (riêng)
```
[ ] Local: chạy migration, verify schema mới đúng
[ ] Production: chạy `prisma db push` HOẶC `migrate deploy` (chọn 1 nhất quán project)
[ ] psql verify table/column/index thật sự tồn tại
[ ] Restart backend để clear Prisma prepared statement cache
[ ] Trigger 1 query thật đụng schema mới → không throw
```

---

## 5. Edge case checklist (5+ mỗi task)

Trước khi báo done, tự đặt 5+ câu hỏi từ list này:

- **First install**: token=null, prefs trống, DB trống — flow ra sao?
- **Upgrade từ version cũ**: token cũ, signing key, schema cũ — có break không?
- **Token corrupt / expired / invalid** — có catch + fallback không?
- **Network fail / timeout / 5xx** — UI có treo không? Retry?
- **Async exception không catch** — state có vĩnh viễn loading/error không?
- **User input bậy**: empty, quá dài, special chars, unicode, RTL — validate đủ không?
- **Concurrent**: 2 user cùng action, 2 tab cùng login — race condition?
- **Cold start vs warm start** — có khác biệt nguy hiểm không?
- **Mất kết nối giữa chừng** — recover được không?
- **Empty/null/undefined trên optional fields** — render có break không?
- **Boundary**: 0, 1, 2, max+1, max-1 — sort/pagination có đúng không?

Liệt kê CỤ THỂ trong commit message hoặc response. Không qua loa "đã test edge cases".

---

## 6. Anti-patterns — CẤM tuyệt đối

| Anti-pattern | Vì sao sai |
|---|---|
| "Build pass = done" | Build chỉ là mức 1. Logic chưa được verify. |
| "Endpoint trả 200 = feature work" | 200 chỉ chứng minh handler không throw. Pipeline downstream có thể vẫn fail (Web Push case). |
| "Local OK = production OK" | DB khác, env khác, network khác, build artifacts khác. |
| "Compile xong = ready ship" | Logic, edge case, async path đều chưa verify. |
| "Test trên emulator/BlueStacks là đủ cho release mobile" | Real device có quirk: keychain, signing, network policy, manufacturer skin. |
| "Đã grep source clean = production sạch" | Server có thể chưa pull commit, hoặc cache CDN còn version cũ. |
| "Đã làm trong session trước rồi" | Memory không phải state. Phải verify lại current state. |

---

## 7. Khi không thể tự test

Nếu thật sự cần action vật lý của user (vd: device thật + Google account + thẻ Visa thật + Apple ID), thần phải:

1. **Nói rõ giới hạn**: "thần không tự test được vì cần [X]"
2. **Liệt kê chính xác user cần làm gì**: từng bước, expected result mỗi bước
3. **Liệt kê những gì thần ĐÃ tự verify**: để user không phải kiểm lại cùng việc
4. **Đề xuất cách thay thế nếu user không có điều kiện**: vd "nếu hoàng thượng không có Visa, thần dùng dev endpoint A để mock B"

CẤM kết thúc bằng "test giúp thần xem có OK không" mà không nêu rõ thần đã làm tới mức nào.

---

## 8. Khi user feedback "test chưa kỹ"

Nếu user phàn nàn về test (vd: "ơ test chưa kỹ à?", "Trẫm bảo test thật kỹ cơ mà"):

1. **Acknowledge**: "Hoàng thượng đúng, thần [thiếu mức X]"
2. **Nâng mức ngay**: làm test mức cao hơn user vừa expect
3. **KHÔNG bào chữa**: "đây là lỗi cũ", "không phải session này" — nói SAU khi đã làm xong
4. **Lưu memory**: nếu là pattern lặp lại

---

## 9. Quy tắc 3 ngôn ngữ báo cáo

| Đã làm | Phải nói |
|---|---|
| Mức 1 (typecheck OK) | "Compile pass, **CHƯA test runtime**" |
| Mức 2 (mental walkthrough) | "Đã đi qua logic + edge cases A/B/C **trên giấy**, CHƯA test runtime" |
| Mức 3 (integration local) | "Đã test integration local, **CHƯA verify production**" |
| Mức 4 (E2E local/dev) | "E2E pass trên [device/browser], **CHƯA verify production**" |
| Mức 5 (production smoke) | "Đã verify production: [evidence cụ thể như curl response/log/query result]" |

Chỉ ở mức 5 mới được dùng "done", "xong", "deployed".

---

## 10. Áp dụng vào dự án mới

Khi bắt đầu dự án mới:
1. Copy file này vào `docs/TEST_PROTOCOL.md` của repo mới.
2. Append section "Project-specific test commands" liệt kê command cụ thể stack đó (vd: `cargo test`, `pytest`, `go test ./...`).
3. Reference từ `CLAUDE.md` của project: "TEST: tuân thủ `docs/TEST_PROTOCOL.md`".
4. Reference từ memory: tạo memory `feedback_test_protocol.md` pointer.
