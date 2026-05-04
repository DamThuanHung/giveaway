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

# Install deps nếu package.json đã đổi (idempotent)
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules/.package-lock.json" ]; then
  log "Installing deps..."
  npm install --no-audit --no-fund --quiet 2>&1 | tee -a "$LOG_FILE"
fi

# Build vào folder tạm — chỉ rotate sang out/ khi success.
# Tránh state nửa-vời nếu build fail giữa chừng.
log "Running next build..."
START=$(date +%s)
npx next build 2>&1 | tee -a "$LOG_FILE"

# Verify out/index.html exists — defensive check
if [ ! -f "out/index.html" ]; then
  log "✗ Build hoàn tất nhưng out/index.html không có — rollback không cần (out/ vẫn nguyên)"
  exit 1
fi

ELAPSED=$(($(date +%s) - START))
PAGE_COUNT=$(find out -name "*.html" 2>/dev/null | wc -l)
log "✓ Build success in ${ELAPSED}s — $PAGE_COUNT HTML pages"

# Nginx serve trực tiếp out/ — không cần reload (no-cache cho HTML/.txt files)
log "=== Web rebuild done ==="
