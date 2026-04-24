#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
# init-cert.sh — Xin Let's Encrypt cert lần đầu cho 3 subdomain
#
# Chạy 1 lần sau khi:
#   1. DNS đã trỏ traotay.com.vn / api / s3 / www về IP VPS
#   2. Nginx đã start với config HTTP-only (tạm chưa có cert)
#
# Sau lần đầu, certbot tự renew qua cron (systemd timer).
# ══════════════════════════════════════════════════════════════════

set -euo pipefail

EMAIL="admin@traotay.com.vn"
DOMAINS=(
  "traotay.com.vn"
  "www.traotay.com.vn"
  "api.traotay.com.vn"
  "s3.traotay.com.vn"
)

# Cài certbot nếu chưa có
if ! command -v certbot &> /dev/null; then
  echo ">>> Cài certbot..."
  sudo apt-get update
  sudo apt-get install -y certbot python3-certbot-nginx
fi

# Tạo webroot cho ACME challenge
sudo mkdir -p /var/www/certbot

# Build args -d cho từng domain
D_ARGS=""
for d in "${DOMAINS[@]}"; do
  D_ARGS="$D_ARGS -d $d"
done

echo ">>> Xin cert Let's Encrypt cho: ${DOMAINS[*]}"
sudo certbot certonly \
  --webroot -w /var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  --non-interactive \
  --expand \
  $D_ARGS

# Test auto-renew (không reload nginx)
echo ""
echo ">>> Test auto-renew..."
sudo certbot renew --dry-run

# Reload Nginx để load cert mới
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "✅ SSL đã setup. Cert tự renew qua systemd timer certbot."
echo "   Kiểm tra: systemctl list-timers | grep certbot"
