#!/usr/bin/env bash
# Hook UserPromptSubmit — inject reminder khi user prompt chứa từ khóa deploy.
# Output stdout sẽ được thêm vào context (theo Claude Code hook protocol).

input=$(cat)
prompt=$(echo "$input" | grep -oE '"prompt"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"prompt"[[:space:]]*:[[:space:]]*"\(.*\)"/\1/')

# Detect deploy/production keywords
if ! echo "$prompt" | grep -qiE 'deploy|production|go.?live|push.*server|release|migration'; then
  exit 0
fi

cat <<EOF
[Auto-injected by inject-deploy-reminder.sh]

User prompt mention deploy/production. BẮT BUỘC tuân thủ:

1. TEST_PROTOCOL §4 — checklist verify production:
   - Container started? curl /health 200?
   - Logs sạch errors trong 2 phút sau restart?
   - Schema sync nếu có change? (prisma db push + verify table tồn tại)
   - Smoke test endpoint vừa change (curl + parse response)
   - Rollback plan đã sẵn sàng?

2. Nếu schema thay đổi: cần ADR mới (docs/adr/NNNN-*.md) + db push prod.

3. Sau deploy: postmortem nếu có incident (docs/postmortems/).

4. Update RISK_REGISTER nếu phát hiện risk mới qua deploy này.

KHÔNG báo "deploy xong" cho hoàng thượng cho đến khi qua đủ checklist trên.
EOF
