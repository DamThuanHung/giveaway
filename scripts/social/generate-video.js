#!/usr/bin/env node
/**
 * Sinh video Reels ngắn (slideshow build-up 4 giai đoạn) cho mỗi caption,
 * upload lên MinIO, dùng cho Facebook/Instagram Reels (xem post-all.js).
 *
 * Template dọc 1080x1920 riêng cho video (KHÔNG dùng cardTemplate vuông của
 * generate-card.js — pad ảnh vuông vào khung dọc để lại quá nhiều khoảng
 * trống, không lấp đầy khung như Reels chuẩn cần). Chỉ tái dùng getFonts +
 * SLOGAN từ generate-card.js để đồng bộ font/thương hiệu, không sửa file đó.
 *
 * 4 giai đoạn build-up (câu mở → +bullet 1 → +bullet 2 → +slogan/CTA), nối
 * bằng cắt cảnh cứng (không crossfade — quá nặng cho EC2 nhỏ, xem comment
 * ffmpegExec). Mỗi stage tự center nội dung trong khung, không giữ layout
 * cố định giữa các stage (không cần vì không còn crossfade mượt).
 *
 * Usage:
 *   node scripts/social/generate-video.js --test    # render test-reel.mp4 ra local, không cần MinIO
 *   require('./generate-video').getOrCreateReelUrl(file, captionText)
 */

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { execFile } = require('child_process');
const Minio = require('minio');
const satori = require('satori').default;
const { Resvg } = require('@resvg/resvg-js');
const { getFonts, SLOGAN } = require('./generate-card');

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

const FPS = parseInt(process.env.VIDEO_REEL_FPS || '25', 10);
const STAGE_SEC = parseFloat(process.env.VIDEO_REEL_STAGE_SEC || '2');
const VIDEO_W = 1080;
const VIDEO_H = 1920;
const TMP_DIR = path.join(__dirname, 'tmp');
const MUSIC_DIR = path.join(__dirname, 'assets', 'music');

// ─── Trích nội dung cho slideshow: câu mở + tối đa 2 bullet ──────────────────
// Bullet chỉ lấy trong khối ngay trước dòng slogan (giống logic extractHook
// của generate-card.js) — tránh lẫn dòng emoji khác (🌐 link, 🙏 CTA...) nằm
// sau slogan trong caption.

function extractVideoContent(captionText) {
  const lines = captionText.split('\n').map(l => l.trimEnd());
  const bulletRegex = /^[\u{1F300}-\u{1FAFF}☀-➿]/u;
  const sloganIdx = lines.findIndex(l => l.includes(SLOGAN));

  let bullets = [];
  if (sloganIdx !== -1) {
    let end = sloganIdx - 1;
    while (end >= 0 && lines[end].trim() === '') end--;
    let start = end;
    while (start >= 0 && lines[start].trim() !== '') start--;
    start++;
    // satori không render emoji (cần loadAdditionalAsset riêng, generate-card.js
    // cũng chưa setup) — bỏ emoji đầu dòng, để lại sẽ thành khoảng trắng thừa.
    bullets = lines.slice(start, end + 1).map(l => l.trim()).filter(l => bulletRegex.test(l)).slice(0, 2)
      .map(l => { const i = l.indexOf(' '); return i === -1 ? l : l.slice(i + 1).trim(); });
  }

  const nonEmpty = lines.map(l => l.trim()).filter(l => l !== '');
  let opening = nonEmpty[1] || nonEmpty[0] || '';
  if (opening.length > 110) opening = opening.slice(0, 109).trim() + '…';

  return { opening, bullets };
}

// ─── Satori template — mỗi stage tự lấp đầy khung theo đúng nội dung của nó ──
// Cắt cảnh cứng giữa các stage (không crossfade) nên không cần giữ layout cố
// định để tránh giật; mỗi stage center nội dung trong khoảng trống giữa
// badge/footer — ít nội dung thì giãn rộng hơn, không để trống như cách cũ.

