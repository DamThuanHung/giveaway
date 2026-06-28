#!/usr/bin/env node
/**
 * Sinh video Reels ngắn (Ken Burns) từ card thương hiệu Trao Tay cho mỗi caption,
 * upload lên MinIO, dùng cho Facebook/Instagram Reels (xem post-all.js).
 *
 * Tái dùng renderCardPng/extractHook từ generate-card.js — KHÔNG sửa file đó để
 * không ảnh hưởng luồng ảnh tĩnh đang chạy ổn định.
 *
 * Usage:
 *   node scripts/social/generate-video.js --test    # render test-reel.mp4 ra local, không cần MinIO
 *   require('./generate-video').getOrCreateReelUrl(file, captionText)
 */

const fs = require('fs');
const fsp = require('fs/promises');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const Minio = require('minio');
const { extractHook, renderCardPng } = require('./generate-card');

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

const DURATION_SEC = parseInt(process.env.VIDEO_REEL_DURATION_SEC || '8', 10);
const FPS = parseInt(process.env.VIDEO_REEL_FPS || '25', 10);
const CARD_BG = '#FFFBF5'; // phải khớp generate-card.js — pad nền liền mạch với card, không letterbox đen
const TMP_DIR = path.join(__dirname, 'tmp');
const MUSIC_DIR = path.join(__dirname, 'assets', 'music');

// ─── ffmpeg helpers ─────────────────────────────────────────────────────────

function ffmpegExec(args, timeoutMs = 60_000) {
  return new Promise((resolve, reject) => {
    execFile('ffmpeg', args, { timeout: timeoutMs, maxBuffer: 20 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        if (err.code === 'ENOENT') return reject(new Error('ffmpeg chưa cài trên máy này — chạy: sudo apt-get install -y ffmpeg'));
        return reject(new Error(`ffmpeg lỗi: ${stderr.slice(-2000)}`));
      }
      resolve();
    });
  });
}

function ffprobeDurationSec(filePath) {
  return new Promise((resolve, reject) => {
    execFile('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', filePath],
      { timeout: 15_000 }, (err, stdout) => {
        if (err) return reject(new Error(`ffprobe lỗi: ${err.message}`));
        resolve(parseFloat(stdout.trim()));
      });
  });
}

// Chọn random 1 file nhạc trong assets/music/ — trả null nếu chưa có (fallback track câm).
function pickMusicFile() {
  if (!fs.existsSync(MUSIC_DIR)) return null;
  const files = fs.readdirSync(MUSIC_DIR).filter(f => /\.(mp3|wav|m4a)$/i.test(f));
  if (files.length === 0) return null;
  return path.join(MUSIC_DIR, files[Math.floor(Math.random() * files.length)]);
}

// Pad ảnh vuông 1080x1080 vào khung 9:16 (màu nền = màu card, không letterbox đen) + Ken Burns zoom nhẹ.
// Instagram có thể reject Reels hoàn toàn không có audio stream — luôn cần 1 track,
// dù im lặng (anullsrc), không phải video thiếu hẳn audio.
function buildFfmpegArgs({ cardPngPath, musicPath, durationSec, fps, outputPath }) {
  const totalFrames = durationSec * fps;
  const fadeStart = Math.max(0, durationSec - 1.5);
  const videoFilter = `[0:v]scale=1080:1080,pad=1080:1920:0:(1920-1080)/2:color=0x${CARD_BG.replace('#', '')},` +
    `zoompan=z='min(zoom+0.0008,1.12)':d=${totalFrames}:s=1080x1920:fps=${fps}[v]`;

  const inputs = ['-y', '-loop', '1', '-i', cardPngPath];
  let filterComplex, audioMap;

  if (musicPath) {
    inputs.push('-i', musicPath);
    filterComplex = `${videoFilter};[1:a]atrim=0:${durationSec},afade=t=out:st=${fadeStart}:d=1.5[a]`;
    audioMap = ['-map', '[a]'];
  } else {
    inputs.push('-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000');
    filterComplex = videoFilter;
    audioMap = ['-map', '1:a'];
  }

  return [
    ...inputs,
    '-filter_complex', filterComplex,
    '-map', '[v]', ...audioMap,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.0',
    '-r', String(fps), '-t', String(durationSec),
    '-c:a', 'aac', '-ar', '48000', '-b:a', '128k',
    '-shortest',
    outputPath,
  ];
}

