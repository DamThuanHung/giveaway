#!/usr/bin/env node
/**
 * Mỗi lần chạy: đăng 1 bài "Nhận order <hãng> từ Nhật về Việt Nam" lên Trao Tay
 * bằng tài khoản admin, theo thứ tự trong brands.json, mỗi hãng đúng 1 lần.
 *
 * Đăng qua API thật POST /post (cùng đường đi với app/web) nên được kiểm tra đầu vào,
 * upload ảnh lên MinIO, thông báo người theo dõi y như bài đăng thường.
 *
 * Usage:
 *   node scripts/japan-order/post-brand.js --dry            # render ảnh + in nội dung, KHÔNG đăng
 *   node scripts/japan-order/post-brand.js --dry --slug=asics
 *   node scripts/japan-order/post-brand.js                  # đăng hãng kế tiếp (tối đa 1 bài/ngày)
 *   node scripts/japan-order/post-brand.js --slug=nike --force   # đăng hãng chỉ định, bỏ qua giới hạn ngày
 *   node scripts/japan-order/post-brand.js --list           # xem đã đăng / còn lại
 *
 * Quy tắc nghiệp vụ [xác nhận bởi user 2026-11-11]:
 *   - Không ghi giá từng sản phẩm; khách xem giá ở trang chủ Nhật của hãng (price=0 → "Thương lượng")
 *   - Thanh toán bằng VNĐ: gọi video xác nhận → đặt cọc 100.000đ → thanh toán phần còn lại
 *     TRƯỚC khi gửi hàng về VN
 *   - Phí gửi về tận nhà 300.000đ, áp dụng mọi sản phẩm
 */

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

// ─── Env: JWT_SECRET từ .env.docker gốc repo (giống generate-card.js) ───────────
function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  fs.readFileSync(file, 'utf8').split('\n')
    .filter(l => l.trim() && !l.startsWith('#'))
    .forEach(l => {
      const [k, ...rest] = l.split('=');
      if (k && rest.length && !process.env[k.trim()]) process.env[k.trim()] = rest.join('=').trim();
    });
}
loadEnvFile(path.join(__dirname, '..', '..', '.env.docker'));

const API_URL = process.env.JAPAN_ORDER_API_URL || 'http://127.0.0.1:3800';
const STATE_FILE = process.env.JAPAN_ORDER_STATE || '/opt/traotay/japan-order-state.json';
const FONT_DIR = path.join(__dirname, '..', '..', 'web', 'public', 'fonts');
// Ảnh sản phẩm chính hãng (user chấp nhận rủi ro bản quyền, xác nhận 2026-11-11): mỗi hãng 1 thư mục
// <IMAGES_DIR>/<slug>/ chứa tối đa MAX_PRODUCT_IMAGES ảnh, đặt tên 1-xxx.jpg, 2-xxx.jpg để xếp thứ tự.
// Ngoài repo để không bị ghi đè khi cập nhật code. Hãng chưa có thư mục → bài chỉ có ảnh thẻ.
const IMAGES_DIR = process.env.JAPAN_ORDER_IMAGES || '/opt/traotay/japan-order-images';
const MAX_PRODUCT_IMAGES = 4;
const BRANDS = require('./brands.json');

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
function productImages(slug) {
  const dir = path.join(IMAGES_DIR, slug);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => MIME[path.extname(f).toLowerCase()])
    .sort()
    .slice(0, MAX_PRODUCT_IMAGES)
    .map(f => ({ name: f, type: MIME[path.extname(f).toLowerCase()], data: fs.readFileSync(path.join(dir, f)) }))
    .filter(img => img.data.length <= 5 * 1024 * 1024); // backend giới hạn 5MB/ảnh
}

const SHIP_FEE = '300.000đ';
const DEPOSIT = '100.000đ';
const SIZE = 1080;