function videoStageTemplate({ opening, bullets, revealCount, showPayoff }) {
  const contentChildren = [
    { type: 'div', props: { style: { fontSize: '60px', fontWeight: 700, color: '#1A1A2E', lineHeight: 1.35 }, children: opening } },
    ...bullets.slice(0, revealCount).map(b => ({
      type: 'div',
      props: { style: { fontSize: '42px', fontWeight: 400, color: '#1A1A2E', lineHeight: 1.45 }, children: b },
    })),
  ];
  if (showPayoff) {
    contentChildren.push({
      type: 'div',
      props: { style: { fontSize: '36px', fontStyle: 'italic', fontWeight: 400, color: '#059669', marginTop: '12px' }, children: `"${SLOGAN}"` },
    });
  }

  return {
    type: 'div',
    props: {
      style: {
        display: 'flex', flexDirection: 'column',
        width: `${VIDEO_W}px`, height: `${VIDEO_H}px`,
        padding: '110px 90px', background: '#FFFBF5', fontFamily: 'Be Vietnam Pro',
      },
      children: [
        // brand badge — luôn hiện trên cùng
        {
          type: 'div',
          props: {
            style: { display: 'flex', alignItems: 'center', gap: '18px' },
            children: [
              {
                type: 'div',
                props: {
                  style: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '72px', height: '72px', borderRadius: '9999px', background: '#10B981', fontSize: '36px' },
                  children: '🎁',
                },
              },
              { type: 'div', props: { style: { fontSize: '38px', fontWeight: 700, color: '#047857' }, children: 'Trao Tay' } },
            ],
          },
        },
        // nội dung — chiếm hết khoảng trống còn lại, center theo chiều dọc
        // (flex:1 + justifyContent:center) — ít nội dung thì giãn rộng hơn,
        // lấp đầy khung thay vì để trống như cách cũ.
        {
          type: 'div',
          props: {
            style: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '48px' },
            children: contentChildren,
          },
        },
        // footer — chỉ stage cuối mới có (payoff), ngược lại để trống hẳn
        // để content phía trên được center rộng hơn (không placeholder).
        showPayoff
          ? {
              type: 'div',
              props: {
                style: { display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '2px solid #FFF3E0', paddingTop: '30px' },
                children: [
                  { type: 'div', props: { style: { fontSize: '30px', color: '#7A7A92' }, children: 'traotay.com.vn' } },
                  { type: 'div', props: { style: { fontSize: '26px', color: '#7A7A92' }, children: 'Mua • Bán • Cho tặng' } },
                ],
              },
            }
          : { type: 'div', props: { style: { display: 'none' }, children: [] } },
      ],
    },
  };
}

async function renderStagePng(stageProps) {
  const fonts = await getFonts();
  const svg = await satori(videoStageTemplate(stageProps), { width: VIDEO_W, height: VIDEO_H, fonts });
  return new Resvg(svg, { fitTo: { mode: 'width', value: VIDEO_W } }).render().asPng();
}

// ─── ffmpeg helpers ─────────────────────────────────────────────────────────

// EC2 instance nhỏ (~900MB RAM, hay phải swap) — pipeline slideshow 4 khung
// + xfade chạy chậm hơn nhiều so với Ken Burns 1 khung trước đây (đã thấy
// thực tế tốc độ encode giảm dần liên tục, 3m35s vẫn chưa xong 10s video).
// Đổi sang 3 bước nhẹ (xem encodeStageVideo/concatStageVideos/muxAudio) nên
// timeout có thể giữ vừa phải, không cần quá rộng tay như khi còn dùng xfade.
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

// 3 bước nhẹ thay vì 1 lệnh xfade phức tạp (xfade nhiều input quá nặng cho
// EC2 nhỏ ~900MB RAM hay swap). Đánh đổi: cắt cảnh cứng giữa các giai đoạn
// (không crossfade mượt), nhưng mỗi bước rẻ — không filter phức tạp.

// Bước 1: encode 1 khung tĩnh thành đoạn video ngắn, không filter gì (rẻ nhất có thể).
async function encodeStageVideo(framePath, durationSec, fps, outputPath) {
  await ffmpegExec([
    '-y', '-loop', '1', '-t', String(durationSec), '-i', framePath,
    '-r', String(fps), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.0',
    '-t', String(durationSec), outputPath,
  ], 60_000);
}

// Bước 2: nối các đoạn video bằng concat demuxer (stream-copy, gần như tốn 0 CPU
// vì không re-encode — chỉ ghép container, khác hẳn xfade phải decode lại mọi frame).
async function concatStageVideos(stageVideoPaths, outputPath) {
  const listPath = `${outputPath}.list.txt`;
  const listContent = stageVideoPaths.map(p => `file '${p.replace(/'/g, "'\\''")}'`).join('\n');
  await fsp.writeFile(listPath, listContent);
  try {
    await ffmpegExec(['-y', '-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', outputPath], 30_000);
  } finally {
    await fsp.rm(listPath, { force: true });
  }
}

