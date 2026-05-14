#!/usr/bin/env node
/**
 * Generate Play Store listing screenshots từ raw app screenshots.
 *
 * Input: web/public/assets/screen-{home,search,detail,chat}.png (1240x2772)
 * Output: web/public/assets/playstore/screen-{N}-{slug}.png (1080x1920, 9:16)
 *
 * Layout cho mỗi screenshot:
 * - Background gradient emerald (brand color)
 * - Caption banner TOP 240px với title + slogan
 * - Screenshot phone (resized fit 720x1480) center-bottom với drop shadow
 * - "Trao Tay" footer brand mark
 *
 * Run: node scripts/generate-playstore-screenshots.mjs
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(__dirname, "..", "public", "assets");
const OUT_DIR = join(ASSETS_DIR, "playstore");

const W = 1080;
const H = 1920;
const PHONE_W = 720;
const PHONE_H = 1440; // fit ~ 9:18 phone aspect (modern)
const PADDING_TOP = 240; // caption banner area

const screenshots = [
  {
    src: "screen-home.png",
    out: "01-home.png",
    title: "Đồ cũ người này",
    subtitle: "Báu vật người kia",
  },
  {
    src: "screen-search.png",
    out: "02-search.png",
    title: "Lọc theo tỉnh/quận",
    subtitle: "Nhận đồ gần nhà trong ngày",
  },
  {
    src: "screen-detail.png",
    out: "03-detail.png",
    title: "Đăng 1 phút thật sự",
    subtitle: "Không ép xác minh CMND",
  },
  {
    src: "screen-chat.png",
    out: "04-chat.png",
    title: "Chat realtime",
    subtitle: "Thông báo đẩy trong vài giây",
  },
];

function escapeXml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildBackgroundSvg(title, subtitle) {
  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#047857"/>
        <stop offset="100%" stop-color="#065F46"/>
      </linearGradient>
      <filter id="shadow">
        <feGaussianBlur in="SourceAlpha" stdDeviation="20"/>
        <feOffset dx="0" dy="12"/>
        <feComponentTransfer><feFuncA type="linear" slope="0.4"/></feComponentTransfer>
        <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>

    <!-- Caption banner -->
    <text x="${W / 2}" y="120" font-family="Be Vietnam Pro, sans-serif" font-size="62" font-weight="800" fill="#FFFFFF" text-anchor="middle">${escapeXml(title)}</text>
    <text x="${W / 2}" y="195" font-family="Be Vietnam Pro, sans-serif" font-size="38" font-weight="400" fill="#FCD34D" text-anchor="middle">${escapeXml(subtitle)}</text>

    <!-- Brand footer -->
    <text x="${W / 2}" y="${H - 60}" font-family="Be Vietnam Pro, sans-serif" font-size="32" font-weight="700" fill="#FFFFFF" text-anchor="middle" opacity="0.92">Trao Tay — traotay.com.vn</text>
  </svg>`;
}

async function generate(spec) {
  const srcPath = join(ASSETS_DIR, spec.src);
  const outPath = join(OUT_DIR, spec.out);

  // 1. Background gradient + text overlay
  const bgSvg = buildBackgroundSvg(spec.title, spec.subtitle);
  const bg = sharp(Buffer.from(bgSvg));

  // 2. Phone screenshot — resize giữ ratio, fit vào box PHONE_W x PHONE_H
  const phone = await sharp(srcPath)
    .resize({ width: PHONE_W, height: PHONE_H, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const phoneMeta = await sharp(phone).metadata();

  // 3. Round corners cho phone screenshot
  const cornerMask = `<svg width="${phoneMeta.width}" height="${phoneMeta.height}">
    <rect x="0" y="0" width="${phoneMeta.width}" height="${phoneMeta.height}" rx="40" ry="40" fill="white"/>
  </svg>`;
  const phoneRounded = await sharp(phone)
    .composite([{ input: Buffer.from(cornerMask), blend: "dest-in" }])
    .png()
    .toBuffer();

  // 4. Composite — phone căn giữa, cách top PADDING_TOP
  const phoneTop = PADDING_TOP + 20;
  const phoneLeft = Math.floor((W - phoneMeta.width) / 2);

  await bg
    .composite([{ input: phoneRounded, top: phoneTop, left: phoneLeft }])
    .png()
    .toFile(outPath);

  console.log(`[playstore] ${spec.out} → ${W}x${H}`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`[playstore] Output dir: ${OUT_DIR}`);
  for (const spec of screenshots) {
    await generate(spec);
  }
  console.log(`[playstore] Done — ${screenshots.length} screenshots ready for Play Store upload`);
}

main().catch((e) => {
  console.error("[playstore] Fatal:", e);
  process.exit(1);
});
