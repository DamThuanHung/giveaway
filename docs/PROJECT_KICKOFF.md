# Project Kickoff — Buổi 1 với Claude Code

> Universal — áp dụng cho mọi dự án MỚI bắt đầu với AI.
> Mục tiêu: kết thúc buổi 1 với CLAUDE.md, bộ luật, và 1 task pilot xong.
> Soạn 2026-05-08 dựa trên kinh nghiệm Trao Tay.

---

## 0. Tại sao cần kickoff bài bản

Không kickoff → mỗi session đầu phải hỏi lại từ đầu. Kickoff đúng = từ session 2 trở đi AI tự load context, đỡ tốn thời gian/token mỗi lần.

Bài học Trao Tay: 6 tháng đầu thần phải dò ý hoàng thượng từng bước (xưng hô, naming convention "Bài đăng", design system v2, workflow deploy AWS). Nếu kickoff bài bản từ đầu, đã đỡ ít nhất 30% thời gian session đầu mỗi tháng.

---

## 1. PHẦN A — Hoàng thượng cần chuẩn bị TRƯỚC buổi 1

Ngắn gọn, không cần hoàn hảo. Có gì viết nấy.

### 1.1 Mục tiêu dự án
- 1-2 câu: dự án này GIẢI QUYẾT vấn đề gì? CHO AI?
- Khác đối thủ ở chỗ nào (1 câu)?

### 1.2 Ràng buộc cứng
- Deadline (nếu có)
- Budget (server, license, third-party)
- Deploy target: tự host VPS / cloud (AWS/GCP/Azure) / serverless / app store

### 1.3 Stack đã quyết định (nếu có)
- Frontend, backend, DB, mobile, infra
- Hoặc: "chưa quyết, cần AI tư vấn"

### 1.4 Tài sản đã có
- Repo cũ? Code base? Design Figma? Database schema? Domain? Account cloud?
- Brand: logo, slogan, naming, color (nếu có)

### 1.5 Cách làm việc preferred
- Tiếng Việt hay English trong code/comment/commit/docs?
- Tone xưng hô (nếu thích kiểu đặc biệt như hoàng thượng/thần)?
- AI tự push commit hay chỉ commit local?
- AI có quyền chạy destructive command (rm -rf, git reset --hard, db migrate) không?

---

## 2. PHẦN B — AI làm gì trong buổi 1

### 2.1 Mở đầu — hỏi đúng 7 câu

```
1. Dự án giải quyết vấn đề gì? Cho ai?
2. Stack đã quyết chưa? Nếu chưa, ràng buộc gì để thần đề xuất?
3. Deploy target gì? (VPS / serverless / mobile store / nội bộ)
4. Có code/design/database cũ không? Đường link?
5. Tiếng Việt hay English cho code/comment/commit?
6. AI tự deploy / tự commit / tự destructive được tới đâu?
7. Định nghĩa "Done" cho 1 task trong dự án này là gì?
```

KHÔNG hỏi 20 câu — overload. Hỏi 7 câu trên, các câu khác hỏi khi đụng đến.

### 2.2 Sau khi nhận trả lời — tạo skeleton

Greenfield (chưa có code):
```
docs/
├── CLAUDE.md                 ← project rules, AI persona
├── PROJECT_BRIEFING.md       ← mục tiêu + ràng buộc + stack quyết
├── TEST_PROTOCOL.md          ← copy từ universal
├── PRODUCTION_CHECKLIST.md   ← copy nếu có deploy
└── PROJECT_KICKOFF.md        ← copy file này

memory/                       ← (~/.claude/projects/<id>/memory/)
├── MEMORY.md                 ← index
├── user_role.md              ← hoàng thượng là ai, role gì
├── project_goal.md           ← mục tiêu cao tầng
└── feedback_test_protocol.md ← pointer
```

Brownfield (đã có code):
- Đọc README + structure repo
- Tạo CLAUDE.md từ những gì học được
- Hỏi user xác nhận những phần AI suy luận

### 2.3 Áp dụng universal laws

Copy 3 file vào repo mới:
- `TEST_PROTOCOL.md` (5 mức test pyramid)
- `PROJECT_KICKOFF.md` (file này)
- Universal AI rules nếu có

Append project-specific commands vào TEST_PROTOCOL §10.

### 2.4 Tạo memory ban đầu

3 memory MUST có sau buổi 1:
1. **`user_role.md`** — user làm nghề gì, level kỹ thuật, role trong dự án
2. **`project_goal.md`** — mục tiêu + 3 ràng buộc cứng nhất
3. **`feedback_collaboration_style.md`** — tiếng Việt/Anh, tone, AI quyền tới đâu

Sau đó session sau auto-load qua MEMORY.md index.

---

## 3. PHẦN C — Hai bên cùng làm trong buổi 1

### 3.1 Định nghĩa "Done"
Mỗi dự án có "Done" khác nhau. MVP có thể: code chạy được, không cần test. Production có thể: E2E test pass + monitoring + alert.

Chốt rõ buổi 1, ghi vào CLAUDE.md.

