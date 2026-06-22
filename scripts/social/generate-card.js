#!/usr/bin/env node
/**
 * Sinh ảnh "quote card" thương hiệu Trao Tay cho mỗi caption marketing,
 * upload lên MinIO (bucket dùng chung với backend) để có URL public —
 * Facebook/Instagram/Threads cần URL ảnh public để đăng kèm ảnh.
 *
 * Idempotent: nếu ảnh cho 1 caption đã tồn tại trên MinIO, không render lại.
 *
 * Usage:
 *   node scripts/social/generate-card.js --test    # render 1 ảnh mẫu ra file local, không cần MinIO
 *   require('./generate-card').getOrCreateCardUrl(file, captionText)
 */

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const satori = require('satori').default;
const { Resvg } = require('@resvg/resvg-js');
const Minio = require('minio');

// ─── Load env (FB/IG/Threads token từ .env riêng + MINIO_* từ .env.docker gốc repo) ──

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  fs.readFileSync(file, 'utf8')
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('#'))
    .forEach(line => {
      const [key, ...rest] = line.split('=');
      if (key && rest.length && !process.env[key.trim()]) {
        process.env[key.trim()] = rest.join('=').trim();
      }
    });
}
loadEnvFile(path.join(__dirname, '.env'));
loadEnvFile(path.join(__dirname, '..', '..', '.env.docker'));

// ─── Card render (satori + resvg, tái dùng pattern từ web/scripts/generate-og-images.mjs) ──

const SIZE = 1080;
const SLOGAN = 'Đồ cũ người này, Báu vật người kia';
const FONT_DIR = path.join(__dirname, '..', '..', 'web', 'public', 'fonts');

let fontsCache = null;
async function getFonts() {
  if (fontsCache) return fontsCache;
  const [regular, bold] = await Promise.all([
    fsp.readFile(path.join(FONT_DIR, 'BeVietnamPro-Regular.ttf')),
    fsp.readFile(path.join(FONT_DIR, 'BeVietnamPro-Bold.ttf')),
  ]);
  fontsCache = [
    { name: 'Be Vietnam Pro', data: regular, weight: 400, style: 'normal' },
    { name: 'Be Vietnam Pro', data: bold, weight: 700, style: 'normal' },
  ];
  return fontsCache;
}

function truncate(s, max) {
  return s.length > max ? s.slice(0, max - 1).trim() + '…' : s;
}

// Rút "hook" — bullet USP đầu tiên trong caption (dòng ngay trước block bullet
// kết thúc bằng dòng slogan). Đây là dòng đặc trưng riêng cho từng chủ đề,
// khác với chào đầu/link vốn giống nhau ở mọi caption.
function extractHook(captionText) {
  const lines = captionText.split('\n').map(l => l.trimEnd());
  const sloganIdx = lines.findIndex(l => l.includes(SLOGAN));
  if (sloganIdx !== -1) {
    let end = sloganIdx - 1;
    while (end >= 0 && lines[end].trim() === '') end--;
    let start = end;
    while (start >= 0 && lines[start].trim() !== '') start--;
    start++;
    if (start <= end) {
      const firstBullet = lines[start].trim();
      const spaceIdx = firstBullet.indexOf(' ');
      const hook = (spaceIdx === -1 ? firstBullet : firstBullet.slice(spaceIdx + 1)).trim();
      if (hook) return truncate(hook, 100);
    }
  }
  // Fallback: dòng thứ 2 không rỗng (câu mở vấn đề, sau dòng chào đầu)
  const nonEmpty = lines.filter(l => l.trim() !== '');
  if (nonEmpty.length > 1) return truncate(nonEmpty[1].trim(), 100);
  return 'Đồ cũ người này, Báu vật người kia';
}