async function renderReelMp4(cardPngBuffer) {
  await fsp.mkdir(TMP_DIR, { recursive: true });
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const cardPngPath = path.join(TMP_DIR, `card-${id}.png`);
  const outputPath = path.join(TMP_DIR, `reel-${id}.mp4`);

  try {
    await fsp.writeFile(cardPngPath, cardPngBuffer);
    const musicPath = pickMusicFile();
    const args = buildFfmpegArgs({ cardPngPath, musicPath, durationSec: DURATION_SEC, fps: FPS, outputPath });
    await ffmpegExec(args);

    const actualDuration = await ffprobeDurationSec(outputPath);
    if (Math.abs(actualDuration - DURATION_SEC) > 1 || actualDuration > 90) {
      throw new Error(`Duration render sai (${actualDuration}s, mong đợi ~${DURATION_SEC}s) — không upload video lỗi spec`);
    }

    return await fsp.readFile(outputPath);
  } finally {
    await fsp.rm(cardPngPath, { force: true });
    await fsp.rm(outputPath, { force: true });
  }
}

// ─── MinIO upload (cùng bucket với ảnh, key riêng social-reels/) ──────────────

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

// Không throw ra ngoài — lỗi ở bất kỳ bước nào (ffmpeg/MinIO) đều trả null,
// để post-all.js chỉ cần `if (videoUrl)` mà không cần thêm try/catch riêng,
// luôn fallback an toàn về ảnh tĩnh cho slot đó.
async function getOrCreateReelUrl(file, captionText) {
  try {
    const key = `social-reels/${path.basename(file, '.txt')}.mp4`;
    const url = `${PUBLIC_URL}/${BUCKET}/${key}`;
    const client = getMinioClient();

    try {
      await client.statObject(BUCKET, key);
      return url; // cache hit
    } catch {
      // chưa có, render mới
    }

    const hook = extractHook(captionText);
    const cardPng = await renderCardPng(hook);
    const mp4Buffer = await renderReelMp4(cardPng);
    await client.putObject(BUCKET, key, mp4Buffer, mp4Buffer.length, { 'Content-Type': 'video/mp4' });
    return url;
  } catch (err) {
    console.warn(`⚠️  Không tạo được video (${err.message}) — fallback ảnh tĩnh.`);
    return null;
  }
}

module.exports = { getOrCreateReelUrl, pickMusicFile, buildFfmpegArgs, renderReelMp4 };

// ─── CLI test mode — render 1 video mẫu ra file local, không cần MinIO ────────

if (require.main === module && process.argv.includes('--test')) {
  const sampleCaption = `Chào anh chị!

Mua bán đồ cũ online, sợ nhất là gì?

📍 Gặp mặt trực tiếp giao nhận — không cần chuyển khoản trước cho người lạ
💬 Chat ngay trong app

*"Đồ cũ người này, Báu vật người kia"*
`;
  (async () => {
    try {
      const hook = extractHook(sampleCaption);
      console.log(`🎬 Render test reel, hook: "${hook}"`);
      const cardPng = await renderCardPng(hook);
      const mp4Buffer = await renderReelMp4(cardPng);
      const outPath = path.join(__dirname, 'test-reel.mp4');
      fs.writeFileSync(outPath, mp4Buffer);
      console.log('✅ Đã render video mẫu:', outPath, `(${(mp4Buffer.length / 1024).toFixed(0)} KB)`);
      console.log(`🎵 Nhạc nền: ${pickMusicFile() ? 'có' : 'không có file trong assets/music/ — dùng track câm'}`);
    } catch (err) {
      console.error('❌ Lỗi render:', err);
      process.exit(1);
    }
  })();
}
