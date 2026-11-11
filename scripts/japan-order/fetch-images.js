#!/usr/bin/env node
/**
 * Lấy ảnh sản phẩm của từng hãng từ trang chính hãng Nhật, theo cách "công khai & tôn trọng":
 *   - đọc robots.txt, KHÔNG truy cập đường dẫn bị Disallow
 *   - lấy trang sản phẩm từ sitemap công khai (hoặc ảnh trong image-sitemap), đọc og:image / JSON-LD
 *   - gặp 403/429/captcha/challenge → BỎ QUA hãng đó (hãng chỉ đăng ảnh thẻ), không giả lập trình duyệt,
 *     không đổi User-Agent để qua mặt chống bot.
 *
 * Usage:
 *   node scripts/japan-order/fetch-images.js --out=<thư mục> [--slug=nike,asics] [--concurrency=4]
 * Kết quả: <out>/<slug>/1-xxx.jpg … (tối đa 6 ứng viên/hãng, ≤1080px) + <out>/report.json
 * Ứng viên còn phải được xem/lọc (ảnh banner, ảnh người mẫu…) trước khi đưa vào <IMAGES_DIR>/<slug>/.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const sharp = require('sharp');

const BRANDS = require('./brands.json');
const UA = 'Mozilla/5.0 (compatible; TraoTayImageFetcher/1.0; +https://traotay.com.vn)';
const MAX_CANDIDATES = 6;

const args = process.argv.slice(2);
const argVal = n => (args.find(a => a.startsWith(`--${n}=`)) || '').slice(n.length + 3);
const OUT = argVal('out');
if (!OUT) { console.error('Thiếu --out=<thư mục>'); process.exit(1); }
const ONLY = argVal('slug') ? argVal('slug').split(',') : null;
const CONC = parseInt(argVal('concurrency') || '4', 10);

class Blocked extends Error {}

async function get(url, { binary = false, timeout = 25000 } = {}) {
  const res = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'ja,en;q=0.8' }, redirect: 'follow', signal: AbortSignal.timeout(timeout) });
  if ([401, 403, 429, 451].includes(res.status) || res.status === 503) throw new Blocked(`HTTP ${res.status}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (binary) return { buf, type: res.headers.get('content-type') || '', url: res.url };
  let text = (/\.gz(\?|$)/.test(url) || (buf[0] === 0x1f && buf[1] === 0x8b)) ? zlib.gunzipSync(buf).toString('utf8') : buf.toString('utf8');
  if (/captcha|cf-chl|attention required|access denied|are you a robot|px-captcha/i.test(text.slice(0, 6000))) throw new Blocked('challenge page');
  return { text, url: res.url };
}

// ─── robots.txt ───────────────────────────────────────────────────────────────
async function loadRobots(origin) {
  const rules = []; const sitemaps = [];
  try {
    const { text } = await get(`${origin}/robots.txt`, { timeout: 15000 });
    let applies = false, inGroup = false;
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.replace(/#.*/, '').trim();
      const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
      if (!m) continue;
      const k = m[1].toLowerCase(), v = m[2].trim();
      if (k === 'sitemap') sitemaps.push(v);
      else if (k === 'user-agent') { if (!inGroup) applies = false; inGroup = true; if (v === '*') applies = true; }
      else { inGroup = false; if (applies && (k === 'disallow' || k === 'allow') && v) rules.push({ allow: k === 'allow', p: v }); }
    }
  } catch (e) { if (e instanceof Blocked) throw e; }
  const allowed = url => {
    let p; try { const u = new URL(url); p = u.pathname + u.search; } catch { return false; }
    let best = null;
    for (const r of rules) {
      const re = new RegExp('^' + r.p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$'));
      if (re.test(p) && (!best || r.p.length > best.p.length)) best = r;
    }
    return !best || best.allow;
  };
  return { allowed, sitemaps };
}

