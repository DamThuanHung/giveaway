# ══════════════════════════════════════════════════════════════════
# Multi-stage build — giảm final image từ ~1GB xuống ~300MB
# Stage 1: build (install devDeps, compile TS, generate Prisma)
# Stage 2: runtime (chỉ prod deps + dist + prisma client)
# ══════════════════════════════════════════════════════════════════

# ─── Stage 1: Builder ────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .
# Prisma generate cần DATABASE_URL nhưng không kết nối thật → dummy OK
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate
RUN npm run build

# Prune devDependencies để copy sang runtime stage
RUN npm prune --production

# ─── Stage 2: Runtime ────────────────────────────────────────────────
FROM node:20-alpine AS runtime

WORKDIR /app

# Commit SHA lúc build — expose qua GET /health để verify container đang chạy
# code mới nhất, không phải so sánh thủ công timestamp Created (không tin cậy).
ARG GIT_SHA=unknown
ENV GIT_SHA=$GIT_SHA

# Chỉ copy những gì cần để chạy production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./
# Copy public/ — chứa admin.html (panel quản trị) + privacy-policy.html.
# Backend main.ts useStaticAssets('public') để serve / paths.
# Trước đây không copy → admin.html 404 trên production.
COPY --from=builder /app/public ./public

# Non-root user cho security (Docker best practice)
RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 3800

# Migration qua deploy script (prisma migrate deploy), không auto push
CMD ["node", "dist/src/main"]
