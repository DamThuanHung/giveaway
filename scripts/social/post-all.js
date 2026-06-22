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
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { extractHook, getOrCreateCardUrl } = require('./generate-card');

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

function getNextCaption() {
  ensureDirs();
  const files = fs.readdirSync(QUEUE_DIR)
    .filter(f => f.endsWith('.txt') && f !== 'done')
    .sort();

  if (files.length > 0) {
    const file = files[0];
    const caption = fs.readFileSync(path.join(QUEUE_DIR, file), 'utf8').trim();
    return { caption, file, fromDone: false };
  }

  // Queue trống → tái sử dụng bài cũ nhất trong done/ (vòng quay round-robin)
  const doneFiles = fs.readdirSync(DONE_DIR)
    .filter(f => f.endsWith('.txt'))
    .sort();

  if (doneFiles.length === 0) {
    console.error('❌ Queue trống và chưa có bài nào từng đăng! Chạy /len-bai để thêm caption.');
    process.exit(1);
  }

  const file = doneFiles[0];
  const caption = fs.readFileSync(path.join(DONE_DIR, file), 'utf8').trim();
  return { caption, file, fromDone: true };
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

async function postThreads(caption, imageUrl) {
  const userId = process.env.THREADS_USER_ID;
  const token = process.env.THREADS_ACCESS_TOKEN;
  if (!userId || !token) return { platform: 'Threads', skipped: true, reason: 'chưa set credentials' };

  const createRes = await httpPost(
    `https://graph.threads.net/v1.0/${userId}/threads`,
    imageUrl
      ? { media_type: 'IMAGE', image_url: imageUrl, text: caption, access_token: token }
      : { media_type: 'TEXT', text: caption, access_token: token }
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

  const { caption, file, fromDone } = getNextCaption();

  console.log('\n📣 TRAO TAY — SOCIAL AUTO-POSTER');
  console.log('═'.repeat(50));
  console.log(`📄 File: ${file}${fromDone ? ' (tái sử dụng từ done/)' : ''}`);
  console.log(`📝 Caption (${caption.length} ký tự):\n${caption.slice(0, 120)}${caption.length > 120 ? '…' : ''}`);
  console.log('═'.repeat(50));

  if (isDryRun) {
    console.log('\n🔍 DRY RUN — không đăng thật, không render/upload ảnh\n');
    console.log(`🖼️  Hook ảnh sẽ dùng: "${extractHook(caption)}"`);
    console.log(caption);
    return;
  }

  // Ảnh thương hiệu riêng cho caption này — render + upload MinIO (cache nếu đã có).
  // Lỗi (MinIO down, font thiếu...) không được làm fail cả bài đăng — fallback text-only.
  let imageUrl = null;
  try {
    imageUrl = await getOrCreateCardUrl(file, caption);
    console.log(`🖼️  Ảnh: ${imageUrl}`);
  } catch (err) {
    console.warn(`⚠️  Không tạo được ảnh (${err.message}) — đăng text-only.`);
  }

  const results = await Promise.allSettled([
    postFacebook(caption, imageUrl),
    postInstagram(caption, imageUrl),
    postThreads(caption, imageUrl),
  ]);

  console.log('\n📊 KẾT QUẢ:\n');
  let allOk = true;

  results.forEach(r => {
    const result = r.status === 'fulfilled' ? r.value : { platform: '?', ok: false, error: r.reason?.message };
    if (result.skipped) {
      console.log(`⏭️  ${result.platform}: bỏ qua — ${result.reason}`);
    } else if (result.ok) {
      console.log(`✅ ${result.platform}: thành công (id: ${result.id})`);
    } else {
      console.log(`❌ ${result.platform}: lỗi — ${result.error}`);
      allOk = false;
    }
  });

  console.log('\n' + '═'.repeat(50));

  if (allOk) {
    markDone(file, fromDone);
    const remaining = fs.readdirSync(QUEUE_DIR).filter(f => f.endsWith('.txt')).length;
    console.log(`🗑️  ${file} → done/`);
    console.log(`📋 Queue còn lại: ${remaining} bài`);
    if (remaining === 0) {
      console.log('🔁 Queue trống — từ giờ tự tái sử dụng bài cũ theo vòng (cũ nhất trước). Chạy /len-bai để thêm caption mới, tránh lặp bài trong ngày.');
    } else if (remaining <= 2) {
      console.log('⚠️  Queue sắp hết! Hãy chạy /len-bai để tạo thêm caption.');
    }
  } else {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('💥 Lỗi:', err.message);
  process.exit(1);
});
