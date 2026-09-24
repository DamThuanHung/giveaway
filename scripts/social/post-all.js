#!/usr/bin/env node
/**
 * Trao Tay — Social Auto-Poster
 * Đăng đồng thời lên: Facebook Page + Instagram + Threads
 *
 * Usage:
 *   node post-all.js              # tự lấy caption từ queue/ (dùng cho cron)
 *   node post-all.js --dry-run    # preview caption tiếp theo, không đăng thật
 *   node post-all.js --queue      # liệt kê queue hiện tại
 *
 * Queue: mỗi file trong scripts/social/queue/ là 1 bài đăng.
 * File được đặt tên theo thứ tự: 001.txt, 002.txt, ...
 * Sau khi đăng xong, file được chuyển vào queue/done/
 *
 * Hashtag (dòng cuối file, bắt đầu bằng #) chỉ đăng kèm trên Instagram —
 * Facebook & Threads nhận caption không hashtag (xem splitCaptionAndHashtags).
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { extractHook, getOrCreateCardUrl } = require('./generate-card');
const { getOrCreateReelUrl } = require('./generate-video');
const { isDacDinhCaption, isQuestionCaption, getOrCreateDacDinhCardUrl, getOrCreateQuestionCardUrl } = require('./generate-card-dac-dinh');
const { getOrCreateQuestionReelUrl } = require('./generate-video-dac-dinh');

// Card riêng cho caption quảng bá /dac-dinh — KHÔNG dùng template marketplace chung
// (footer "Mua • Bán • Cho tặng" sai ngữ cảnh, xem generate-card-dac-dinh.js).
async function getOrCreateCardUrlSmart(file, caption) {
  if (isQuestionCaption(caption)) return getOrCreateQuestionCardUrl(file, caption);
  if (isDacDinhCaption(caption)) return getOrCreateDacDinhCardUrl(file, caption);
  return getOrCreateCardUrl(file, caption);
}

// ─── Load env ─────────────────────────────────────────────────────────────────

const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf8')
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('#'))
    .forEach(line => {
      const [key, ...rest] = line.split('=');
      if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
    });
}

const isDryRun = process.argv.includes('--dry-run');
const isListQueue = process.argv.includes('--queue');
const QUEUE_DIR = path.join(__dirname, 'queue');
const DONE_DIR = path.join(__dirname, 'queue', 'done');

// ─── Queue ────────────────────────────────────────────────────────────────────

function ensureDirs() {
  if (!fs.existsSync(QUEUE_DIR)) fs.mkdirSync(QUEUE_DIR, { recursive: true });
  if (!fs.existsSync(DONE_DIR)) fs.mkdirSync(DONE_DIR, { recursive: true });
}

// ─── Luân phiên 50/50 marketplace ↔ dac-dinh ───────────────────────────────
// Trước đây getNextCaption() lấy tuần tự theo tên file — vì file dac-dinh đặt
// tên "q-*" (chữ) luôn xếp sau file marketplace đặt tên số ("001-*") trong
// sort() bảng chữ cái, nên thực tế đăng lệch hẳn về 1 loại tuỳ thời điểm thay
// vì chia đều. Giờ chủ động chọn xen kẽ theo loại, không phụ thuộc tên file.

const TYPE_STATE_FILE = path.join(__dirname, '.last-content-type.json');

function captionType(caption) {
  return (isDacDinhCaption(caption) || isQuestionCaption(caption)) ? 'dac-dinh' : 'marketplace';
}

function getLastType() {
  try { return JSON.parse(fs.readFileSync(TYPE_STATE_FILE, 'utf8')).lastType; } catch { return null; }
}

function setLastType(type) {
  fs.writeFileSync(TYPE_STATE_FILE, JSON.stringify({ lastType: type }));
}

// Tìm file đầu tiên (theo thứ tự sort có sẵn) khớp đúng loại mong muốn trong
// 1 danh sách file — dùng chung cho cả queue/ lẫn done/.
function findByType(files, dir, wantType) {
  for (const f of files) {
    const caption = fs.readFileSync(path.join(dir, f), 'utf8').trim();
    if (captionType(caption) === wantType) return { caption, file: f };
  }
  return null;
}

function getNextCaption() {
  ensureDirs();
  const wantType = getLastType() === 'dac-dinh' ? 'marketplace' : 'dac-dinh';

  const files = fs.readdirSync(QUEUE_DIR)
    .filter(f => f.endsWith('.txt') && f !== 'done')
    .sort();

  if (files.length > 0) {
    const match = findByType(files, QUEUE_DIR, wantType);
    if (match) return { ...match, fromDone: false };
    // Hết bài đúng loại trong queue/ (1 nhánh cạn trước) — vẫn đăng bài đang
    // chờ sẵn thay vì bỏ phí, chỉ lệch nhịp xen kẽ tạm thời cho tới khi có
    // thêm caption loại đang thiếu.
    const file = files[0];
    const caption = fs.readFileSync(path.join(QUEUE_DIR, file), 'utf8').trim();
    return { caption, file, fromDone: false };
  }

  // Queue trống → tái sử dụng bài cũ nhất trong done/ (vòng quay round-robin),
  // vẫn ưu tiên đúng loại đang thiếu.
  const doneFiles = fs.readdirSync(DONE_DIR)
    .filter(f => f.endsWith('.txt'))
    .sort();

  if (doneFiles.length === 0) {
    console.error('❌ Queue trống và chưa có bài nào từng đăng! Chạy /len-bai để thêm caption.');
    process.exit(1);
  }

  const match = findByType(doneFiles, DONE_DIR, wantType);
  if (match) return { ...match, fromDone: true };
  const file = doneFiles[0];
  const caption = fs.readFileSync(path.join(DONE_DIR, file), 'utf8').trim();
  return { caption, file, fromDone: true };
}

// ─── Lock file chống cron overlap ──────────────────────────────────────────
// Video Reels chạy lâu hơn ảnh nhiều (ffmpeg + IG polling tối đa 60s) — tăng
// khả năng job giờ sau chạy đè lên job giờ trước nếu job trước chưa xong.

const LOCK_FILE = path.join(__dirname, '.post-all.lock');
const LOCK_STALE_MS = 10 * 60 * 1000; // 10 phút — job nào chạy lâu hơn coi như treo, bỏ qua lock cũ

function acquireLock() {
  if (fs.existsSync(LOCK_FILE)) {
    const age = Date.now() - fs.statSync(LOCK_FILE).mtimeMs;
    if (age < LOCK_STALE_MS) return false;
    console.warn(`⚠️  Lock file cũ (${Math.round(age / 1000)}s) — coi như job trước đã treo, vẫn tiếp tục.`);
  }
  fs.writeFileSync(LOCK_FILE, String(process.pid));
  return true;
}

function releaseLock() {
  fs.rmSync(LOCK_FILE, { force: true });
}

// ─── Trần đăng bài/ngày (25 — trần cứng thật của Instagram Graph API, không
// phải giới hạn tự đặt) ──────────────────────────────────────────────────
// Cron chạy dày hơn số slot cho phép (để không phải canh giờ tay chính xác),
// hàm này chặn cứng khi đã đủ 25 bài/ngày (giờ VN), các lượt cron dư trong
// ngày tự bỏ qua êm, không lỗi.

const DAILY_COUNT_FILE = path.join(__dirname, '.daily-post-count.json');
const DAILY_CAP = 25;

function getTodayVN() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }); // YYYY-MM-DD
}

function reserveDailySlot() {
  const today = getTodayVN();
  let state = { date: today, count: 0 };
  try {
    const saved = JSON.parse(fs.readFileSync(DAILY_COUNT_FILE, 'utf8'));
    if (saved.date === today) state = saved;
  } catch {}
  if (state.count >= DAILY_CAP) return false;
  state.count += 1;
  fs.writeFileSync(DAILY_COUNT_FILE, JSON.stringify(state));
  return true;
}

// ─── Stuck-file detection ───────────────────────────────────────────────────
// State nhỏ ghi lại file + số lần retry liên tiếp, để cảnh báo sớm nếu 1 file
// bị kẹt nhiều lần (xem postmortem 2026-06-26-threads-caption-limit-duplicate-posts.md
// — trước đây phải đợi user hỏi mới phát hiện 13 lần đăng trùng).

const RETRY_STATE_FILE = path.join(__dirname, '.retry-state.json');

function trackRetry(file) {
  let state = { file: null, count: 0 };
  try { state = JSON.parse(fs.readFileSync(RETRY_STATE_FILE, 'utf8')); } catch {}
  state = state.file === file ? { file, count: state.count + 1 } : { file, count: 1 };
  fs.writeFileSync(RETRY_STATE_FILE, JSON.stringify(state));
  if (state.count > 2) {
    console.warn(`⚠️  STUCK: file ${file} đã thử ${state.count} lần liên tiếp — kiểm tra log lỗi platform critical (Facebook/Instagram) phía trên.`);
  }
}

function markDone(file, fromDone) {
  if (fromDone) {
    // Tái đăng: đẩy file xuống cuối vòng quay (re-timestamp) để các bài khác được luân phiên trước
    const originalName = file.replace(/^\d+-/, '');
    fs.renameSync(path.join(DONE_DIR, file), path.join(DONE_DIR, `${Date.now()}-${originalName}`));
    return;
  }
  const src = path.join(QUEUE_DIR, file);
  const dest = path.join(DONE_DIR, `${Date.now()}-${file}`);
  fs.renameSync(src, dest);
}

// Tách block hashtag (dòng cuối cùng, toàn token bắt đầu bằng #) ra khỏi nội dung chính.
// Facebook & Threads: đăng caption KHÔNG hashtag (hashtag không giúp reach, dễ trông spam).
// Instagram: giữ nguyên caption + hashtag (hashtag là tín hiệu discovery cho Explore).
function splitCaptionAndHashtags(raw) {
  const lines = raw.split('\n');
  let lastIdx = lines.length - 1;
  while (lastIdx >= 0 && lines[lastIdx].trim() === '') lastIdx--;
  const lastLine = (lines[lastIdx] || '').trim();
  const isHashtagLine = lastLine.length > 0 && lastLine.split(/\s+/).every(tok => tok.startsWith('#'));
  if (!isHashtagLine) return { body: raw.trim(), hashtags: '' };

  let bodyEnd = lastIdx - 1;
  while (bodyEnd >= 0 && lines[bodyEnd].trim() === '') bodyEnd--;
  const body = lines.slice(0, bodyEnd + 1).join('\n').trim();
  return { body, hashtags: lastLine };
}

function listQueue() {
  ensureDirs();
  const files = fs.readdirSync(QUEUE_DIR)
    .filter(f => f.endsWith('.txt'))
    .sort();

  if (files.length === 0) {
    console.log('📭 Queue trống');
    return;
  }

  console.log(`\n📋 QUEUE (${files.length} bài chờ đăng):\n`);
  files.forEach((f, i) => {
    const text = fs.readFileSync(path.join(QUEUE_DIR, f), 'utf8').trim();
    console.log(`[${i + 1}] ${f}\n    ${text.slice(0, 80)}…\n`);
  });

  const done = fs.readdirSync(DONE_DIR).length;
  console.log(`✅ Đã đăng: ${done} bài`);
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────

function httpPost(url, payload, headers = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...headers,
      },
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    }).on('error', reject);
  });
}

// FB Reels bước "transfer" (trỏ tới video qua URL public) cần file_url + Authorization
// truyền qua HEADER, không phải JSON body — khác mọi call khác trong file này.
function httpPostHeaders(url, headers) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req = https.request(
      { hostname: urlObj.hostname, path: urlObj.pathname + urlObj.search, method: 'POST', headers },
      res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
          catch { resolve({ status: res.statusCode, body: data }); }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Threads text (giới hạn cứng 500 ký tự, caption gốc luôn dài hơn) ──────────

const SLOGAN = 'Đồ cũ người này, Báu vật người kia';

// Hash đơn giản + rotate — dùng để chọn hook/hashtag khác nhau theo từng caption
// một cách tái lập được (không dùng Math.random() để không đổi mỗi lần chạy lại).
function hashOf(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}
function pick(pool, seed) {
  return pool[hashOf(seed) % pool.length];
}

// Threads là nơi trò chuyện ngắn/đời thường — không nên đăng lại nguyên giọng
// caption FB/IG rút gọn (phát hiện qua đánh giá 2026-08-31, xem feedback_content_
// qa_checklist_before_campaign.md). LƯU Ý: dù giọng đời thường, MỌI câu vẫn phải
// nhắc rõ "Đặc định số 2" — Threads không có ngữ cảnh trang/album như FB/IG, người
// lướt qua lần đầu chưa follow sẽ không biết đây là nội dung gì nếu thiếu chi tiết
// này (phát hiện lại lần 2, sau khi bản đầu bỏ sót ở 3/6 câu).
const THREADS_OPENERS = [
  'Ê mọi người, thử câu ôn thi Đặc định số 2 hôm nay xem 👀',
  'Câu hỏi ôn thi Đặc định số 2 hôm nay nè, ai đoán được không?',
  'Đố vui ôn thi Đặc định số 2 ngành nhà hàng nào 👇',
  'Câu ôn thi Đặc định số 2 này nhìn dễ mà nhiều người sai đó',
  'Ai đang ôn Đặc định số 2 vào đoán câu này thử',
  'Góc ôn thi Đặc định số 2 hôm nay — câu này khá hay đó',
];

function buildThreadsText(body) {
  const lines = body.split('\n').map(l => l.trim()).filter(Boolean);
  const originalGreeting = lines[0] || '';
  const jaSeed = lines.find(l => l.startsWith('📝 ')) || originalGreeting;
  const greeting = isQuestionCaption(body) ? pick(THREADS_OPENERS, jaSeed) : originalGreeting;

  // Caption dạng "Câu hỏi ôn thi" — giữ câu hỏi JA+VI để người đọc thử sức, không
  // gắn slogan/link marketplace (xem generate-card-dac-dinh.js — ảnh card đã tách
  // riêng từ 2026-07-20, nhưng hàm này bị bỏ sót tới khi phát hiện ngày 2026-07-28).
  // Câu dạng tình huống (scenario, thêm 2026-08-17) có dòng 📝/🇻🇳 dài hơn nhiều vì
  // gộp cả bối cảnh + câu hỏi — cắt CTA/link trước, ưu tiên giữ nguyên link luôn
  // hiện đủ (không để bị cắt cụt như lần đầu phát hiện: text dài 500 ký tự nhưng
  // mất hẳn phần link vì slice() cắt mù từ cuối chuỗi đã ghép).
  if (isQuestionCaption(body)) {
    const topic = lines[1] || '';
    let jaLine = lines.find(l => l.startsWith('📝 ')) || '';
    let viLine = lines.find(l => l.startsWith('🇻🇳 ')) || '';
    const cta = 'Comment đáp án của anh chị trước khi xem giải thích nhé 👇';
    const link = '🌐 Xem đầy đủ đáp án + giải thích: traotay.com.vn/dac-dinh';

    const fixedLen = [greeting, topic, cta, link].filter(Boolean).join('\n\n').length + 4; // +4: 2 dòng ja/vi thêm \n\n
    let budget = 500 - fixedLen;
    if (jaLine.length + viLine.length > budget) {
      const jaBudget = Math.max(30, Math.floor(budget * 0.55));
      const viBudget = Math.max(30, budget - jaBudget);
      // Tiếng Nhật không có khoảng trắng giữa từ — cắt thẳng theo ký tự + "…".
      if (jaLine.length > jaBudget) jaLine = jaLine.slice(0, jaBudget - 1).trim() + '…';
      // Tiếng Việt — cắt tại ranh giới từ gần nhất để không đứt giữa chữ.
      if (viLine.length > viBudget) {
        const slice = viLine.slice(0, viBudget - 1);
        const lastSpace = slice.lastIndexOf(' ');
        viLine = (lastSpace > viBudget * 0.5 ? slice.slice(0, lastSpace) : slice).trim() + '…';
      }
    }

    let text = [greeting, topic, jaLine, viLine, cta, link].filter(Boolean).join('\n\n');
    // An toàn cuối (không nên xảy ra vì đã tính budget ở trên) — bỏ CTA trước,
    // luôn giữ link vì đó là mục đích chính của bài đăng.
    if (text.length > 500) text = [greeting, topic, jaLine, viLine, link].filter(Boolean).join('\n\n');
    if (text.length > 500) text = [topic, jaLine, link].filter(Boolean).join('\n\n');
    return text;
  }

  // Caption /dac-dinh dạng giới thiệu (không phải câu hỏi) — giữ 2 bullet đầu để
  // đủ ngữ cảnh thay vì chỉ 1 dòng cộc lốc, trỏ đúng /dac-dinh.
  if (isDacDinhCaption(body)) {
    const bullets = lines.filter(l => /^[\u{1F300}-\u{1FAFF}☀-➿]/u.test(l)).slice(0, 2).join('\n');
    let text = [greeting, bullets, '🌐 Xem chi tiết + ôn thi miễn phí: traotay.com.vn/dac-dinh'].filter(Boolean).join('\n\n');
    if (text.length > 500) text = text.slice(0, 497) + '...';
    return text;
  }

  const opening = lines[1] || lines[0] || '';
  const bullet = lines.find(l => /^[\u{1F300}-\u{1FAFF}☀-➿]/u.test(l)) || '';
  let text = [opening, bullet, `"${SLOGAN}"`, '🌐 traotay.com.vn'].filter(Boolean).join('\n\n');
  if (text.length > 500) text = text.slice(0, 497) + '...';
  return text;
}

// ─── Platforms ────────────────────────────────────────────────────────────────

async function postFacebook(caption, imageUrl) {
  const pageId = process.env.FB_PAGE_ID;
  const token = process.env.FB_PAGE_ACCESS_TOKEN;
  if (!pageId || !token) return { platform: 'Facebook Page', skipped: true, reason: 'chưa set credentials' };

  // Có ảnh → đăng kèm ảnh qua /photos (caption làm chú thích ảnh).
  // Không có ảnh (lỗi render/upload) → fallback /feed text-only như cũ.
  const res = imageUrl
    ? await httpPost(
        `https://graph.facebook.com/v19.0/${pageId}/photos?access_token=${token}`,
        { url: imageUrl, caption }
      )
    : await httpPost(
        `https://graph.facebook.com/v19.0/${pageId}/feed?access_token=${token}`,
        { message: caption }
      );

  if (res.status === 200 && res.body.id) return { platform: 'Facebook Page', ok: true, id: res.body.id };
  return { platform: 'Facebook Page', ok: false, error: res.body?.error?.message || JSON.stringify(res.body) };
}

async function postInstagram(caption, imageUrl) {
  const accountId = process.env.IG_ACCOUNT_ID;
  const token = process.env.IG_ACCESS_TOKEN;
  const finalImageUrl = imageUrl || process.env.IG_DEFAULT_IMAGE_URL || 'https://traotay.com.vn/og-image.jpg';
  if (!accountId || !token) return { platform: 'Instagram', skipped: true, reason: 'chưa set credentials' };

  // Bước 1: Tạo container IMAGE (Instagram bắt buộc phải có ảnh)
  const containerRes = await httpPost(
    `https://graph.facebook.com/v19.0/${accountId}/media?access_token=${token}`,
    { image_url: finalImageUrl, caption }
  );

  if (!containerRes.body?.id) {
    return { platform: 'Instagram', ok: false, error: containerRes.body?.error?.message || JSON.stringify(containerRes.body) };
  }

  // Bước 2: Publish
  const publishRes = await httpPost(
    `https://graph.facebook.com/v19.0/${accountId}/media_publish?access_token=${token}`,
    { creation_id: containerRes.body.id }
  );

  if (publishRes.body?.id) return { platform: 'Instagram', ok: true, id: publishRes.body.id };
  return { platform: 'Instagram', ok: false, error: publishRes.body?.error?.message || JSON.stringify(publishRes.body) };
}

// ─── Video Reels rollout theo giờ (dần dò) ────────────────────────────────
// Convert rõ ràng bằng Intl, không phụ thuộc OS timezone của máy chạy script
// (EC2 system time là UTC — xác nhận từ setup-cron.sh "0 1-15 * * *" = 8h-22h VN).

function getCurrentHourVN() {
  const h = new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', hour12: false });
  return parseInt(h, 10) % 24;
}

function isVideoSlot() {
  const raw = process.env.VIDEO_REELS_HOURS; // vd "12,19" — để trống = không bao giờ video
  if (!raw) return false;
  return raw.split(',').map(h => parseInt(h.trim(), 10)).includes(getCurrentHourVN());
}

// 3-phase: start (lấy video_id) → transfer (trỏ tới videoUrl public qua header) → finish (publish).
// Xem docs/video-api/guides/reels-publishing chính thức — verify lại nếu Meta đổi version/field.
async function postFacebookReel(caption, videoUrl) {
  const pageId = process.env.FB_PAGE_ID;
  const token = process.env.FB_PAGE_ACCESS_TOKEN;
  if (!pageId || !token) return { platform: 'Facebook Reel', skipped: true, reason: 'chưa set credentials' };

  const startRes = await httpPost(
    `https://graph.facebook.com/v19.0/${pageId}/video_reels?access_token=${token}`,
    { upload_phase: 'start' }
  );
  const videoId = startRes.body?.video_id;
  if (!videoId) return { platform: 'Facebook Reel', ok: false, error: startRes.body?.error?.message || JSON.stringify(startRes.body) };

  const transferRes = await httpPostHeaders(
    `https://rupload.facebook.com/video-upload/v19.0/${videoId}`,
    { Authorization: `OAuth ${token}`, file_url: videoUrl }
  );
  if (transferRes.status !== 200) {
    return { platform: 'Facebook Reel', ok: false, error: transferRes.body?.error?.message || JSON.stringify(transferRes.body) };
  }

  const finishRes = await httpPost(
    `https://graph.facebook.com/v19.0/${pageId}/video_reels?access_token=${token}`,
    { video_id: videoId, upload_phase: 'finish', video_state: 'PUBLISHED', description: caption }
  );
  if (!finishRes.body?.success) {
    return { platform: 'Facebook Reel', ok: false, error: finishRes.body?.error?.message || JSON.stringify(finishRes.body) };
  }
  return { platform: 'Facebook Reel', ok: true, id: videoId };
}

// Container REELS (như ảnh) nhưng Instagram xử lý video bất đồng bộ — phải poll
// status_code cho tới FINISHED trước khi publish, khác hẳn ảnh (publish ngay).
async function postInstagramReel(caption, videoUrl) {
  const accountId = process.env.IG_ACCOUNT_ID;
  const token = process.env.IG_ACCESS_TOKEN;
  if (!accountId || !token) return { platform: 'Instagram Reel', skipped: true, reason: 'chưa set credentials' };

  const containerRes = await httpPost(
    `https://graph.facebook.com/v19.0/${accountId}/media?access_token=${token}`,
    { media_type: 'REELS', video_url: videoUrl, caption, share_to_feed: true }
  );
  const creationId = containerRes.body?.id;
  if (!creationId) return { platform: 'Instagram Reel', ok: false, error: containerRes.body?.error?.message || JSON.stringify(containerRes.body) };

  let statusCode = null;
  for (let attempt = 0; attempt < 20; attempt++) {
    await sleep(3000);
    const statusRes = await httpGet(
      `https://graph.facebook.com/v19.0/${creationId}?fields=status_code&access_token=${token}`
    );
    statusCode = statusRes.body?.status_code;
    if (statusCode === 'FINISHED') break;
    if (statusCode === 'ERROR') return { platform: 'Instagram Reel', ok: false, error: 'status_code=ERROR khi xử lý video' };
  }
  if (statusCode !== 'FINISHED') {
    return { platform: 'Instagram Reel', ok: false, error: `Timeout chờ xử lý video sau 60s (status_code cuối: ${statusCode})` };
  }

  const publishRes = await httpPost(
    `https://graph.facebook.com/v19.0/${accountId}/media_publish?access_token=${token}`,
    { creation_id: creationId }
  );
  if (publishRes.body?.id) return { platform: 'Instagram Reel', ok: true, id: publishRes.body.id };
  return { platform: 'Instagram Reel', ok: false, error: publishRes.body?.error?.message || JSON.stringify(publishRes.body) };
}

// Threads không critical: lỗi Threads (vd vượt 500 ký tự) không được chặn
// FB/Instagram advance queue — tránh đăng trùng lặp lên 2 nền tảng chính
// mỗi giờ khi Threads cứ lỗi mãi (sự cố thật 2026-06-26: 1 bài bị đăng trùng
// 13 lần lên FB+IG vì Threads lỗi chặn markDone).
async function postThreads(body, imageUrl) {
  const userId = process.env.THREADS_USER_ID;
  const token = process.env.THREADS_ACCESS_TOKEN;
  if (!userId || !token) return { platform: 'Threads', skipped: true, reason: 'chưa set credentials' };

  const text = buildThreadsText(body);
  const createRes = await httpPost(
    `https://graph.threads.net/v1.0/${userId}/threads`,
    imageUrl
      ? { media_type: 'IMAGE', image_url: imageUrl, text, access_token: token }
      : { media_type: 'TEXT', text, access_token: token }
  );
  if (!createRes.body?.id) return { platform: 'Threads', ok: false, error: createRes.body?.error?.message || JSON.stringify(createRes.body) };

  const publishRes = await httpPost(
    `https://graph.threads.net/v1.0/${userId}/threads_publish`,
    { creation_id: createRes.body.id, access_token: token }
  );
  if (publishRes.body?.id) return { platform: 'Threads', ok: true, id: publishRes.body.id };
  return { platform: 'Threads', ok: false, error: publishRes.body?.error?.message || JSON.stringify(publishRes.body) };
}


// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (isListQueue) { listQueue(); return; }

  if (!isDryRun && !acquireLock()) {
    console.warn('⏭️  Job trước còn chạy (lock < 10 phút) — skip lượt này, đợi cron giờ sau.');
    return;
  }

  try {
    await runOnce();
  } finally {
    if (!isDryRun) releaseLock();
  }
}

async function runOnce() {
  if (!isDryRun && !reserveDailySlot()) {
    console.log(`⏭️  Đã đủ ${DAILY_CAP} bài hôm nay (${getTodayVN()} giờ VN) — bỏ qua lượt cron này, đợi mai.`);
    return;
  }

  const { caption, file, fromDone } = getNextCaption();
  const { body, hashtags } = splitCaptionAndHashtags(caption);
  const igCaption = hashtags ? `${body}\n\n${hashtags}` : body;

  console.log('\n📣 TRAO TAY — SOCIAL AUTO-POSTER');
  console.log(`🕐 ${new Date().toISOString()}`);
  console.log('═'.repeat(50));
  console.log(`📄 File: ${file}${fromDone ? ' (tái sử dụng từ done/)' : ''}`);
  if (!isDryRun) trackRetry(file);
  console.log(`📝 Caption (${caption.length} ký tự):\n${caption.slice(0, 120)}${caption.length > 120 ? '…' : ''}`);
  console.log('═'.repeat(50));

  if (isDryRun) {
    console.log(`🎬 Slot giờ VN ${getCurrentHourVN()}h: ${isVideoSlot() ? 'VIDEO Reels' : 'ảnh tĩnh'} (VIDEO_REELS_HOURS=${process.env.VIDEO_REELS_HOURS || '(trống)'})`);
    console.log('\n🔍 DRY RUN — không đăng thật, không render/upload ảnh/video\n');
    console.log(`🖼️  Hook ảnh sẽ dùng: "${extractHook(caption)}"`);
    console.log('--- Facebook (không hashtag) ---');
    console.log(body);
    console.log('--- Instagram (kèm hashtag) ---');
    console.log(igCaption);
    console.log(`--- Threads (rút gọn ≤500 ký tự, ${buildThreadsText(body).length} ký tự) ---`);
    console.log(buildThreadsText(body));
    return;
  }

  // Slot video (giờ vàng, dần dò qua VIDEO_REELS_HOURS) — lỗi bất kỳ bước nào
  // (getOrCreateReelUrl/getOrCreateQuestionReelUrl không throw) đều fallback êm
  // về ảnh tĩnh, không chặn lượt đăng.
  // Caption "Câu hỏi ôn thi" /dac-dinh dùng Reel riêng (generate-video-dac-dinh.js,
  // từ 2026-07-28). Caption /dac-dinh dạng giới thiệu (không phải câu hỏi) TẠM vẫn
  // dùng ảnh tĩnh — getOrCreateReelUrl() chỉ render template Reel marketplace
  // ("Mua • Bán • Cho tặng"), chưa có bản riêng cho dạng này.
  let videoUrl = null;
  if (isVideoSlot() && isQuestionCaption(caption)) {
    console.log('🎬 Slot VIDEO_REELS_HOURS — thử render Reel câu hỏi /dac-dinh...');
    videoUrl = await getOrCreateQuestionReelUrl(file, caption);
    if (videoUrl) console.log(`🎬 Video: ${videoUrl}`);
    else console.warn('⚠️  Render Reels thất bại — fallback ảnh tĩnh cho slot này.');
  } else if (isVideoSlot() && !isDacDinhCaption(caption)) {
    console.log('🎬 Slot VIDEO_REELS_HOURS — thử render Reels...');
    videoUrl = await getOrCreateReelUrl(file, caption);
    if (videoUrl) console.log(`🎬 Video: ${videoUrl}`);
    else console.warn('⚠️  Render Reels thất bại — fallback ảnh tĩnh cho slot này.');
  } else if (isVideoSlot()) {
    console.log('🎬 Slot VIDEO_REELS_HOURS — bỏ qua Reel cho caption /dac-dinh dạng giới thiệu (chưa có template riêng), dùng ảnh tĩnh.');
  }

  // Ảnh thương hiệu riêng cho caption này — render + upload MinIO (cache nếu đã có).
  // Luôn render dù đã có video: Threads luôn cần ảnh tĩnh, và đây cũng là fallback
  // tự nhiên cho FB/IG nếu videoUrl null. Lỗi (MinIO down, font thiếu...) không
  // được làm fail cả bài đăng — fallback text-only.
  let imageUrl = null;
  try {
    imageUrl = await getOrCreateCardUrlSmart(file, caption);
    console.log(`🖼️  Ảnh: ${imageUrl}`);
  } catch (err) {
    console.warn(`⚠️  Không tạo được ảnh (${err.message}) — đăng text-only.`);
  }

  const results = await Promise.allSettled([
    videoUrl ? postFacebookReel(body, videoUrl) : postFacebook(body, imageUrl),
    videoUrl ? postInstagramReel(igCaption, videoUrl) : postInstagram(igCaption, imageUrl),
    postThreads(body, imageUrl), // luôn ảnh tĩnh, không đổi dù slot này có video hay không
  ]);

  console.log('\n📊 KẾT QUẢ:\n');
  let allOk = true;
  // Facebook & Instagram critical (lỗi thì giữ bài lại để retry giờ sau).
  // Threads không critical: lỗi Threads không được chặn FB/IG advance queue.
  const PLATFORM_CRITICAL = [true, true, false];

  results.forEach((r, i) => {
    const result = r.status === 'fulfilled' ? r.value : { platform: '?', ok: false, error: r.reason?.message };
    if (result.skipped) {
      console.log(`⏭️  ${result.platform}: bỏ qua — ${result.reason}`);
    } else if (result.ok) {
      console.log(`✅ ${result.platform}: thành công (id: ${result.id})`);
    } else {
      console.log(`❌ ${result.platform}: lỗi — ${result.error}`);
      if (PLATFORM_CRITICAL[i]) allOk = false;
    }
  });

  console.log('\n' + '═'.repeat(50));

  if (allOk) {
    markDone(file, fromDone);
    setLastType(captionType(caption));
    fs.writeFileSync(RETRY_STATE_FILE, JSON.stringify({ file: null, count: 0 }));
    const remaining = fs.readdirSync(QUEUE_DIR).filter(f => f.endsWith('.txt')).length;
    console.log(`🗑️  ${file} → done/`);
    console.log(`📋 Queue còn lại: ${remaining} bài`);
    if (remaining === 0) {
      console.log('🔁 Queue trống — từ giờ tự tái sử dụng bài cũ theo vòng (cũ nhất trước). Chạy /len-bai để thêm caption mới, tránh lặp bài trong ngày.');
    } else if (remaining <= 2) {
      console.log('⚠️  Queue sắp hết! Hãy chạy /len-bai để tạo thêm caption.');
    }
  } else {
    process.exitCode = 1;
  }
}

main().catch(err => {
  console.error('💥 Lỗi:', err.message);
  process.exit(1);
});
