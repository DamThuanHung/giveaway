#!/usr/bin/env node
/**
 * Kiểm tra hạn token Facebook/Instagram/Threads hàng tuần — tránh lặp lại sự cố
 * 2026-08-24: token Threads hết hạn âm thầm, không ai biết cho tới khi user tự
 * phát hiện 6 ngày sau (87 bài lỗi liên tục, xem feedback_content_qa_checklist_
 * before_campaign.md mục bổ sung 2026-08-30 gốc rễ khác — vụ token này riêng).
 *
 * - Facebook/Instagram: dùng CHUNG 1 Page token không hết hạn (expires_at=0),
 *   nhưng có `data_access_expires_at` riêng (~1 năm/lần) — không tự refresh được
 *   qua API, cần user vào lại Meta xác nhận lại quyền. Script chỉ CẢNH BÁO khi
 *   còn <14 ngày, không tự sửa được.
 * - Threads: token dài hạn 60 ngày, refresh được qua API nếu làm TRƯỚC khi hết
 *   hạn — script này chủ động refresh mỗi tuần (well trong hạn 60 ngày) nên
 *   không bao giờ để token Threads tự hết hạn nữa như lần trước.
 *
 * Chạy qua cron hàng tuần (xem setup-cron.sh) — không cần chạy tay trừ khi debug.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

function loadEnvFile(file, target = process.env) {
  if (!fs.existsSync(file)) return;
  fs.readFileSync(file, 'utf8')
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('#'))
    .forEach(line => {
      const [key, ...rest] = line.split('=');
      if (key && rest.length) target[key.trim()] = rest.join('=').trim();
    });
}

const ENV_FILE = path.join(__dirname, '.env');
const ENV_DOCKER = path.join(__dirname, '..', '..', '.env.docker');
loadEnvFile(ENV_FILE);
loadEnvFile(ENV_DOCKER); // RESEND_API_KEY, ADMIN_EMAILS

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', c => (data += c));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve({ raw: data }); }
      });
    }).on('error', reject);
  });
}

function sendAlertEmail(subject, html) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.RESEND_API_KEY;
    const adminEmail = (process.env.ADMIN_EMAILS || '').split(',')[0].trim();
    if (!apiKey || !adminEmail) {
      console.warn('⚠️  RESEND_API_KEY/ADMIN_EMAILS chưa cấu hình — không gửi được email cảnh báo.');
      return resolve(false);
    }
    const body = JSON.stringify({
      from: 'Trao Tay <noreply@traotay.com.vn>',
      to: adminEmail,
      subject,
      html,
    });
    const req = https.request(
      {
        hostname: 'api.resend.com', path: '/emails', method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      },
      res => {
        let data = '';
        res.on('data', c => (data += c));
        res.on('end', () => resolve(res.statusCode === 200 || res.statusCode === 201));
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const WARN_DAYS = 14;
const now = Date.now();

async function checkFacebookInstagram() {
  const token = process.env.FB_PAGE_ACCESS_TOKEN;
  if (!token) return { ok: false, warn: false, message: 'FB_PAGE_ACCESS_TOKEN chưa cấu hình.' };

  const res = await get(`https://graph.facebook.com/v19.0/debug_token?input_token=${token}&access_token=${token}`);
  const d = res.data;
  if (!d || !d.is_valid) {
    return { ok: false, warn: true, message: `Token Facebook/Instagram KHÔNG HỢP LỆ: ${JSON.stringify(res.error || res)}` };
  }

  const dataAccessMs = d.data_access_expires_at ? d.data_access_expires_at * 1000 : null;
  const daysLeft = dataAccessMs ? Math.floor((dataAccessMs - now) / 86400000) : null;
  const expiresAtMs = d.expires_at ? d.expires_at * 1000 : null; // 0/undefined = không hết hạn

  const lines = [
    `Token đăng bài: ${expiresAtMs ? new Date(expiresAtMs).toISOString() : 'không hết hạn'}`,
    `Data access expires: ${dataAccessMs ? new Date(dataAccessMs).toISOString() + ` (còn ${daysLeft} ngày)` : 'không rõ'}`,
  ];
  console.log('📘 Facebook/Instagram —', lines.join(' | '));

  if (daysLeft !== null && daysLeft <= WARN_DAYS) {
    return {
      ok: true, warn: true,
      message: `Data access của token Facebook/Instagram sắp hết hạn (còn ${daysLeft} ngày, hạn ${new Date(dataAccessMs).toISOString().slice(0, 10)}). Cần vào lại Meta Business Suite / Graph API Explorer xác nhận lại quyền truy cập trước hạn này — không tự refresh được qua API.`,
    };
  }
  return { ok: true, warn: false, message: lines.join(' | ') };
}

async function refreshThreadsToken() {
  const token = process.env.THREADS_ACCESS_TOKEN;
  if (!token) return { ok: false, warn: false, message: 'THREADS_ACCESS_TOKEN chưa cấu hình.' };

  const res = await get(`https://graph.threads.net/refresh_access_token?grant_type=th_refresh_token&access_token=${token}`);
  if (!res.access_token) {
    return {
      ok: false, warn: true,
      message: `Refresh token Threads THẤT BẠI — token có thể đã hết hạn: ${JSON.stringify(res.error || res)}. Cần lấy token mới thủ công qua "Công cụ tạo mã người dùng" trên Meta (xem hướng dẫn đã dùng lần trước).`,
    };
  }

  const expiresAtMs = now + (res.expires_in || 0) * 1000;
  const newEnvContent = fs.readFileSync(ENV_FILE, 'utf8').replace(
    /^THREADS_ACCESS_TOKEN=.*$/m,
    `THREADS_ACCESS_TOKEN=${res.access_token}`
  );
  fs.writeFileSync(ENV_FILE, newEnvContent);
  console.log(`🧵 Threads — refresh thành công, hạn mới: ${new Date(expiresAtMs).toISOString()}`);
  return { ok: true, warn: false, message: `Refresh thành công — hạn mới ${new Date(expiresAtMs).toISOString().slice(0, 10)}.` };
}

async function main() {
  console.log(`\n🔑 KIỂM TRA TOKEN — ${new Date().toISOString()}`);
  console.log('═'.repeat(50));

  const results = await Promise.allSettled([checkFacebookInstagram(), refreshThreadsToken()]);
  const [fbIg, threads] = results.map(r => (r.status === 'fulfilled' ? r.value : { ok: false, warn: true, message: r.reason?.message || String(r.reason) }));

  const warnings = [];
  if (fbIg.warn) warnings.push(`<b>Facebook/Instagram:</b> ${fbIg.message}`);
  if (threads.warn) warnings.push(`<b>Threads:</b> ${threads.message}`);

  if (warnings.length > 0) {
    console.warn('⚠️  Có vấn đề cần xử lý:', warnings.length);
    const html = `<div style="font-family:sans-serif;line-height:1.6">
      <p>Kiểm tra token social hàng tuần phát hiện vấn đề cần anh xử lý:</p>
      <ul>${warnings.map(w => `<li>${w}</li>`).join('')}</ul>
      <p style="color:#7A7A92;font-size:13px">Tự động gửi bởi check-tokens.js — chạy hàng tuần qua cron.</p>
    </div>`;
    const sent = await sendAlertEmail(`⚠️ Token social cần xử lý (${warnings.length} vấn đề)`, html);
    console.log(sent ? '📧 Đã gửi email cảnh báo.' : '📧 Gửi email cảnh báo thất bại hoặc chưa cấu hình.');
  } else {
    console.log('✅ Mọi token đều ổn, không cần gửi cảnh báo.');
  }

  console.log('═'.repeat(50));
}

main().catch(err => {
  console.error('💥 Lỗi kiểm tra token:', err.message);
  process.exit(1);
});