// ─── sitemap ──────────────────────────────────────────────────────────────────
async function collectFromSitemaps(starts, allowed) {
  const queue = [...starts]; const seen = new Set(); const pages = []; const images = [];
  const prio = u => (/product|item|goods|catalog|shop|ec/i.test(u) ? 0 : 1);
  while (queue.length && seen.size < 14) {
    queue.sort((a, b) => prio(a) - prio(b));
    const u = queue.shift();
    if (seen.has(u)) continue; seen.add(u);
    let text; try { ({ text } = await get(u, { timeout: 40000 })); } catch (e) { if (e instanceof Blocked) throw e; continue; }
    for (const m of text.matchAll(/<sitemap>[\s\S]*?<loc>\s*([^<\s]+)\s*<\/loc>/g)) queue.push(m[1]);
    for (const m of text.matchAll(/<image:loc>\s*([^<\s]+)\s*<\/image:loc>/g)) images.push(m[1]);
    if (!/<sitemapindex/.test(text)) for (const m of text.matchAll(/<url>\s*<loc>\s*([^<\s]+)\s*<\/loc>/g)) pages.push(m[1]);
    if (pages.length > 20000) break;
  }
  return { pages: pages.filter(allowed), images };
}

const PRODUCT_RE = /\/(products?|items?|goods|detail|dp|p|t|g|shop\/g|catalog\/product|commodity)\/|\/[A-Za-z0-9_-]*\d{3,}[A-Za-z0-9_-]*(\.html?)?\/?$/i;
const JUNK_RE = /ogp|og[-_]?image|logo|icon|sprite|favicon|banner|header|footer|bnr|sns|badge|avatar|placeholder|loading|blank|spacer|arrow|\.svg|\.gif/i;

// Nhiều CDN cho phép xin ảnh cùng file ở kích thước lớn hơn bằng tham số URL (Scene7: wid/hei, Nike: w_xxx).
function upsize(u) {
  try {
    if (/[?&]wid=\d+/i.test(u)) return u.replace(/([?&])wid=\d+/i, '$1wid=1080').replace(/([?&])hei=\d+/i, '$1hei=1080');
    if (/scene7\.com\/is\/image\//i.test(u) && !/[?&]wid=/i.test(u)) return u.split('?')[0] + '?wid=1080&hei=1080&fmt=jpeg&bgc=255,255,255';
    if (/static\.nike\.com/.test(u)) return u.replace(/w_\d+/, 'w_1080');
  } catch {}
  return u;
}

function pickSpread(arr, n) {
  if (arr.length <= n) return arr;
  const step = arr.length / n; const out = [];
  for (let i = 0; i < n; i++) out.push(arr[Math.floor(i * step)]);
  return out;
}

function imagesFromHtml(html, base, withImgTags = false) {
  const out = [];
  const add = u => { try { out.push(new URL(u.replace(/&amp;/g, '&'), base).href); } catch {} };
  for (const m of html.matchAll(/<meta[^>]+(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image)["'][^>]*content=["']([^"']+)/gi)) add(m[1]);
  for (const m of html.matchAll(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image)["']/gi)) add(m[1]);
  if (withImgTags) {
    for (const m of html.matchAll(/<img[^>]*>/gi)) {
      const tag = m[0];
      const src = (tag.match(/(?:data-original|data-src|data-lazy-src|src)=["']([^"']+)["']/i) || [])[1];
      const ss = (tag.match(/srcset=["']([^"']+)["']/i) || [])[1];
      if (src && !/^data:/.test(src)) add(src);
      if (ss) { const last = ss.split(',').pop().trim().split(/\s+/)[0]; if (last && !/^data:/.test(last)) add(last); }
    }
  }
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const walk = o => {
        if (!o || typeof o !== 'object') return;
        if (Array.isArray(o)) return o.forEach(walk);
        if (/Product/i.test(String(o['@type']))) { const im = o.image; (Array.isArray(im) ? im : [im]).forEach(i => typeof i === 'string' ? add(i) : i && i.url && add(i.url)); }
        Object.values(o).forEach(walk);
      };
      walk(JSON.parse(m[1]));
    } catch {}
  }
  return out;
}

