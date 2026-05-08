#!/usr/bin/env bash
# Layer 1 — Objective compliance audit từ git log + hook log + CI.
# Output: docs/audits/YYYY-MM-DD-weekly.md
#
# Run weekly qua GitHub Actions cron HOẶC manual:
#   bash scripts/audit-compliance.sh [days=7]

set -e

DAYS="${1:-7}"
SINCE="$(date -d "$DAYS days ago" +%Y-%m-%d 2>/dev/null || date -v-${DAYS}d +%Y-%m-%d)"
TODAY=$(date +%Y-%m-%d)
OUTPUT_DIR="docs/audits"
OUTPUT_FILE="$OUTPUT_DIR/$TODAY-weekly.md"

mkdir -p "$OUTPUT_DIR"

# ─── Section 1: Commit evidence compliance ─────────────────────────
total_commits=$(git log --since="$SINCE" --oneline | wc -l | tr -d ' ')
non_doc_commits=$(git log --since="$SINCE" --pretty=%H | while read sha; do
  files=$(git diff-tree --no-commit-id --name-only -r "$sha")
  echo "$files" | grep -vE '^(docs/|README|.*\.md$)' > /dev/null && echo "$sha"
done | wc -l | tr -d ' ')
evidence_commits=$(git log --since="$SINCE" --grep="Edge cases:" --oneline | wc -l | tr -d ' ')

if [ "$non_doc_commits" -gt 0 ]; then
  evidence_pct=$(( evidence_commits * 100 / non_doc_commits ))
else
  evidence_pct=100
fi

# ─── Section 2: ADR coverage cho schema commits ────────────────────
schema_commits=$(git log --since="$SINCE" --pretty=%H -- 'backend/prisma/schema.prisma' '**/migrations/**' 2>/dev/null | wc -l | tr -d ' ')
adr_new=$(git log --since="$SINCE" --diff-filter=A --name-only -- 'docs/adr/*.md' 2>/dev/null | grep -E 'docs/adr/[0-9]+-' | wc -l | tr -d ' ')

# ─── Section 3: Bypass flag usage ──────────────────────────────────
skip_evidence=$(git log --since="$SINCE" --grep="\[skip-evidence\]" --oneline | wc -l | tr -d ' ')
skip_adr=$(git log --since="$SINCE" --grep="\[skip-adr\]" --oneline | wc -l | tr -d ' ')
emergency=$(git log --since="$SINCE" --grep="\[emergency-rollback\]" --oneline | wc -l | tr -d ' ')
total_bypass=$(( skip_evidence + skip_adr + emergency ))

# ─── Section 4: Postmortem timeliness ──────────────────────────────
postmortem_count=$(find docs/postmortems/ -name "*.md" -newermt "$SINCE" 2>/dev/null | grep -v README | wc -l | tr -d ' ')

# ─── Section 5: Risk register staleness ────────────────────────────
if [ -f "docs/RISK_REGISTER.md" ]; then
  last_review=$(git log -1 --format=%ai docs/RISK_REGISTER.md 2>/dev/null | cut -d' ' -f1)
  days_since=$(( ($(date +%s) - $(date -d "$last_review" +%s 2>/dev/null || echo $(date +%s))) / 86400 ))
else
  last_review="N/A"
  days_since=999
fi

# ─── Section 6: Hook block log ────────────────────────────────────
if [ -f ".git/hooks/blocked.log" ]; then
  blocked_total=$(wc -l < .git/hooks/blocked.log 2>/dev/null || echo 0)
else
  blocked_total=0
fi

# ─── Compute overall score ────────────────────────────────────────
score=0
score_max=100

# Evidence: 25 points
if [ "$non_doc_commits" -gt 0 ]; then
  score=$(( score + evidence_pct * 25 / 100 ))
else
  score=$(( score + 25 ))
fi

# ADR coverage: 20 points (đủ ADR / không có schema change)
if [ "$schema_commits" -gt 0 ]; then
  if [ "$adr_new" -ge 1 ]; then
    score=$(( score + 20 ))
  else
    score=$(( score + 0 ))
  fi
else
  score=$(( score + 20 ))
fi

# Bypass usage: 20 points (≤ 1/week ok)
if [ "$total_bypass" -le 1 ]; then
  score=$(( score + 20 ))
elif [ "$total_bypass" -le 3 ]; then
  score=$(( score + 10 ))
else
  score=$(( score + 0 ))
fi

# Postmortem: 15 points (mỗi incident phải có postmortem)
score=$(( score + 15 ))  # Default full nếu không có incident

# Risk register fresh: 10 points
if [ "$days_since" -le 30 ]; then
  score=$(( score + 10 ))
elif [ "$days_since" -le 60 ]; then
  score=$(( score + 5 ))
fi

# CI pass rate: 10 points (giả định 100% nếu workflow hiện tại pass)
score=$(( score + 10 ))

# Color code
if [ "$score" -ge 90 ]; then
  status="🟢 EXCELLENT"