// ─── Nội dung bài ───────────────────────────────────────────────────────────────
function buildPost(b) {
  const jpPart = b.jp ? ` (${b.jp})` : '';
  const title = `Nhận order ${b.name} từ Nhật về Việt Nam`.slice(0, 100);
  const description = [
    `Mình nhận order sản phẩm ${b.name}${jpPart} từ Nhật Bản, gửi về tận nhà bạn ở Việt Nam. Nhóm hàng: ${b.category}.`,
    '',
    `🔎 Xem mẫu và giá tại trang chủ ${b.name} Nhật Bản:`,
    b.url,
    '',
    'Cách order:',
    '1. Bạn chọn món ưng ý trên trang trên, gửi link cho mình qua chat.',
    '2. Hai bên gọi video để xác nhận món hàng.',
    `3. Bạn đặt cọc ${DEPOSIT}.`,
    '4. Trước khi mình gửi hàng về Việt Nam, bạn thanh toán nốt phần còn lại.',
    '',
    `💴 Thanh toán bằng tiền Việt (VNĐ). Phí gửi về tận nhà: ${SHIP_FEE} cho mọi sản phẩm.`,
    '',
    'Nhắn tin cho mình qua chat để được tư vấn nhé!',
  ].join('\n');
  return { title, description };
}

// ─── Ảnh thẻ (satori + resvg, màu theo token Trao Tay như generate-card.js) ────
let fontsCache = null;
async function getFonts() {
  if (fontsCache) return fontsCache;
  const [regular, bold, jp] = await Promise.all([
    fsp.readFile(path.join(FONT_DIR, 'BeVietnamPro-Regular.ttf')),
    fsp.readFile(path.join(FONT_DIR, 'BeVietnamPro-Bold.ttf')),
    fsp.readFile(path.join(FONT_DIR, 'NotoSansJP-Regular.ttf')),
  ]);
  fontsCache = [
    { name: 'Be Vietnam Pro', data: regular, weight: 400, style: 'normal' },
    { name: 'Be Vietnam Pro', data: bold, weight: 700, style: 'normal' },
    { name: 'Noto Sans JP', data: jp, weight: 400, style: 'normal' },
    { name: 'Noto Sans JP', data: jp, weight: 700, style: 'normal' },
  ];
  return fontsCache;
}

const div = (style, children) => ({ type: 'div', props: { style: { display: 'flex', ...style }, children } });

function brandFontSize(name) {
  const n = name.length;
  if (n <= 8) return 150;
  if (n <= 12) return 118;
  if (n <= 18) return 88;
  return 70;
}

function cardTemplate(b) {
  const children = [
    div({ alignItems: 'center', gap: '14px' }, [
      div({ padding: '10px 24px', borderRadius: '9999px', background: '#10B981', color: '#FFFFFF', fontSize: '26px', fontWeight: 700 },
        'ORDER TỪ NHẬT BẢN'),
      div({ fontSize: '28px', fontWeight: 700, color: '#047857' }, 'Trao Tay'),
    ]),
    div({ flexDirection: 'column', gap: '22px' }, [
      div({ fontSize: '34px', color: '#7A7A92' }, 'Nhận order về Việt Nam'),
      div({ fontSize: `${brandFontSize(b.name)}px`, fontWeight: 700, color: '#1A1A2E', lineHeight: 1.1 }, b.name),
      b.jp ? div({ fontSize: '46px', color: '#059669', fontFamily: 'Noto Sans JP, Be Vietnam Pro' }, b.jp) : div({ height: '1px' }, ''),
      div({ fontSize: '32px', color: '#7A7A92' }, b.category),
    ]),
    div({ flexDirection: 'column', gap: '18px', borderTop: '2px solid #FFF3E0', paddingTop: '32px' }, [
      div({ justifyContent: 'space-between', fontSize: '32px', color: '#1A1A2E' }, [
        div({}, `Phí gửi về tận nhà ${SHIP_FEE}`),
        div({ color: '#047857', fontWeight: 700 }, `Cọc ${DEPOSIT}`),
      ]),
      div({ justifyContent: 'space-between', fontSize: '24px', color: '#7A7A92' }, [
        div({}, 'Thanh toán bằng tiền Việt'),
        div({}, 'traotay.com.vn'),
      ]),
    ]),
  ];
  return div({
    flexDirection: 'column', justifyContent: 'space-between',
    width: `${SIZE}px`, height: `${SIZE}px`, padding: '80px 90px',
    background: '#FFFBF5', fontFamily: 'Be Vietnam Pro',
  }, children);
}

