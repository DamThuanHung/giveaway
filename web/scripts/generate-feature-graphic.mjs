#!/usr/bin/env node
/**
 * Generate Play Store Feature Graphic 1024×500.
 *
 * Output: web/public/assets/playstore/feature-graphic.png
 *
 * Required asset cho Production submit. Hiển thị top of Play Store
 * listing page, là yếu tố visual lớn nhất.
 *
 * Layout:
 * - Background gradient emerald (#047857 → #065F46)
 * - Logo 🎁 trái + brand name "Trao Tay"
 * - Tagline "Đồ cũ người này, Báu vật người kia" giữa
 * - URL traotay.com.vn footer phải
 *
 * Run: cd web && node scripts/generate-feature-graphic.mjs
 */
import { writeFile, mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(__dirname, "..", "public", "assets");
const OUT_PATH = join(ASSETS_DIR, "playstore", "feature-graphic.png");

const W = 1024;
const H = 500;

function buildSvg() {
  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#047857"/>
        <stop offset="100%" stop-color="#065F46"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>

    <!-- Brand name + emoji icon (top-left) -->
    <text x="80" y="110" font-family="Be Vietnam Pro, sans-serif" font-size="56" font-weight="800" fill="#FFFFFF">🎁 Trao Tay</text>

    <!-- Tagline (center) -->
    <text x="${W / 2}" y="260" font-family="Be Vietnam Pro, sans-serif" font-size="48" font-weight="700" fill="#FFFFFF" text-anchor="middle">Đồ cũ người này,</text>
    <text x="${W / 2}" y="325" font-family="Be Vietnam Pro, sans-serif" font-size="48" font-weight="700" fill="#FCD34D" text-anchor="middle">Báu vật người kia</text>

    <!-- Sub-tagline -->
    <text x="${W / 2}" y="385" font-family="Be Vietnam Pro, sans-serif" font-size="26" font-weight="400" fill="#FFFFFF" text-anchor="middle" opacity="0.92">Chợ đồ cũ và trao tặng miễn phí giữa người Việt</text>

    <!-- URL footer (bottom-right) -->
    <text x="${W - 80}" y="${H - 50}" font-family="Be Vietnam Pro, sans-serif" font-size="24" font-weight="600" fill="#FFFFFF" text-anchor="end" opacity="0.85">traotay.com.vn</text>
  </svg>`;
}

async function main() {
  await mkdir(dirname(OUT_PATH), { recursive: true });
  const svg = buildSvg();
  await sharp(Buffer.from(svg)).png().toFile(OUT_PATH);
  console.log(`[feature-graphic] Generated ${OUT_PATH} → ${W}x${H}`);
}

main().catch((e) => {
  console.error("[feature-graphic] Fatal:", e);
  process.exit(1);
});
