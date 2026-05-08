# AI Collaboration Rules — Quy tắc cho user khi làm việc với AI

> Đối ngẫu của `AI_WORKING_RULES.md`. Universal — áp dụng mọi dự án.
> User-side playbook để work với AI hiệu quả + an toàn.

---

## 0. Mental model về AI

| AI giỏi | AI yếu |
|---|---|
| Đọc + tổng hợp lượng lớn code/docs | Trí nhớ giữa session (cần memory system) |
| Pattern matching, refactor cơ học | Phán đoán business priority |
| Sinh code boilerplate, test cases | Verify production thực tế |
| Liệt kê edge cases, threat model | Cảm nhận user pain qua text |
| Đề xuất multiple options + tradeoff | Chủ động dừng khi đi sai hướng |
| Tuân thủ checklist nghiêm túc | Tự discipline khi context lớn |

→ User nên **leverage strength, mitigate weakness** qua process + tooling.

---

## 1. Khi nào dùng AI vs DIY

### Dùng AI khi
- Task có spec rõ + có pattern reference (CRUD endpoint, form validation)
- Cần tổng hợp nhiều file/log/docs (>10 file đọc)
- Cần liệt kê exhaustive (test cases, security threats, edge cases)
- Boilerplate setup (config CI, scaffolding project)
- Refactor cơ học (rename, extract function, port code A→B)
- Debug bug có log/error message rõ
- Document hóa (README, API doc, comment WHY)

### TỰ làm khi
- Quyết định business priority (feature gì, cho ai, khi nào)
- Pivot scope / kill feature
- Negotiate với vendor / customer
- Quyết định brand identity / tone
- Approval cuối cùng của decisions kiến trúc lớn (AI propose, user decide)
- Hire / fire / partner

### CẢ HAI khi
- Code review (AI tìm pattern issue + user judge tradeoff)
- Estimation (AI provide data, user decide)
- Risk analysis (AI list, user prioritize)

---

## 2. Prompt patterns — good vs bad

### Pattern 1: Task có spec
❌ "Làm cho tao endpoint user"
✅ "Tạo endpoint POST /users để signup. Body: {email, password}. Validate email format + password >=8 chars. Return JWT. Tham khảo pattern endpoint /login đã có. Test mức 3 (integration local)."

→ AI biết rõ scope, ràng buộc, mức test → đỡ phải hỏi lại 5 câu.

### Pattern 2: Sửa bug
❌ "Sao login không work"
✅ "Login fail với email A. Log backend: [paste error]. Đã verify password đúng qua psql. Step reproduce: 1.../2.../3...."

→ AI có context đủ để đoán nguyên nhân thay vì hỏi.

### Pattern 3: Architecture decision
❌ "Dùng Postgres hay Mongo?"
✅ "Quyết Postgres hay Mongo cho dự án X. Ràng buộc: solo dev, expect 100 DAU năm 1, không có transaction phức tạp, có search full-text. Đề xuất với lý do, có ADR template không?"

→ AI có constraint để cân nhắc, không trả lời vu vơ.

### Pattern 4: Frustrated với AI
❌ Im lặng / "fix lỗi đi"
✅ "Đây là lỗi thứ 3 cùng kiểu. Khanh đang [làm gì sai]. Quy tắc cần áp dụng: [memory rule X]. Làm lại."

→ AI hiểu vấn đề pattern + memory rule cần enforce.

### Pattern 5: Test discipline
❌ "Test chưa?"
✅ "Mức test đã đạt? (theo TEST_PROTOCOL §3) Đưa evidence cụ thể (curl response/log/query result)."

→ Force AI chứng minh thay vì claim mơ hồ.

### Anti-pattern user nên tránh
- Quá nhiều ràng buộc trong 1 prompt → AI overload, miss requirement
- Không cung cấp context (file/log/error) → AI đoán → sai
- Hỏi đa nghĩa → AI assume → đi sai hướng → tốn rework
- Không feedback khi AI sai → AI tiếp tục pattern sai