async function renderCardPng(b) {
  const satori = require('satori').default;
  const { Resvg } = require('@resvg/resvg-js');
  const svg = await satori(cardTemplate(b), { width: SIZE, height: SIZE, fonts: await getFonts() });
  return new Resvg(svg, { fitTo: { mode: 'width', value: SIZE } }).render().asPng();
}

// ─── Trạng thái đã đăng ─────────────────────────────────────────────────────────
function readState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch { return { posted: {} }; }
}
function writeState(s) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2) + '\n');
}
function todayIct() {
  return new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
}

// ─── Đăng nhập bằng token admin ký tại chỗ ─────────────────────────────────────
function adminIdentity() {
  if (process.env.JAPAN_ORDER_AUTHOR_ID && process.env.JAPAN_ORDER_AUTHOR_EMAIL) {
    return { id: process.env.JAPAN_ORDER_AUTHOR_ID, email: process.env.JAPAN_ORDER_AUTHOR_EMAIL };
  }
  const out = execFileSync('docker', ['exec', 'traotay_db', 'sh', '-c',
    `psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -A -F '|' -c "select id, email from \\"User\\" where role='admin' and \\"isBanned\\"=false order by \\"createdAt\\" limit 1"`,
  ], { encoding: 'utf8' }).trim();
  const [id, email] = out.split('|');
  if (!id) throw new Error('Không tìm thấy tài khoản admin');
  return { id, email: email || '' };
}

function signJwt(payload, secret) {
  const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
  const head = b64({ alg: 'HS256', typ: 'JWT' });
  const now = Math.floor(Date.now() / 1000);
  const body = b64({ ...payload, iat: now, exp: now + 600 }); // sống 10 phút, chỉ dùng cho 1 lần đăng
  const sig = crypto.createHmac('sha256', secret).update(`${head}.${body}`).digest('base64url');
  return `${head}.${body}.${sig}`;
}

async function createPost(b, png) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('Thiếu JWT_SECRET (đọc từ .env.docker)');
  const me = adminIdentity();
  const token = signJwt({ sub: me.id, email: me.email }, secret);
  const { title, description } = buildPost(b);

  const form = new FormData();
  form.append('title', title);
  form.append('description', description);
  form.append('price', '0');                 // không ghi giá → web hiện "Thương lượng"
  form.append('listingType', 'sell');
  form.append('postType', 'service');
  form.append('itemCategory', 'service');
  form.append('country', 'VN');              // dịch vụ phục vụ khách VN; country=JP sẽ bị ẩn khỏi danh sách mặc định
  form.append('serviceArea', 'Toàn quốc');
  form.append('images', new Blob([png], { type: 'image/png' }), `${b.slug}.png`); // ảnh thẻ luôn đứng đầu
  for (const img of productImages(b.slug)) {
    form.append('images', new Blob([img.data], { type: img.type }), img.name);
  }

  const res = await fetch(`${API_URL}/post`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
    signal: AbortSignal.timeout(60000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`POST /post → HTTP ${res.status}: ${text.slice(0, 300)}`);
  return JSON.parse(text);
}

