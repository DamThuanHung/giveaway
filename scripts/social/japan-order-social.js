#!/usr/bin/env node
/**
 * Bài social "Nhận order <hãng> từ Nhật về VN" cho post-all.js (FB / IG / Threads).
 * User xác nhận 2026-11-11: các bài order hàng Nhật phải nằm trong lịch đăng social, xoay vòng liên tục.
 *
 * Cách hoạt động (không cần file caption trong queue/ — dựng trực tiếp từ brands.json):
 *   - Cứ mỗi JAPAN_SOCIAL_EVERY lượt chạy (mặc định 5 → ~20% lượt đăng) của MỖI mode (fast / ig),
 *     lượt đó dành cho 1 bài order hàng Nhật; các lượt còn lại giữ nguyên hành vi cũ (queue / vòng quay bài cũ).
 *     → TỔNG tần suất đăng không đổi, chỉ thay một phần lượt.
 *   - Chỉ xoay vòng các hãng ĐÃ có bài trong app Trao Tay (đọc japan-order-state.json) để link sâu luôn đúng.
 *     Mỗi hãng tối đa 1 lần/24h/mode → không spam khi mới có ít hãng; càng nhiều hãng lên app, càng nhiều
 *     lượt thành bài Nhật (tới trần 20%).
 *   - Ảnh: thẻ thương hiệu vuông (tên hãng + ship + cọc). Reel (slot video): slideshow thẻ + ảnh sản phẩm
 *     chính hãng nếu hãng có ảnh; không có ảnh sản phẩm → dùng ảnh thẻ.
 *
 * Preview không cần mạng:  node scripts/social/japan-order-social.js --preview <slug>
 */
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const sharp = require('sharp');
const satori = require('satori').default;
const { Resvg } = require('@resvg/resvg-js');

const jo = require('../japan-order/post-brand');
const { getFonts } = require('./generate-card');
const V = require('./generate-video');

const SITE = 'https://traotay.com.vn';
const SLOGAN = 'Đồ cũ người này, Báu vật người kia';
const EVERY = Math.max(2, parseInt(process.env.JAPAN_SOCIAL_EVERY || '5', 10));
const COOLDOWN_MS = 24 * 3600 * 1000;
const REEL_FRAME_SEC = 2.5;

// ─── State theo mode (fast và ig chạy độc lập, như queue của post-all.js) ─────────
const stateFile = mode => path.join(__dirname, `.japan-social-${mode}.json`);
function readJson(f, def) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return def; } }

/**
 * Gọi mỗi lần post-all.js chạy (ngoài dry-run). Trả { brand, postId, cycle } nếu lượt này dành cho bài Nhật, ngược lại null.
 * `force` = slug để thử tay (bỏ qua nhịp + cooldown, không đụng bộ đếm).
 */
function pickJapan(mode, { force = null, dry = false } = {}) {
  const orderState = jo.readState();
  if (force) {
    const brand = jo.BRANDS.find(b => b.slug === force);
    if (!brand) throw new Error(`Không có hãng "${force}"`);
    const rec = orderState.posted[brand.slug];
    return { brand, postId: rec ? rec.postId : null, cycle: rec ? rec.cycle || 1 : 1, forced: true };
  }
  if (dry) return null;

  const st = readJson(stateFile(mode), { slots: 0, last: {}, cursor: 0 });
  st.slots += 1;
  fs.writeFileSync(stateFile(mode), JSON.stringify(st));
  if (st.slots % EVERY !== 0) return null;

  const pool = jo.BRANDS.filter(b => orderState.posted[b.slug] && orderState.posted[b.slug].postId);
  const now = Date.now();
  for (let i = 0; i < pool.length; i++) {
    const idx = (st.cursor + i) % pool.length;
    const b = pool[idx];
    if (now - (st.last[b.slug] || 0) >= COOLDOWN_MS) {
      const rec = orderState.posted[b.slug];
      return { brand: b, postId: rec.postId, cycle: rec.cycle || 1, poolIdx: idx, poolSize: pool.length };
    }
  }
  return null; // mọi hãng đang có bài đã đăng trong 24h qua → dùng caption thường
}

function markJapanPosted(mode, pick) {
  if (pick.forced) return;
  const st = readJson(stateFile(mode), { slots: 0, last: {}, cursor: 0 });
  st.last[pick.brand.slug] = Date.now();
  st.cursor = pick.poolIdx + 1;
  fs.writeFileSync(stateFile(mode), JSON.stringify(st));
}

// ─── Caption ──────────────────────────────────────────────────────────────────
function brandTag(name) {
  return '#' + name.replace(/[^\p{L}\p{N}]/gu, '').slice(0, 28);
}