---

## 3. Review AI output — checklist

### 3.1 Code AI sinh ra
- [ ] AI đã đọc source thật chưa (hay bịa)?
- [ ] Pattern có nhất quán với codebase không?
- [ ] Có over-engineering (thêm abstraction không cần)?
- [ ] Edge cases AI nói "đã verify" — verify lại 1 sample
- [ ] Test mức nào? Có evidence không?

### 3.2 Khi AI báo "done"
- [ ] AI có tự test E2E không, hay chỉ "build pass"?
- [ ] Production smoke test có chạy không?
- [ ] Logs sạch errors trong 2 phút sau deploy?
- [ ] Schema sync đã verify (psql query)?

### 3.3 Khi AI propose multiple options
- [ ] Option default có phải "đầy đủ + đúng" không, hay "rút ngắn scope"?
- [ ] Tradeoff có rõ ràng không?
- [ ] Lý do chọn option recommended có thuyết phục?

### 3.4 Khi AI sửa file lớn
- [ ] Diff có chỉ động phần liên quan, hay touching khắp file?
- [ ] Rename biến/function có break callsite ngoài file?
- [ ] Có rebuild + test sau sửa không?

---

## 4. Red flags — AI đang sai

### Khi thấy những dấu hiệu này, **DỪNG**, không cho AI tiếp:

| Red flag | Ý nghĩa |
|---|---|
| AI claim "done" mà không có evidence cụ thể | Đang ở mức 1-2, không phải mức 5 |
| AI đề xuất "phương án A đơn giản hơn = bỏ feature X" | Vi phạm `feedback_effectiveness_over_speed` |
| AI hỏi "anh muốn tôi làm A hay B" mà không có recommendation | Vi phạm `feedback_propose_before_asking` |
| AI báo "test giúp thần xem OK không" | Vi phạm `feedback_self_test_before_handoff` |
| AI sinh code reference function/file mà không grep verify | Đang đoán, có thể bịa |
| AI mở đầu bằng bảng kỹ thuật khi user vừa frustrated | Vi phạm EQ rule #2 |
| AI làm 5 việc cùng lúc thay vì 1 | Vi phạm `feedback_one_task_at_a_time` |
| AI "tiện đây làm thêm" | Lan man, vi phạm 1 fix 1 focus |
| AI quên memory đã lưu, làm sai pattern cũ | Memory không được load — manual reference |
| AI đề xuất destructive action (rm -rf, force push) tự động | Phải chặn ngay |

### Phản ứng khi gặp red flag
1. **Dừng action ngay** — không cho AI tiếp
2. **Reference rule cụ thể**: "vi phạm AI_WORKING_RULES §X.Y"
3. **Yêu cầu rollback** nếu AI đã chạy command sai
4. **Update memory** nếu pattern lặp 2+ lần

---

## 5. Escalation — khi AI loạn

### Symptom: AI giải thích quanh co không vào chốt
- "Để tôi xem lại..." liên tục
- Đề xuất nhiều options nhưng không recommend
- Hỏi clarification cho thứ đã rõ

→ **Action:** "Trẫm bảo làm X. Làm ngay. Không cần giải thích."

### Symptom: AI vi phạm rule liên tục
- Lặp lại vi phạm cùng rule 3+ lần trong session

→ **Action:**
1. `/compact` để clear context, AI reload memory fresh
2. Nếu vẫn → escalate sang AI khác (Gemini, ChatGPT) 1 task để cross-check
3. Nếu rule không hold → review/rewrite rule, có thể quá strict

### Symptom: AI sinh code không match style
- Naming khác, format khác, pattern khác
- Có thể do CLAUDE.md không được load

→ **Action:**
1. Nhắc đọc CLAUDE.md
2. Nếu CLAUDE.md không đủ → bổ sung section "Code Style"
3. Force AI đọc 1 file mẫu trước khi sinh code mới

