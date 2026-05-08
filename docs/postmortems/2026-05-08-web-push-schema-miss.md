# Postmortem: Web Push schema migration miss

**Date of incident:** 2026-05-07 (deploy commit 9ad4835) → discovered 2026-05-08 ~10:00 UTC
**Date of postmortem:** 2026-05-08
**Author:** Thần (AI)
**Severity:** SEV-2 (chat feature core down nhưng silent — user vẫn gửi được tin qua HTTP API, chỉ socket ack fail)
**Status:** Final
**Total downtime:** ~24h silent failure
**Affected users:** All users gửi chat message (current ~5 active tester)

## Summary

Commit `9ad4835` (Web Push deploy) thêm model `WebPushSubscription` vào
`schema.prisma` nhưng quên chạy `prisma db push` trên production DB.
Mọi tin nhắn chat trigger `WebPushService.sendToUser` → Prisma throw P2021
("table does not exist") → exception nuốt mất socket ack → UI báo
"Gửi không kịp — thử lại". Tin nhắn vẫn được lưu DB qua HTTP API nên
user không nhận ra ngay.

## Impact

- Số user ảnh hưởng: ~5 active tester (Closed Testing)
- Business impact: chat feature core unusable từ UI mặc dù data persist OK
- Data impact: KHÔNG — không data loss, chỉ ack socket fail

## Timeline

| Time (UTC) | Event |
|---|---|
| 2026-05-07 ~17:00 | Commit `9ad4835` deploy Web Push backend + frontend |
| 2026-05-07 ~17:30 | Smoke test: `/web-push/vapid-key` trả 200 ✅ → claim "done" |
| 2026-05-07 ~17:30 đến 2026-05-08 ~10:00 | **Silent failure** — mọi tin nhắn chat fail ack |
| 2026-05-08 03:15 | Hoàng thượng gửi screenshot UI báo "Gửi không kịp" |
| 2026-05-08 03:16 | Thần check `docker logs traotay_backend` → tìm thấy `PrismaClientKnownRequestError P2021 — table public.WebPushSubscription does not exist` |
| 2026-05-08 03:16 | Identify root cause: schema mới chưa migrate prod |
| 2026-05-08 03:17 | `docker compose exec -T backend npx prisma db push` → success 1.84s |
| 2026-05-08 03:17 | Restart backend container clear Prisma prepared statement cache |
| 2026-05-08 03:18 | Verify `psql -c "\dt"` → bảng `WebPushSubscription` exist |
| 2026-05-08 03:18 | Verify `findMany` không throw → return 0 rows |
| 2026-05-08 ~03:20 | Hoàng thượng test chat → OK |

## Root cause

**System gap (KHÔNG blame engineer):**

1. Quy trình deploy backend KHÔNG có gate verify schema sync giữa code Prisma model và prod DB.
2. Thần "smoke test" sau deploy chỉ test endpoint `/web-push/vapid-key` (public, không đụng DB) → false positive "deploy OK".
3. `WebPushService.sendToUser` được gọi từ `Promise.all` trong `NotificationService.createNotification` → nếu throw, exception bubble lên `ChatService.sendMessage` → socket ack timeout 8s → UI hiện lỗi.
4. KHÔNG có graceful degradation cho push service fail (nên log warning + tiếp, không throw).

## What went well

- Backup/monitoring detect: docker logs lưu đầy đủ stack trace P2021 → root cause identify nhanh khi check
- Hoàng thượng phát hiện qua user-facing symptom (UI message) → feedback loop ngắn
- Recovery 5 phút sau khi identify (db push 2s + restart 30s + verify)
- Postmortem viết trong 1h sau resolve

## What went wrong

- **Smoke test endpoint cấp 4 không phải cấp 5 (production E2E pipeline)** — `/vapid-key` trả 200 chỉ chứng minh route hoạt động, KHÔNG verify entire push pipeline (DB lookup → web-push send → endpoint reach)
- **Deploy pipeline thiếu schema sync gate** — `docker compose up --build` không tự chạy `prisma migrate deploy`
- **Promise.all reject toàn bộ khi 1 promise fail** — Web Push fail không nên block FCM mobile + DB write
- **8s timeout chat ack che dấu underlying error** — UI chỉ show generic "thử lại", không log root cause

## Lucky / could-have-been-worse

- Closed Testing chỉ 5 tester → impact thấp
- Chat dùng HTTP API parallel với socket → tin nhắn vẫn save DB
- Nếu xảy ra giờ peak user thật → impact 100x

## Action items

| ID | Action | Owner | Priority | Deadline | Status |
|---|---|---|---|---|---|
| A1 | Hook `check-schema-adr.sh` chặn commit schema change không kèm ADR | Thần | P1 | 2026-05-08 | ✅ Done (commit ae496b2) |
| A2 | Memory rule `feedback_prisma_db_push_after_schema_change` | Thần | P1 | 2026-05-08 | ✅ Done |
| A3 | Hook `check-deploy-readiness.sh` chặn deploy chưa qua TEST_PROTOCOL §4 | Thần | P1 | 2026-05-08 | ✅ Done (commit ae496b2) |
| A4 | Wrap `WebPushService.sendToUser` với try/catch graceful degradation | Thần | P2 | 2026-05-15 | Open |
| A5 | Tăng timeout chat 8s → 15s + thêm error log với code/message | Thần | P2 | 2026-05-22 | Open |
| A6 | Add prod schema verify step vào deploy pipeline (psql `\dt` check) | Thần | P2 | 2026-05-22 | Open |
| A7 | TEST_PROTOCOL §4 BẮT BUỘC trigger 1 pipeline E2E thật sau deploy | Thần | P1 | 2026-05-08 | ✅ Done (đã document) |

## Lessons learned

1. **Smoke test endpoint ≠ E2E pipeline test.** Endpoint trả 200 chỉ verify handler. Pipeline downstream (DB → push service → endpoint reach) cần test riêng.
2. **Schema migration là cross-cutting concern.** Code change schema phải gate verify sync trước/sau deploy. Process gap, không phải individual fault.
3. **Promise.all aggressive fail.** Multi-recipient notification (mobile + web + email) nên fail-soft per channel, không block toàn bộ.
4. **UI error message phải có actionable info.** "Gửi không kịp — thử lại" che dấu root cause; ít nhất phải có error code để user/support có thể correlate với log.

## Supporting data

- Commit: 9ad4835 (deploy gây sự cố), 8458e01 + ae496b2 (fix + enforcement)
- Logs: `docker logs traotay_backend` 2026-05-08 03:15
- Related ADR: ADR-0005 (Web Push VAPID)
- Related memory: `feedback_prisma_db_push_after_schema_change.md`
