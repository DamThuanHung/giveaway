#!/usr/bin/env node
/**
 * Render hàng loạt video TikTok (câu hỏi ôn thi /dac-dinh, có brand Trao Tay)
 * ra file MP4 local để đăng TAY lên TikTok — KHÔNG tự đăng (TikTok Content
 * Posting API chỉ cho public publish sau khi app được audit, xem quyết định
 * 2026-09-22). Dùng lại nguyên pipeline renderQuestionReelMp4 của
 * generate-video-dac-dinh.js (cùng video đang chạy Reels FB/IG) — KHÔNG sửa
 * file đó, chỉ đọc caption từ queue/ (không xoá/di chuyển gì trong queue —
 * cron post-all.js vẫn dùng y nguyên).
 *
 * Usage:
 *   node scripts/social/generate-tiktok-batch.js --count=5
 *   node scripts/social/generate-tiktok-batch.js --count=5 --start=401
 */

const fs = require('fs');
const path = require('path');
const { renderQuestionReelMp4 } = require('./generate-video-dac-dinh');

const QUEUE_DIR = path.join(__dirname, 'queue');
const OUT_DIR = path.join(__dirname, 'tiktok-ready');

function parseArg(name, def) {
  const arg = process.argv.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : def;
}

const COUNT = parseInt(parseArg('count', '5'), 10);
const START = parseArg('start', null); // tên file bắt đầu quét từ (vd "401-q.txt"), bỏ qua = từ đầu

// Đề xuất caption TikTok gọn hơn bản FB/IG — TikTok không hiển thị link
// clickable trong caption, nên trỏ về "link trong bio" thay vì URL đầy đủ.
// Hashtag rút còn 5 (thay vì 11 như IG) theo đúng khuyến nghị đã audit
// 2026-09-22: quá nhiều hashtag dễ bị Explore/FYP coi là spam.
function buildTiktokCaption(chapterTitleVi) {
  return [
    `Câu hỏi ôn thi Đặc định số 2 hôm nay — ${chapterTitleVi} 👀`,
    '',
    'Trả lời trong comment trước khi xem đáp án nhé!',
    '📖 Full đáp án + giải thích: link trong bio (traotay.com.vn/dac-dinh)',
    '',
    '#DacDinhKyNang #TokuteiGinou #NguoiVietTaiNhat #OnThiTiengNhat #NganhNhaHangNhatBan',
  ].join('\n');
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const allFiles = fs.readdirSync(QUEUE_DIR)
    .filter(f => f.endsWith('.txt') && f !== 'done')
    .sort();

  let candidates = allFiles.filter(f => {
    const text = fs.readFileSync(path.join(QUEUE_DIR, f), 'utf8');
    return text.includes('📝 '); // chỉ lấy dạng câu hỏi, không lấy dạng giới thiệu/marketplace
  });

  if (START) {
    const idx = candidates.indexOf(START);
    if (idx !== -1) candidates = candidates.slice(idx);
  }

  // Bỏ qua file đã render rồi (idempotent — chạy lại không render trùng)
  candidates = candidates.filter(f => !fs.existsSync(path.join(OUT_DIR, f.replace('.txt', '.mp4'))));

  const batch = candidates.slice(0, COUNT);
  if (batch.length === 0) {
    console.log('📭 Không còn caption dạng câu hỏi nào chưa render (hoặc queue rỗng).');
    return;
  }

  console.log(`🎬 Render ${batch.length} video TikTok (từ ${candidates.length} caption câu hỏi sẵn có, chưa render)...\n`);

  const { parseQuestionCaption } = require('./generate-card-dac-dinh');

  for (const file of batch) {
    const captionText = fs.readFileSync(path.join(QUEUE_DIR, file), 'utf8');
    const base = file.replace('.txt', '');
    process.stdout.write(`  ${base}... `);
    try {
      const { chapterTitleVi } = parseQuestionCaption(captionText);
      const mp4Buffer = await renderQuestionReelMp4(captionText);
      fs.writeFileSync(path.join(OUT_DIR, `${base}.mp4`), mp4Buffer);
      fs.writeFileSync(path.join(OUT_DIR, `${base}-caption.txt`), buildTiktokCaption(chapterTitleVi));
      console.log(`✅ (${(mp4Buffer.length / 1024).toFixed(0)} KB)`);
    } catch (err) {
      console.log(`❌ ${err.message}`);
    }
  }

  console.log(`\n📁 Video + caption đã lưu tại: ${OUT_DIR}`);
  console.log('   Mỗi câu có 2 file: <tên>.mp4 (video) + <tên>-caption.txt (caption gợi ý để copy khi đăng tay).');
}

main().catch(err => {
  console.error('💥 Lỗi:', err.message);
  process.exit(1);
});
