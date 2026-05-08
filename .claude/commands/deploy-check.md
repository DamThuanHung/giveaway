---
description: Run TEST_PROTOCOL §4 production smoke checklist + tạo ack file để unlock deploy hook
---

Chạy production smoke test checklist theo `docs/TEST_PROTOCOL.md` §4.
Sau khi đầy đủ, tạo ack file `/tmp/.deploy-checklist-acked.$(date +%s)` để
unlock `check-deploy-readiness.sh` hook.

Steps:

## 4.1 Backend deploy checklist
- [ ] Container started: `docker ps | grep <service>` → uptime > 0
- [ ] /health endpoint: `curl -sf https://api/...health` → 200
- [ ] Logs sạch: `docker logs --since 2m | grep -iE "error|exception"` → empty
- [ ] Endpoint vừa thay đổi: `curl -s https://api/...endpoint | jq` → response shape đúng
- [ ] Schema sync (nếu có change): `psql ... -c "\dt"` → table mới tồn tại
- [ ] Trigger 1 pipeline E2E: tạo bản ghi → fanout → consumer → verify

## 4.2 Frontend deploy checklist
- [ ] Build pass + push lên hosting/CDN
- [ ] curl URL: `curl -s URL | grep "<expected content>"` → match
- [ ] Cache bypass: `curl -H "Cache-Control: no-cache" URL?cb=$(date +%s)` → fresh
- [ ] Chunk hash mới: `curl URL | grep "page-[a-f0-9]*\.js"` → khác hash cũ

## 4.3 Schema migration checklist (nếu có)
- [ ] Local migration test pass
- [ ] Production: prisma db push HOẶC migrate deploy (tùy project)
- [ ] psql verify column/index tồn tại
- [ ] Restart backend để clear Prisma cache
- [ ] Trigger query đụng schema mới → không throw

## Thực hiện

1. Đi qua từng item, output rõ status (✅ pass / ❌ fail / ⚠️ skip with reason)
2. Nếu BẤT KỲ item fail → KHÔNG tạo ack file, fix vấn đề trước
3. Nếu mọi item pass → `touch /tmp/.deploy-checklist-acked.$(date +%s)`
4. Output: "Checklist passed. Ack file tạo. Hook check-deploy-readiness sẽ
   unlock deploy command trong 10 phút tiếp theo."

User input (loại deploy): $ARGUMENTS