const OPENERS = [
  b => `Chào cả nhà 👋 Muốn mua ${b.name} từ Nhật Bản nhưng ngại tự order, sợ rườm rà phí ship?`,
  b => `Chào anh chị 👋 Đang để ý ${b.name} bên Nhật mà chưa biết order thế nào cho yên tâm?`,
  b => `Chào cả nhà 👋 Mê ${b.name} của Nhật Bản? Mình nhận order giúp, gửi về tận nhà luôn nè!`,
];
const QUESTIONS = [
  b => `Cả nhà thích nhất món nào của ${b.name}, comment cho mình biết với nào! 👇`,
  b => `Bạn đang muốn "chốt" món nào của ${b.name}? Nhắn mình ngay nhé! 👇`,
  b => `${b.name} có món nào làm bạn ưng nhất? Kể mình nghe nha! 👇`,
];

function postLink(postId) {
  return postId ? `${SITE}/posts/${postId}/` : `${SITE}/posts/`;
}

function buildCaption(brand, postId, cycle = 1) {
  const v = (cycle - 1 + brand.slug.length) % OPENERS.length;
  const jp = brand.jp ? ` (${brand.jp})` : '';
  return [
    OPENERS[v](brand),
    '',
    `🇯🇵 Nhận order ${brand.name}${jp} — ${brand.category.toLowerCase()} — từ Nhật Bản, gửi về tận nhà bạn ở Việt Nam`,
    `📹 Gọi video xác nhận món hàng trước, rồi mới đặt cọc ${jo.DEPOSIT}`,
    '💴 Thanh toán bằng tiền Việt (VNĐ)',
    '📦 Thanh toán nốt phần còn lại trước khi mình gửi hàng về Việt Nam',
    `🚚 Phí gửi về tận nhà ${jo.SHIP_FEE} cho mọi sản phẩm`,
    '',
    `🔎 Xem mẫu và giá tại trang chủ ${brand.name} Nhật Bản: ${brand.url}`,
    `👉 Cách order chi tiết: ${postLink(postId)}`,
    '',
    `*"${SLOGAN}"*`,
    '',
    `🌐 ${SITE}`,
    `📱 ${SITE}/downloads/traotay.apk`,
    '',
    `Cả nhà like, share giúp mình để nhiều người biết tới dịch vụ order hàng Nhật nha — ${QUESTIONS[v](brand)}`,
    '',
    'Cảm ơn cả nhà nhiều!',
    '',
    `#TraoTay #OrderHàngNhật #HàngNhật #MuaHàngNhật ${brandTag(brand.name)}`,
  ].join('\n');
}

// Threads: giới hạn cứng 500 ký tự (post-all.js tự thêm UTM, quá dài thì bỏ UTM).
function buildThreadsText(brand, postId, cycle = 1) {
  const v = (cycle - 1 + brand.slug.length) % OPENERS.length;
  let text = [
    OPENERS[v](brand),
    `🇯🇵 Mình nhận order ${brand.name} từ Nhật, gửi về tận nhà. Gọi video xác nhận → cọc ${jo.DEPOSIT} → thanh toán nốt trước khi gửi hàng. Ship ${jo.SHIP_FEE} cho mọi sản phẩm.`,
    `👉 ${postLink(postId)}`,
  ].join('\n\n');
  if (text.length > 440) text = [`🇯🇵 Mình nhận order ${brand.name} từ Nhật, gửi về tận nhà. Cọc ${jo.DEPOSIT}, ship ${jo.SHIP_FEE}.`, `👉 ${postLink(postId)}`].join('\n\n');
  return text;
}

// ─── Ảnh thẻ + Reel (MinIO cùng bucket với social-cards/, social-reels/) ───────────
async function getJapanCardUrl(brand) {
  const key = `social-cards/jo-${brand.slug}.png`;
  const url = `${V.PUBLIC_URL}/${V.BUCKET}/${key}`;
  const client = V.getMinioClient();
  try { await client.statObject(V.BUCKET, key); return url; } catch { /* chưa có */ }
  const png = await jo.renderCardPng(brand);
  await client.putObject(V.BUCKET, key, png, png.length, { 'Content-Type': 'image/png' });
  return url;
}

const CREAM = '#FFFBF5';
const el = (style, children) => ({ type: 'div', props: { style: { display: 'flex', ...style }, children } });

async function overlayPng(brand) {
  const tpl = el({ flexDirection: 'column', justifyContent: 'space-between', width: '1080px', height: '1920px', padding: '150px 70px 170px', fontFamily: 'Be Vietnam Pro' }, [
    el({ flexDirection: 'column', gap: '14px' }, [
      el({ fontSize: '34px', fontWeight: 700, color: '#047857' }, 'ORDER TỪ NHẬT BẢN · Trao Tay'),
      el({ fontSize: brand.name.length > 14 ? '66px' : '92px', fontWeight: 700, color: '#1A1A2E', lineHeight: 1.1 }, brand.name),
    ]),
    el({ flexDirection: 'column', gap: '12px' }, [
      el({ fontSize: '40px', color: '#1A1A2E' }, `Phí gửi về tận nhà ${jo.SHIP_FEE} · Cọc ${jo.DEPOSIT}`),
      el({ fontSize: '30px', color: '#7A7A92' }, 'Thanh toán bằng tiền Việt · traotay.com.vn'),
    ]),
  ]);
  const svg = await satori(tpl, { width: 1080, height: 1920, fonts: await getFonts() });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1080 } }).render().asPng();
}