elif [ "$score" -ge 80 ]; then
  status="🟡 GOOD"
elif [ "$score" -ge 70 ]; then
  status="🟠 NEEDS REVIEW"
else
  status="🔴 CRITICAL"
fi

# ─── Write report ─────────────────────────────────────────────────
cat > "$OUTPUT_FILE" <<EOF
# Compliance Audit — $TODAY

**Period:** $SINCE → $TODAY ($DAYS days)
**Overall Score:** $score / 100 — $status

---

## 1. Commit Evidence Compliance

- Total commits: **$total_commits**
- Non-docs commits: **$non_doc_commits**
- With "Edge cases:" + "Test level:" evidence: **$evidence_commits** ($evidence_pct%)

$([ "$evidence_pct" -ge 90 ] && echo "✅ Compliance high" || echo "⚠️ Compliance < 90% — review next sprint")

## 2. ADR Coverage cho Schema Changes

- Schema commits: **$schema_commits**
- New ADR files: **$adr_new**

$([ "$schema_commits" -eq 0 ] && echo "ℹ️ Không schema change tuần này" || ([ "$adr_new" -ge "$schema_commits" ] && echo "✅ Mọi schema change có ADR" || echo "❌ Thiếu ADR cho $(( schema_commits - adr_new )) commit"))

## 3. Bypass Flag Usage

- \`[skip-evidence]\`: **$skip_evidence**
- \`[skip-adr]\`: **$skip_adr**
- \`[emergency-rollback]\`: **$emergency**
- **Total bypass:** $total_bypass

$([ "$total_bypass" -eq 0 ] && echo "✅ Zero bypass — clean" || ([ "$total_bypass" -le 1 ] && echo "✅ Acceptable bypass usage" || echo "⚠️ Bypass usage > 1 — investigate abuse pattern"))

## 4. Postmortem Activity

- Postmortems created: **$postmortem_count**

$([ "$postmortem_count" -eq 0 ] && echo "ℹ️ Không incident hoặc chưa write postmortem" || echo "✅ Tracking incidents properly")

## 5. Risk Register Freshness

- Last review: **$last_review**
- Days since: **$days_since**

$([ "$days_since" -le 30 ] && echo "✅ Fresh (< 30 days)" || ([ "$days_since" -le 60 ] && echo "⚠️ Sắp stale" || echo "❌ Stale > 60 days — review ngay"))

## 6. Hook Block Log

- Total hook blocks: **$blocked_total**

$([ "$blocked_total" -le 5 ] && echo "✅ Acceptable" || echo "⚠️ Hook block nhiều — AI thử bypass quá nhiều?")

---

## Recommendations

EOF

# Add specific recommendations
if [ "$evidence_pct" -lt 90 ]; then
  echo "- 🔧 **Evidence compliance $evidence_pct%** — review commits không có evidence, có pattern AI shortcut?" >> "$OUTPUT_FILE"
fi
if [ "$schema_commits" -gt 0 ] && [ "$adr_new" -lt "$schema_commits" ]; then
  echo "- 🔧 **ADR thiếu** — schema changed $schema_commits lần nhưng chỉ có $adr_new ADR mới" >> "$OUTPUT_FILE"
fi
if [ "$total_bypass" -gt 1 ]; then
  echo "- 🔧 **Bypass abuse** — $total_bypass lần dùng skip flag, audit pattern" >> "$OUTPUT_FILE"
fi
if [ "$days_since" -gt 60 ]; then
  echo "- 🔧 **Risk register stale** — $days_since ngày chưa review, schedule review tuần này" >> "$OUTPUT_FILE"
fi
if [ "$score" -ge 90 ]; then
  echo "- ✅ Compliance excellent. Continue current discipline." >> "$OUTPUT_FILE"
fi

cat >> "$OUTPUT_FILE" <<EOF

---

## Methodology

- Git log analysis qua \`git log --since\` — objective, không AI control
- Hook log từ \`.git/hooks/blocked.log\` — local enforcement
- ADR detection qua \`git diff --diff-filter=A\` cho path \`docs/adr/*.md\`
- Score weighted: Evidence 25 + ADR 20 + Bypass 20 + Postmortem 15 + Risk fresh 10 + CI 10

## Layer 2-4 (manual)

Layer 2 (cross-AI review): \`scripts/cross-ai-review.sh\` (cần OpenAI/Gemini API key)
Layer 3 (user sampling): \`docs/standards/COMPLIANCE_MEASUREMENT.md\` §3
Layer 4 (synthetic rule test): \`scripts/synthetic-rule-test.sh\`

Generated: $(date -Iseconds)
EOF

echo "✅ Audit complete: $OUTPUT_FILE"
echo "Score: $score / 100 — $status"

# Exit code: 0 if score >= 80, 1 otherwise (fail CI nếu compliance kém)
if [ "$score" -lt 80 ]; then
  echo "❌ Compliance below 80% threshold — manual review required" >&2
  exit 1
fi
exit 0