// Bước 3: mux nhạc vào video đã ghép — video stream-copy (rẻ), chỉ audio cần encode.
// Instagram có thể reject Reels hoàn toàn không có audio stream — luôn cần 1 track,
// dù im lặng (anullsrc).
async function muxAudio({ videoPath, musicPath, durationSec, outputPath }) {
  let args;
  if (musicPath) {
    const fadeStart = Math.max(0, durationSec - 1.5);
    args = [
      '-y', '-i', videoPath, '-i', musicPath,
      '-filter_complex', `[1:a]atrim=0:${durationSec},afade=t=out:st=${fadeStart}:d=1.5[a]`,
      '-map', '0:v', '-map', '[a]',
      '-c:v', 'copy', '-c:a', 'aac', '-ar', '48000', '-b:a', '128k',
      '-shortest', outputPath,
    ];
  } else {
    args = [
      '-y', '-i', videoPath, '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
      '-map', '0:v', '-map', '1:a',
      '-c:v', 'copy', '-c:a', 'aac', '-ar', '48000', '-b:a', '128k',
      '-shortest', '-t', String(durationSec), outputPath,
    ];
  }
  await ffmpegExec(args, 30_000);
}

async function renderReelMp4(captionText) {
  await fsp.mkdir(TMP_DIR, { recursive: true });
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const { opening, bullets } = extractVideoContent(captionText);

  const stageDefs = [
    { revealCount: 0, showPayoff: false },
    { revealCount: Math.min(1, bullets.length), showPayoff: false },
    { revealCount: Math.min(2, bullets.length), showPayoff: false },
    { revealCount: bullets.length, showPayoff: true },
  ];
  const totalDuration = STAGE_SEC * stageDefs.length;

  const tmpPaths = [];
  try {
    const stageVideoPaths = [];
    for (let i = 0; i < stageDefs.length; i++) {
      const png = await renderStagePng({ opening, bullets, ...stageDefs[i] });
      const framePath = path.join(TMP_DIR, `frame-${id}-${i}.png`);
      await fsp.writeFile(framePath, png);
      tmpPaths.push(framePath);

      const stageVideoPath = path.join(TMP_DIR, `stage-${id}-${i}.mp4`);
      await encodeStageVideo(framePath, STAGE_SEC, FPS, stageVideoPath);
      tmpPaths.push(stageVideoPath);
      stageVideoPaths.push(stageVideoPath);
    }

    const concatPath = path.join(TMP_DIR, `concat-${id}.mp4`);
    tmpPaths.push(concatPath);
    await concatStageVideos(stageVideoPaths, concatPath);

    const outputPath = path.join(TMP_DIR, `reel-${id}.mp4`);
    const musicPath = pickMusicFile();
    await muxAudio({ videoPath: concatPath, musicPath, durationSec: totalDuration, outputPath });

    const actualDuration = await ffprobeDurationSec(outputPath);
    if (Math.abs(actualDuration - totalDuration) > 1.5 || actualDuration > 90) {
      await fsp.rm(outputPath, { force: true });
      throw new Error(`Duration render sai (${actualDuration}s, mong đợi ~${totalDuration.toFixed(1)}s) — không upload video lỗi spec`);
    }

    const buffer = await fsp.readFile(outputPath);
    await fsp.rm(outputPath, { force: true });
    return buffer;
  } finally {
    await Promise.all(tmpPaths.map(p => fsp.rm(p, { force: true })));
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

// Không throw ra ngoài — lỗi ở bất kỳ bước nào (satori/ffmpeg/MinIO) đều trả null,
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

    const mp4Buffer = await renderReelMp4(captionText);
    await client.putObject(BUCKET, key, mp4Buffer, mp4Buffer.length, { 'Content-Type': 'video/mp4' });
    return url;
  } catch (err) {
    console.warn(`⚠️  Không tạo được video (${err.message}) — fallback ảnh tĩnh.`);
    return null;
  }
}

module.exports = { getOrCreateReelUrl, pickMusicFile, extractVideoContent, renderReelMp4 };

// ─── CLI test mode — render 1 video mẫu ra file local, không cần MinIO ────────

if (require.main === module && process.argv.includes('--test')) {
  const sampleCaption = `Chào anh chị!

Mua bán đồ cũ online, sợ nhất là gì?

📍 Gặp mặt trực tiếp giao nhận — không cần chuyển khoản trước cho người lạ
💬 Chat ngay trong app, hỏi kỹ trước khi hẹn gặp

*"Đồ cũ người này, Báu vật người kia"*
`;
  (async () => {
    try {
      const { opening, bullets } = extractVideoContent(sampleCaption);
      console.log(`🎬 Render test reel slideshow:\n  Câu mở: "${opening}"\n  Bullets: ${JSON.stringify(bullets)}`);
      const mp4Buffer = await renderReelMp4(sampleCaption);
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