### Symptom: AI claim làm xong nhưng thực tế broken
- User test → fail
- Đây là vi phạm `feedback_self_test_before_handoff`

→ **Action:**
1. Trách rõ: "Trẫm bảo test thật kỹ cơ mà"
2. Force AI tự test E2E ngay (curl, log, query)
3. Lưu memory nếu pattern lặp

---

## 6. Cross-AI workflow

### Khi nào dùng nhiều AI
- 1 AI cho code (Claude Code), 1 AI cho business strategy (Claude/Gemini browser tab)
- AI chính + AI khác cross-check decision quan trọng (architecture, security)
- Khi 1 AI loạn → AI khác làm sanity check

### Cách handoff context
- File `docs/PROJECT_BRIEFING.md` luôn up-to-date — paste sang AI mới
- Memory của Claude Code KHÔNG share với AI khác — phải copy thủ công nếu cần
- Quyết định cross-AI → ghi vào ADR (single source of truth)

### Tránh xung đột
- 1 task = 1 AI từ đầu đến cuối (không switch giữa chừng)
- Nếu phải switch: AI cũ tóm tắt state → user paste cho AI mới
- Không để 2 AI sửa cùng file cùng lúc

---

## 7. Cost control

### Budget AI usage
- Track tokens / API call cost
- Set monthly budget alert (Anthropic/OpenAI dashboard)
- Khi gần budget: ưu tiên task quan trọng, defer cosmetic

### Optimize prompt
- Đừng paste full file khi chỉ cần section — link line range
- Đừng hỏi câu đã trả lời — search lại
- Compact session khi context > 70% — không kéo dài
- Memory pointer thay vì paste lại context mỗi session

---

## 8. Trust calibration

AI compliance theo memory rule = ~60-99% tùy enforcement layer:
- L1 (memory only) ~60% → DON'T trust claim "done"
- L1+L2 (hooks) ~85% → trust hook output, vẫn verify big decisions
- L1+L2+L3 (CI) ~99% → trust hooks + CI, spot check production

### Verify behaviors
- Random sample 1/10 commit: đọc full diff không qua AI summary
- Mỗi sự cố: postmortem có blame system, không blame AI lazy?
- Mỗi quý: chạy `/audit-standards`, xem compliance trend

### Khi mất trust
- Nếu AI lừa (claim done mà chưa test): ghi vào RISK_REGISTER là R-AI-XXX
- Tăng enforcement layer (thêm hook, CI gate)
- KHÔNG chấp nhận lý do "tôi quên" — process gap, không personal fault

---

## 9. AI rights vs limits

### AI có quyền (nếu user ủy quyền)
- Edit/Write file local
- Run script test
- Git commit (với evidence)
- Push lên branch dev/feature
- Run integration test
- Query DB read-only

### AI cần xin phép
- Git push main/master
- Deploy production
- Run db migration production
- `rm -rf`, force push, destructive
- Spend money (cloud, third-party API)

### AI bị CẤM tuyệt đối
- Bypass security check không có authorization
- Skip hooks (--no-verify) không có lý do
- Commit secret/PII vào git
- Ignore user feedback "không làm X" (Decision Log)

Bảng này phải được chốt buổi 1 dự án mới (xem `PROJECT_KICKOFF.md` §3.3).

---

## 10. Cheat sheet — dòng đầu mỗi prompt

User có thể paste dòng này trên đầu prompt để force AI tuân thủ:

```
[mode: production]
- Tự test E2E mức 5 trước khi báo done
- Edge cases + Test level evidence trong commit message
- ADR nếu schema change
- KHÔNG đề xuất "rút ngắn scope"
- KHÔNG kèm "tiện đây cải thiện X"
- 1 fix 1 focus
```

Cho task nhỏ:
```
[mode: dev]
- Test mức 2-3 OK
- Khỏi commit, để user review trước
```

Cho exploration:
```
[mode: explore]
- Đề xuất multiple options + tradeoff
- KHÔNG implement
- Wait user decision
```