async function processBrand(b) {
  const origin = new URL(b.url).origin;
  const res = { slug: b.slug, name: b.name, status: 'none', images: 0, note: '' };
  try {
    const { allowed, sitemaps } = await loadRobots(origin);
    const starts = sitemaps.length ? sitemaps : [`${origin}/sitemap.xml`];
    let { pages, images } = await collectFromSitemaps(starts, allowed).catch(e => { if (e instanceof Blocked) throw e; return { pages: [], images: [] }; });
    if (!pages.length && !images.length) {
      // không có sitemap dùng được → thử các link sản phẩm trên trang chủ chính hãng
      const { text, url } = await get(b.url);
      pages = [...new Set([...text.matchAll(/href=["']([^"'#]+)["']/g)].map(m => { try { return new URL(m[1], url).href; } catch { return null; } }).filter(Boolean))]
        .filter(u => new URL(u).origin === origin && allowed(u));
      images = imagesFromHtml(text, url);
    }
    let cands = images.filter(u => !JUNK_RE.test(u));
    const productPages = pages.filter(u => PRODUCT_RE.test(u));
    const pagePool = pickSpread(productPages.length ? productPages : pages, 16);
    for (const p of pagePool) {
      if (cands.length >= 120) break;
      try { const { text, url } = await get(p, { timeout: 20000 }); cands.push(...imagesFromHtml(text, url, true)); }
      catch (e) { if (e instanceof Blocked && !cands.length) throw e; }
    }
    cands = [...new Set(cands.map(upsize))].filter(u => !JUNK_RE.test(u)).slice(0, 120);
    if (process.env.DEBUG) console.log('   [dbg]', b.slug, 'sitemap pages', pages.length, '| product pages', productPages.length, '| ảnh ứng viên', cands.length);
    const dir = path.join(OUT, b.slug); fs.mkdirSync(dir, { recursive: true });
    const seen = new Set(); let n = 0;
    for (const u of pickSpread(cands, Math.min(cands.length, 40))) {
      if (n >= MAX_CANDIDATES) break;
      try {
        const { buf } = await get(u, { binary: true, timeout: 25000 });
        const m = await sharp(buf).metadata();
        if (process.env.DEBUG) console.log('   [dbg]', b.slug, m.width + 'x' + m.height, u.slice(0, 120));
        if (!m.width || !m.height || Math.min(m.width, m.height) < 400) continue;
        const ar = m.width / m.height; if (ar < 0.6 || ar > 1.8) continue;
        const out = await sharp(buf).flatten({ background: '#ffffff' }).resize({ width: 1080, height: 1080, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 88 }).toBuffer();
        const h = crypto.createHash('md5').update(out).digest('hex'); if (seen.has(h)) continue; seen.add(h);
        n++; fs.writeFileSync(path.join(dir, `${n}-${h.slice(0, 6)}.jpg`), out);
      } catch (e) { if (e instanceof Blocked) { res.note = 'ảnh bị chặn'; break; } }
    }
    res.images = n; res.status = n ? 'ok' : 'none';
    if (!n) res.note = res.note || (cands.length ? 'ảnh không đạt (nhỏ/tỉ lệ lạ)' : 'không tìm được ảnh');
  } catch (e) {
    res.status = e instanceof Blocked ? 'blocked' : 'error';
    res.note = e.message;
  }
  return res;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const list = BRANDS.filter(b => !ONLY || ONLY.includes(b.slug));
  const results = []; let i = 0;
  const worker = async () => {
    while (i < list.length) {
      const b = list[i++];
      const r = await processBrand(b);
      results.push(r);
      console.log(`${r.status.padEnd(7)} ${String(r.images).padStart(2)} ảnh  ${b.slug}${r.note ? '  — ' + r.note : ''}`);
    }
  };
  await Promise.all(Array.from({ length: CONC }, worker));
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(results, null, 2));
  const c = s => results.filter(r => r.status === s).length;
  console.log(`\nTổng ${results.length}: ok ${c('ok')} | không ảnh ${c('none')} | bị chặn ${c('blocked')} | lỗi ${c('error')}`);
})();
