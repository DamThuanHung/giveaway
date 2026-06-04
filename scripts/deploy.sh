#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════
# deploy.sh — Deploy code mới lên VPS
#
# Chạy trên VPS (sau khi SSH vào):
#   cd /opt/traotay && ./scripts/deploy.sh
#
# Hoặc từ máy local (qua SSH):
#   ssh traotay@<VPS_IP> "cd /opt/traotay && ./scripts/deploy.sh"
#
# Thao tác:
#   1. git pull
#   2. Prisma migrate deploy (nếu có migration mới)
#   3. Rebuild backend image
#   4. Restart backend (không tắt DB/MinIO)
#   5. Smoke test health
# ══════════════════════════════════════════════════════════════════

set -euo pipefail

cd "$(dirname "$0")/.."

echo ">>> [1/5] Pull code mới từ origin/main..."
git fetch origin
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)
if [ "$LOCAL" = "$REMOTE" ]; then
  echo "    Đã up-to-date, không có commit mới."
else
  echo "    $LOCAL → $REMOTE"
  git pull --ff-only origin main
fi

echo ""
echo ">>> [2/5] Prisma migrate deploy..."
docker compose -f docker-compose.prod.yml exec -T backend \
  npx prisma migrate deploy || {
  echo "    Backend chưa start — skip migration, sẽ chạy sau khi start"
}

echo ""
echo ">>> [3/5] Rebuild backend image..."
docker compose -f docker-compose.prod.yml build backend

echo ""
echo ">>> [4/5] Restart backend (DB + MinIO giữ nguyên)..."
docker compose -f docker-compose.prod.yml up -d --no-deps --force-recreate backend

echo ""
echo ">>> [5/5] Chờ backend healthy..."
sleep 5
for i in {1..12}; do
  if curl -fsS http://127.0.0.1:3800/ > /dev/null 2>&1; then
    echo "    ✅ Backend ready"
    break
  fi
  echo "    Đang chờ... ($i/12)"
  sleep 5
done

# Chạy migration lần 2 (lần 1 có thể fail nếu backend chưa start)
docker compose -f docker-compose.prod.yml exec -T backend \
  npx prisma migrate deploy

echo ""
echo "✅ Deploy xong. Commit: $(git rev-parse --short HEAD)"
echo "   Logs: docker compose -f docker-compose.prod.yml logs -f backend"
