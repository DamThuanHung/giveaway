#!/usr/bin/env bash
# Layer 2 — Cross-AI review của session log Claude.
# Gửi sample interactions sang AI khác (Gemini/OpenAI) để independent grade.
#
# Cần env: OPENAI_API_KEY hoặc GEMINI_API_KEY
# Run: bash scripts/cross-ai-review.sh <session-log.json>

set -e

SESSION_LOG="${1:-}"
if [ -z "$SESSION_LOG" ] || [ ! -f "$SESSION_LOG" ]; then
  echo "Usage: $0 <session-log.json>"
  echo ""
  echo "Session log file (JSON) chứa AI interactions để review."
  echo "Format expected: array of { prompt, response, timestamp }."
  exit 1
fi

# Detect available API
if [ -n "$OPENAI_API_KEY" ]; then
  PROVIDER="openai"
elif [ -n "$GEMINI_API_KEY" ]; then
  PROVIDER="gemini"
else
  echo "❌ Cần OPENAI_API_KEY hoặc GEMINI_API_KEY trong env"
  exit 1
fi

REVIEW_PROMPT=$(cat <<'EOF'
You are a code review AI. Review the following Claude AI session and grade
it on these criteria from `docs/standards/AI_WORKING_RULES.md`:

1. **Test discipline** (1-5): Did Claude self-test before claiming done?
2. **EQ rules** (1-5): Acknowledge user frustration before tech detail?
3. **Long-term thinking** (1-5): Propose long-term solutions vs quick wins?
4. **Tool discipline** (1-5): Self-do when capable, ask only when needed?
5. **Code quality** (1-5): No over-engineering, comment policy correct?
6. **Communication** (1-5): One fix one focus, no lan man?

For each: score 1-5, brief justification, evidence quote if applicable.

Then overall score (1-5) and 3 specific improvement suggestions.

Output JSON:
{
  "scores": {
    "test_discipline": { "score": N, "reason": "...", "evidence": "..." },
    ...
  },
  "overall_score": N,
  "suggestions": ["...", "...", "..."]
}
EOF
)

# Sample 5 random interactions
SAMPLE=$(jq -c '. | shuffle | .[:5]' "$SESSION_LOG" 2>/dev/null || echo "[]")
if [ "$SAMPLE" = "[]" ]; then
  echo "❌ Không parse được session log JSON"
  exit 1
fi

# Call API
if [ "$PROVIDER" = "openai" ]; then
  RESPONSE=$(curl -sS https://api.openai.com/v1/chat/completions \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$(jq -n \
      --arg prompt "$REVIEW_PROMPT" \
      --argjson sample "$SAMPLE" \
      '{
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: $prompt },
          { role: "user", content: ($sample | tostring) }
        ],
        response_format: { type: "json_object" }
      }')")
  REVIEW=$(echo "$RESPONSE" | jq -r '.choices[0].message.content')
elif [ "$PROVIDER" = "gemini" ]; then
  RESPONSE=$(curl -sS "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$GEMINI_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$(jq -n \
      --arg prompt "$REVIEW_PROMPT" \
      --argjson sample "$SAMPLE" \
      '{
        contents: [{
          parts: [
            { text: $prompt },
            { text: ($sample | tostring) }
          ]
        }],
        generationConfig: { responseMimeType: "application/json" }
      }')")
  REVIEW=$(echo "$RESPONSE" | jq -r '.candidates[0].content.parts[0].text')
fi

# Save review
TODAY=$(date +%Y-%m-%d)
OUTPUT_DIR="docs/audits/cross-ai"
mkdir -p "$OUTPUT_DIR"
OUTPUT_FILE="$OUTPUT_DIR/$TODAY-$PROVIDER-review.json"
echo "$REVIEW" > "$OUTPUT_FILE"

echo "✅ Cross-AI review saved: $OUTPUT_FILE"
echo ""
echo "Summary:"
echo "$REVIEW" | jq -r '
  "Overall: \(.overall_score)/5",
  "Test: \(.scores.test_discipline.score)/5",
  "EQ: \(.scores.eq_rules.score)/5",
  "Long-term: \(.scores.long_term_thinking.score)/5",
  "Tool: \(.scores.tool_discipline.score)/5",
  "Code: \(.scores.code_quality.score)/5",
  "Comm: \(.scores.communication.score)/5",
  "",
  "Suggestions:",
  (.suggestions[] | "- \(.)")
' 2>/dev/null || cat "$OUTPUT_FILE"
