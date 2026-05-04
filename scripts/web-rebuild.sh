#!/bin/bash
# Rebuild Next.js web static export trên production.
# Chạy qua cron mỗi giờ để pre-render bài đăng + user mới vào sitemap/static HTML.
# Build mất ~30-60s tùy số lượng post (cap 2000 mỗi loại).

set -e

LOG_FILE="/var/log/traotay-web-rebuild.log"
REPO_DIR="/opt/traotay/repo"
WEB_DIR="$REPO_DIR/web"

log() {
  echo "[$(date -Iseconds)] $*" | tee -a "$LOG_FILE"
}

log "=== Web rebuild start ==="

cd "$REPO_DIR"

# Pull code mới (nếu có)
git pull --quiet 2>&1 | tee -a "$LOG_FILE" || {
  log "WARN: git pull failed — continue với code hiện tại"
}

cd "$WEB_DIR"

# Install deps nếu package.json đã đổi (idempotent — npm ci nhanh khi node_modules đúng)
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules/.package-lock.json" ]; then
  log "Installing deps..."
  npm install --no-audit --no-fund --quiet 2>&1 | tee -a "$LOG_FILE"
fi

# Build
log "Running next build..."
START=$(date +%s)
if npx next build 2>&1 | tee -a "$LOG_FILE"; then
  ELAPSED=$(($(date +%s) - START))
  PAGE_COUNT=$(find out -name "*.html" 2>/dev/null | wc -l)
  log "✓ Build success in ${ELAPSED}s — $PAGE_COUNT HTML pages"
else
  log "✗ Build FAILED — out/ giữ nguyên bản cũ"
  exit 1
fi

# Nginx serve trực tiếp out/ — không cần reload (no-cache cho HTML/.txt files)
log "=== Web rebuild done ==="