function cardTemplate(hookText) {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: `${SIZE}px`,
        height: `${SIZE}px`,
        padding: '80px 90px',
        background: '#FFFBF5',
        fontFamily: 'Be Vietnam Pro',
      },
      children: [
        // brand badge
        {
          type: 'div',
          props: {
            style: { display: 'flex', alignItems: 'center', gap: '16px' },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '64px',
                    height: '64px',
                    borderRadius: '9999px',
                    background: '#10B981',
                    fontSize: '32px',
                  },
                  children: '🎁',
                },
              },
              {
                type: 'div',
                props: {
                  style: { fontSize: '34px', fontWeight: 700, color: '#047857' },
                  children: 'Trao Tay',
                },
              },
            ],
          },
        },
        // hook + slogan
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', gap: '28px' },
            children: [
              {
                type: 'div',
                props: {
                  style: { fontSize: '56px', fontWeight: 700, color: '#1A1A2E', lineHeight: 1.3 },
                  children: hookText,
                },
              },
              {
                type: 'div',
                props: {
                  style: { fontSize: '30px', fontWeight: 400, fontStyle: 'italic', color: '#059669' },
                  children: `"${SLOGAN}"`,
                },
              },
            ],
          },
        },
        // footer
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '2px solid #FFF3E0',
              paddingTop: '28px',
            },
            children: [
              {
                type: 'div',
                props: { style: { fontSize: '24px', color: '#7A7A92' }, children: 'traotay.com.vn' },
              },
              {
                type: 'div',
                props: { style: { fontSize: '22px', color: '#7A7A92' }, children: 'Mua • Bán • Cho tặng' },
              },
            ],
          },
        },
      ],
    },
  };
}

async function renderCardPng(hookText) {
  const fonts = await getFonts();
  const svg = await satori(cardTemplate(hookText), { width: SIZE, height: SIZE, fonts });
  return new Resvg(svg, { fitTo: { mode: 'width', value: SIZE } }).render().asPng();
}

// ─── MinIO upload (dùng chung bucket với backend, đọc credentials từ .env.docker) ──
//
// Script này chạy trực tiếp trên EC2 host (cron), KHÔNG nằm trong docker network
// của backend — nên không thể dùng hostname nội bộ "minio" trong .env.docker.
// MinIO container expose port 9000 ra 127.0.0.1 trên host (docker-compose.prod.yml),
// nên luôn nối qua localhost, chỉ lấy access key/secret/bucket từ .env.docker.

function getMinioClient() {
  return new Minio.Client({
    endPoint: '127.0.0.1',
    port: 9000,
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
  });
}

const BUCKET = process.env.MINIO_BUCKET || 'traotay';
const PUBLIC_URL = process.env.MINIO_PUBLIC_URL || 'https://s3.traotay.com.vn';

// Trả về URL public của ảnh cho 1 file caption — render + upload nếu chưa có,
// nếu đã có trên MinIO từ lần trước thì chỉ trả lại URL (không render lại).
async function getOrCreateCardUrl(file, captionText) {
  const key = `social-cards/${path.basename(file, '.txt')}.png`;
  const url = `${PUBLIC_URL}/${BUCKET}/${key}`;
  const client = getMinioClient();

  try {
    await client.statObject(BUCKET, key);
    return url;
  } catch {
    // chưa tồn tại — render + upload
  }

  const hook = extractHook(captionText);
  const png = await renderCardPng(hook);
  await client.putObject(BUCKET, key, png, png.length, { 'Content-Type': 'image/png' });
  return url;
}

module.exports = { extractHook, renderCardPng, getOrCreateCardUrl };

// ─── CLI test mode — render 1 ảnh mẫu ra file local, không cần MinIO ──

if (require.main === module && process.argv.includes('--test')) {
  const sampleCaption = `Chào anh chị!

Mua bán đồ cũ online, sợ nhất là gì?

📍 Gặp mặt trực tiếp giao nhận — không cần chuyển khoản trước cho người lạ
💬 Chat ngay trong app

*"Đồ cũ người này, Báu vật người kia"*
`;
  renderCardPng(extractHook(sampleCaption)).then(png => {
    const outPath = path.join(__dirname, 'test-card.png');
    fs.writeFileSync(outPath, png);
    console.log('✅ Đã render ảnh mẫu:', outPath);
  }).catch(err => {
    console.error('❌ Lỗi render:', err);
    process.exit(1);
  });
}