### 3.2 Workflow commit/push
- Ai chạy `git commit`? AI hay user?
- Commit message format (Conventional Commits / free form)?
- AI được tự `git push` không, hay chỉ commit local đợi user push?
- Hook pre-commit nào cần?

### 3.3 Quyền hạn AI
| Action | AI tự làm | Cần xin phép | CẤM |
|---|---|---|---|
| Edit/Write file | ☐ | ☐ | ☐ |
| Run script test | ☐ | ☐ | ☐ |
| Git commit | ☐ | ☐ | ☐ |
| Git push | ☐ | ☐ | ☐ |
| Deploy production | ☐ | ☐ | ☐ |
| Run db migration | ☐ | ☐ | ☐ |
| `rm -rf`, `git reset --hard` | ☐ | ☐ | ☐ |
| Spend money (cloud, third-party API) | ☐ | ☐ | ☐ |

Tick cụ thể buổi 1, ghi vào CLAUDE.md.

### 3.4 Cách handle xung đột approach
Khi AI đề xuất A nhưng user muốn B:
- AI có quyền nêu phản đối với lý do kỹ thuật?
- Sau khi user vẫn quyết B, AI có ghi Decision Log không?
- Khi quay lại approach A trong tương lai, ai trigger?

---

## 4. PHẦN D — Output cuối buổi 1

Phải có:
- [x] `docs/CLAUDE.md` populated với 7 câu trả lời + quyền hạn AI
- [x] `docs/TEST_PROTOCOL.md` (copy + project-specific commands)
- [x] `docs/PROJECT_BRIEFING.md` (mục tiêu + stack + ràng buộc)
- [x] Memory đầu: `user_role.md`, `project_goal.md`, `feedback_collaboration_style.md`
- [x] 1 task pilot nhỏ (vd: tạo repo skeleton, hello-world endpoint, deploy 1 trang) — chạy được — verify workflow đủ ngon

Pilot task QUAN TRỌNG. Nó test xem 7 câu trả lời + quyền hạn + workflow có **thực sự work** không. Đừng buổi 1 chỉ ngồi bàn lý thuyết.

---

## 5. PHẦN E — Buổi 2 trở đi

### 5.1 Mỗi session đầu, AI tự làm
1. Đọc CLAUDE.md project
2. Đọc MEMORY.md index → load memory liên quan
3. `git log -10` xem session trước làm gì
4. Báo cáo 4 mục: state hiện tại, đang làm dở gì, blocker, next step đề xuất

### 5.2 Trigger đặc biệt user có thể nói
- **"sync tình hình"** → AI đọc CLAUDE.md + memory + git log + báo cáo
- **"tiếp tục"** → resume task dở từ session trước
- **"compact"** → tổng hợp session vào memory trước khi reset context

### 5.3 Mỗi commit/push, AI phải
- Commit message theo format đã chốt buổi 1
- Update memory nếu phát hiện preference/pattern mới
- Update docs/ nếu kiến trúc/business rule đổi

---

## 6. PHẦN F — Template CLAUDE.md cho dự án mới

```markdown
# CLAUDE.md — <Tên dự án>

## VAI TRÒ AI
Bạn là <role: Tech Lead AI / Pair Programmer / ...> của dự án này.

## ĐỌC TRƯỚC MỖI SESSION
| # | File | Mục đích |
|---|---|---|
| 1 | `docs/PROJECT_BRIEFING.md` | Mục tiêu + ràng buộc |
| 2 | `docs/TEST_PROTOCOL.md` | Bộ luật test |
| 3 | <thêm khi cần> | |

## STACK
- Frontend: <...>
- Backend: <...>
- DB: <...>
- Deploy: <...>

## NGÔN NGỮ
- Code/comment: <Vietnamese / English>
- Commit message: <format>
- User-facing UI: <ngôn ngữ>

## QUYỀN HẠN AI
- Tự làm: <list>
- Xin phép: <list>
- CẤM: <list>

## DEFINE "DONE"
<từ buổi 1>

## WORKFLOW
<commit/push/deploy>

## DECISION LOG
| Date | Quyết định | Lý do |
|---|---|---|
| | | |
```

---

## 7. Khi qua dự án mới — checklist 5 phút đầu

```
[ ] Copy docs/TEST_PROTOCOL.md từ Trao Tay (hoặc dự án trước)
[ ] Copy docs/PROJECT_KICKOFF.md (file này)
[ ] AI hỏi 7 câu §2.1
[ ] User trả lời 7 câu (có gì viết nấy, không cần hoàn hảo)
[ ] AI tạo skeleton (§2.2)
[ ] 2 bên chốt quyền hạn AI (§3.3)
[ ] AI tạo memory đầu (§2.4)
[ ] Chạy 1 task pilot (§4)
[ ] Đóng buổi: AI tóm tắt + tự push commit kickoff
```

Buổi 1 nên xong trong **1-2 giờ**. Nếu tới 4 giờ vẫn còn lằng nhằng — dừng, simplify, làm task pilot trước, gọt sau.