// Bổ sung ảnh sản phẩm cho bài ĐÃ đăng (vd Nike đăng trước khi có ảnh): upload từng ảnh rồi PATCH images.
async function syncImages(b, postId) {
  const imgs = productImages(b.slug);
  if (!imgs.length) throw new Error(`Chưa có ảnh trong ${path.join(IMAGES_DIR, b.slug)}`);
  const me = adminIdentity();
  const auth = { Authorization: `Bearer ${signJwt({ sub: me.id, email: me.email }, process.env.JWT_SECRET)}` };
  const cur = await (await fetch(`${API_URL}/post/${postId}`, { signal: AbortSignal.timeout(30000) })).json();
  if (!Array.isArray(cur.images)) throw new Error('Không đọc được bài hiện tại');
  const urls = [];
  for (const img of imgs) {
    const f = new FormData();
    f.append('image', new Blob([img.data], { type: img.type }), img.name);
    const r = await fetch(`${API_URL}/post/upload-image`, { method: 'POST', headers: auth, body: f, signal: AbortSignal.timeout(60000) });
    const t = await r.text();
    if (!r.ok) throw new Error(`upload-image → HTTP ${r.status}: ${t.slice(0, 200)}`);
    urls.push(JSON.parse(t).url);
  }
  const images = [...cur.images, ...urls].slice(0, 10);
  const r = await fetch(`${API_URL}/post/${postId}`, {
    method: 'PATCH',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ images }),
    signal: AbortSignal.timeout(30000),
  });
  if (!r.ok) throw new Error(`PATCH /post → HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return images.length;
}

// ─── Main ───────────────────────────────────────────────────────────────────────
(async () => {
  const args = process.argv.slice(2);
  const flag = n => args.includes(`--${n}`);
  const slugArg = (args.find(a => a.startsWith('--slug=')) || '').slice(7);
  const state = readState();

  if (flag('list')) {
    const done = BRANDS.filter(b => state.posted[b.slug]);
    console.log(`Đã đăng ${done.length}/${BRANDS.length}`);
    done.forEach(b => console.log('  ✅', b.name, '—', state.posted[b.slug].date, state.posted[b.slug].postId));
    console.log('Còn lại:', BRANDS.filter(b => !state.posted[b.slug]).map(b => b.name).join(', ') || '(hết)');
    return;
  }

  if (flag('sync-images')) {
    const b = BRANDS.find(x => x.slug === slugArg);
    if (!b) throw new Error('Cần --slug=<hãng>');
    const rec = state.posted[b.slug];
    if (!rec) throw new Error(`${b.name} chưa đăng — không có bài để bổ sung ảnh`);
    if (rec.imagesSynced && !flag('force')) { console.log(`${b.name} đã bổ sung ảnh rồi — bỏ qua.`); return; }
    const total = await syncImages(b, rec.postId);
    rec.imagesSynced = true;
    writeState(state);
    console.log(`✅ ${b.name}: bài ${rec.postId} giờ có ${total} ảnh`);
    return;
  }

  let brand;
  if (slugArg) {
    brand = BRANDS.find(b => b.slug === slugArg);
    if (!brand) throw new Error(`Không có hãng "${slugArg}" trong brands.json`);
  } else {
    brand = BRANDS.find(b => !state.posted[b.slug]);
    if (!brand) { console.log('Đã đăng hết danh sách hãng — thêm hãng mới vào brands.json.'); return; }
  }

  const { title, description } = buildPost(brand);
  const png = await renderCardPng(brand);

  if (flag('dry')) {
    const out = path.join(process.env.TEMP || '/tmp', `japan-order-${brand.slug}.png`);
    fs.writeFileSync(out, png);
    console.log(`[DRY] Hãng: ${brand.name}\n[DRY] Ảnh thẻ: ${out} (${Math.round(png.length / 1024)} KB)\n[DRY] Ảnh sản phẩm: ${productImages(brand.slug).length} (thư mục ${path.join(IMAGES_DIR, brand.slug)})\n[DRY] Tiêu đề: ${title}\n---\n${description}`);
    return;
  }

  if (!flag('force')) {
    const today = todayIct();
    const already = Object.values(state.posted).some(p => p.date === today);
    if (already) { console.log(`Hôm nay (${today}) đã đăng 1 bài — bỏ qua. Dùng --force nếu thật sự cần.`); return; }
  }
  if (state.posted[brand.slug] && !flag('force')) { console.log(`${brand.name} đã đăng rồi — bỏ qua.`); return; }

  const post = await createPost(brand, png);
  state.posted[brand.slug] = { postId: post.id, date: todayIct(), at: new Date().toISOString() };
  writeState(state);
  console.log(`✅ Đã đăng: ${title} → ${post.id}`);
})().catch(e => { console.error('❌', e.message); process.exit(1); });
