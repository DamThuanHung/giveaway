#!/bin/bash
# Rebuild Next.js web static export trên production.
# Chạy qua cron mỗi giờ để pre-render bài đăng + user mới vào sitemap/static HTML.
# Build mất ~30-60s tùy số lượng post (cap 2000 mỗi loại).

set -e
set -o pipefail  # quan trọng: tee không che lỗi npx/npm

LOG_FILE="/var/log/traotay-web-rebuild.log"
REPO_DIR="/opt/traotay/repo"
WEB_DIR="$REPO_DIR/web"

# Cron PATH thường thiếu /usr/bin/node — đảm bảo node tìm thấy
export PATH="/usr/bin:/usr/local/bin:$PATH"

log() {
  echo "[$(date -Iseconds)] $*" | tee -a "$LOG_FILE"
}

log "=== Web rebuild start ==="

# Verify node có thật, fail sớm nếu thiếu
if ! command -v node >/dev/null; then
  log "✗ FATAL: node not found in PATH ($PATH)"
  exit 1
fi
log "node: $(node --version), npm: $(npm --version)"

cd "$REPO_DIR"

# Pull code mới (nếu có)
git pull --quiet 2>&1 | tee -a "$LOG_FILE" || {
  log "WARN: git pull failed — continue với code hiện tại"
}

cd "$WEB_DIR"

# Always run npm install — idempotent, fast khi node_modules đã sync.
# Trước đây skip → nhưng node_modules có thể stale (vd thiếu dep mới như socket.io-client).
log "Syncing deps (npm install)..."
npm install --no-audit --no-fund --quiet 2>&1 | tee -a "$LOG_FILE"

# Build — capture exit code trực tiếp, KHÔNG dựa pipefail vì cron shell hành vi khác nhau.
log "Running next build..."
START=$(date +%s)
set +e  # tạm tắt exit-on-error để capture exit code
npx next build 2>&1 | tee -a "$LOG_FILE"
BUILD_EXIT=${PIPESTATUS[0]}
set -e

if [ "$BUILD_EXIT" != "0" ]; then
  log "✗ Build FAILED (exit $BUILD_EXIT) — out/ giữ nguyên bản trước"
  exit 1
fi

# Defensive: verify out/index.html
if [ ! -f "out/index.html" ]; then
  log "✗ Build báo OK nhưng out/index.html không có"
  exit 1
fi

ELAPSED=$(($(date +%s) - START))
PAGE_COUNT=$(find out -name "*.html" 2>/dev/null | wc -l)
log "✓ Build success in ${ELAPSED}s — $PAGE_COUNT HTML pages"

# Generate OG images cho mỗi post — pre-render banner cho social share
# Tham khảo web/scripts/generate-og-images.mjs (web-first acquisition phase 1).
# Fail soft: nếu OG generation lỗi, HTML vẫn serve được, og:image fallback raw.
log "Generating OG images..."
OG_START=$(date +%s)
set +e
node scripts/generate-og-images.mjs 2>&1 | tee -a "$LOG_FILE"
OG_EXIT=${PIPESTATUS[0]}
set -e
OG_ELAPSED=$(($(date +%s) - OG_START))
if [ "$OG_EXIT" != "0" ]; then
  log "WARN: OG image generation failed (exit $OG_EXIT) — pages vẫn build OK, share preview dùng raw image fallback"
else
  OG_COUNT=$(find out/og -name "*.png" 2>/dev/null | wc -l)
  log "✓ OG generated in ${OG_ELAPSED}s — $OG_COUNT banners"
fi

# Nginx serve trực tiếp out/ — không cần reload (no-cache cho HTML/.txt files)
log "=== Web rebuild done ==="