async function frameBuffers(brand, imgs) {
  const bg = () => sharp({ create: { width: 1080, height: 1920, channels: 3, background: CREAM } });
  const frames = [];
  // khung 1: thẻ thương hiệu (đã đủ thông tin) đặt giữa khung dọc
  const card = await sharp(await jo.renderCardPng(brand)).resize(1080, 1080).toBuffer();
  frames.push(await bg().composite([{ input: card, top: 420, left: 0 }]).png().toBuffer());
  const overlay = await overlayPng(brand);
  for (const img of imgs) {
    const prod = await sharp(img.data).resize(960, 960, { fit: 'contain', background: '#ffffff' }).flatten({ background: '#ffffff' }).png().toBuffer();
    frames.push(await bg().composite([{ input: prod, top: 480, left: 60 }, { input: overlay }]).png().toBuffer());
  }
  return frames;
}

/** Slideshow thẻ + ảnh sản phẩm. Trả null nếu hãng chưa có ảnh sản phẩm (dùng ảnh thẻ) hoặc lỗi. */
async function getJapanReelUrl(brand) {
  try {
    const imgs = jo.productImages(brand.slug);
    if (!imgs.length) return null;
    const key = `social-reels/jo-${brand.slug}-n${imgs.length}.mp4`;
    const url = `${V.PUBLIC_URL}/${V.BUCKET}/${key}`;
    const client = V.getMinioClient();
    try { await client.statObject(V.BUCKET, key); return url; } catch { /* render mới */ }

    await fsp.mkdir(V.TMP_DIR, { recursive: true });
    const id = `jo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const tmp = [];
    try {
      const frames = await frameBuffers(brand, imgs);
      const parts = [];
      for (let i = 0; i < frames.length; i++) {
        const fp = path.join(V.TMP_DIR, `${id}-f${i}.png`); await fsp.writeFile(fp, frames[i]); tmp.push(fp);
        const vp = path.join(V.TMP_DIR, `${id}-s${i}.mp4`); await V.encodeStageVideo(fp, REEL_FRAME_SEC, V.FPS, vp); tmp.push(vp);
        parts.push(vp);
      }
      const total = REEL_FRAME_SEC * frames.length;
      const concat = path.join(V.TMP_DIR, `${id}-concat.mp4`); tmp.push(concat);
      await V.concatStageVideos(parts, concat);
      const out = path.join(V.TMP_DIR, `${id}-reel.mp4`); tmp.push(out);
      await V.muxAudio({ videoPath: concat, musicPath: V.pickMusicFile(), durationSec: total, outputPath: out });
      const actual = await V.ffprobeDurationSec(out);
      if (Math.abs(actual - total) > 1.5) throw new Error(`Duration sai (${actual}s, mong đợi ~${total}s)`);
      const buf = await fsp.readFile(out);
      await client.putObject(V.BUCKET, key, buf, buf.length, { 'Content-Type': 'video/mp4' });
      return url;
    } finally {
      await Promise.all(tmp.map(p => fsp.rm(p, { force: true })));
    }
  } catch (err) {
    console.warn(`⚠️  Không tạo được Reel order Nhật (${err.message}) — dùng ảnh thẻ.`);
    return null;
  }
}

module.exports = { pickJapan, markJapanPosted, buildCaption, buildThreadsText, getJapanCardUrl, getJapanReelUrl, EVERY };

// ─── Preview không cần mạng ───────────────────────────────────────────────────
if (require.main === module) {
  const i = process.argv.indexOf('--preview');
  if (i === -1) { console.log('Dùng: node scripts/social/japan-order-social.js --preview <slug> [cycle]'); process.exit(0); }
  const slug = process.argv[i + 1];
  const cycle = parseInt(process.argv[i + 2] || '1', 10);
  const brand = jo.BRANDS.find(b => b.slug === slug);
  if (!brand) { console.error('Không có hãng', slug); process.exit(1); }
  const rec = jo.readState().posted[slug];
  const postId = rec ? rec.postId : 'POST_ID_MAU';
  const cap = buildCaption(brand, postId, cycle);
  console.log(`--- Facebook/Instagram (${cap.length} ký tự) ---\n${cap}\n`);
  const th = buildThreadsText(brand, postId, cycle);
  console.log(`--- Threads (${th.length} ký tự) ---\n${th}`);
}
