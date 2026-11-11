#!/usr/bin/env node
/**
 * Tổng hợp "khách đến từ đâu" từ log nginx → file JSON nhỏ cho mail báo cáo hàng ngày.
 *
 *   node nginx-sources.js              # tổng hợp HÔM QUA (giờ VN)
 *   node nginx-sources.js 2026-11-10   # một ngày cụ thể
 *
 * Vì sao có script này (2026-11-11): Cloudflare gói miễn phí không cho đọc query string / referrer,
 * còn container backend chạy user `app`, không đọc được log nginx (và không nên đọc log thô).
 * Script chạy trên HOST, chỉ ghi ra file đã tổng hợp (không có IP, không có URL) vào thư mục
 * STATS_DIR; thư mục này được mount read-only vào backend.
 *
 * Chỉ đếm lượt vào trang từ link bài đăng: có utm_source=..., hoặc referrer từ website ngoài.
 * Bỏ qua: bot/script/công cụ kiểm tra, request tài nguyên (_next, api, ảnh, file), /health,
 * và điều hướng nội bộ (referrer là chính traotay.com.vn).
 * Lưu ý: log nginx không ghi $host nên không phân biệt được web và api; request API từ trình
 * duyệt có referrer nội bộ nên đã bị loại ở trên.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const LOG_DIR = process.env.NGINX_LOG_DIR || '/var/log/nginx';
const STATS_DIR = process.env.STATS_DIR || '/opt/traotay/stats';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Cùng tinh thần với BOT_UA trong backend/src/admin/cloudflare-analytics.service.ts
const BOT_UA =
  /bot|crawl|spider|slurp|check|monitor|uptime|facebookexternalhit|externalagent|curl|wget|python|go-http|java\/|headless|node|undici|^-?$/i;

const REFERRER_SOURCES = [
  [/(^|\.)facebook\.com$|(^|\.)fb\.com$|(^|\.)fb\.me$/, 'facebook'],
  [/(^|\.)instagram\.com$/, 'instagram'],
  [/(^|\.)threads\.(net|com)$/, 'threads'],
  [/(^|\.)google\.[a-z.]+$/, 'google'],
  [/(^|\.)coccoc\.com$/, 'coccoc'],
  [/(^|\.)zalo\.me$/, 'zalo'],
];
const INTERNAL_HOST = /(^|\.)traotay\.com\.vn$/;

function vnYesterday() {
  return new Date(Date.now() + 7 * 3600e3 - 86400e3).toISOString().slice(0, 10);
}

function readLog(file) {
  const buf = fs.readFileSync(file);
  return (file.endsWith('.gz') ? zlib.gunzipSync(buf) : buf).toString('utf8');
}

function classify(rawUrl, referrer) {
  let url;
  try {
    url = new URL(rawUrl, 'https://traotay.com.vn');
  } catch {
    return null;
  }
  const p = url.pathname;
  if (/^\/(_next|api|health|downloads|uploads)\b/.test(p) || /\.\w{2,5}$/.test(p)) return null;

  const utm = (url.searchParams.get('utm_source') || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 20);
  if (utm) return utm;

  if (!referrer || referrer === '-') return null; // truy cập trực tiếp: không biết nguồn → không đếm
  let host;
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (INTERNAL_HOST.test(host) || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return null;
  for (const [re, name] of REFERRER_SOURCES) if (re.test(host)) return name;
  return 'khac';
}

function main() {
  const date = process.argv[2] || vnYesterday();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Ngày phải dạng YYYY-MM-DD');
  const [y, m, d] = date.split('-');
  const prefix = `[${d}/${MONTHS[+m - 1]}/${y}:`; // log nginx giờ VN (+0700)

  const files = fs.readdirSync(LOG_DIR).filter((f) => /^access\.log(\.\d+)?(\.gz)?$/.test(f));
  const lineRe = /^(\S+) \S+ \S+ \[[^\]]+\] "(\S+) (\S+) [^"]*" (\d{3}) \S+ "([^"]*)" "([^"]*)"/;
  const sources = {}; // name -> { ips:Set, hits }

  for (const f of files) {
    for (const line of readLog(path.join(LOG_DIR, f)).split('\n')) {
      if (!line.includes(prefix)) continue;
      const mt = line.match(lineRe);
      if (!mt) continue;
      const [, ip, method, url, status, referrer, ua] = mt;
      if (method !== 'GET' || (status !== '200' && status !== '304')) continue;
      if (BOT_UA.test(ua.trim())) continue;
      const src = classify(url, referrer);
      if (!src) continue;
      const s = (sources[src] ??= { ips: new Set(), hits: 0 });
      s.ips.add(ip);
      s.hits++;
    }
  }

  const out = { date, generatedAt: new Date().toISOString(), sources: {} };
  for (const [name, s] of Object.entries(sources)) out.sources[name] = { visitors: s.ips.size, hits: s.hits };

  fs.mkdirSync(STATS_DIR, { recursive: true });
  const dest = path.join(STATS_DIR, `sources-${date}.json`);
  fs.writeFileSync(dest, JSON.stringify(out, null, 2), { mode: 0o644 });
  console.log(`✅ ${dest}`, JSON.stringify(out.sources));
}

try {
  main();
} catch (e) {
  console.error('❌', e.message);
  process.exit(1);
}
