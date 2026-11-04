#!/usr/bin/env node
/**
 * Reel riêng cho caption "Câu hỏi ôn thi hôm nay" /dac-dinh — KHÔNG dùng
 * template slideshow marketplace của generate-video.js (bullet USP + footer
 * "Mua • Bán • Cho tặng", sai ngữ cảnh — cùng lỗi đã sửa ở generate-card-dac-dinh.js
 * cho ảnh tĩnh ngày 2026-07-20, video bị bỏ sót nên TẠM khoá hẳn video cho mọi
 * caption /dac-dinh cho tới khi có template riêng — xem post-all.js).
 *
 * 4 giai đoạn build-up dạng đố vui (giữ đúng flow card tĩnh — câu hỏi trước,
 * KHÔNG lộ đáp án trên video, mời comment):
 *   1. Badge chương + câu hỏi tiếng Nhật
 *   2. + bản dịch tiếng Việt
 *   3. + lời mời "Comment đáp án"
 *   4. + footer (link /dac-dinh + "Đáp án trong bài viết")
 *
 * Tái dùng pipeline ffmpeg/MinIO/font từ generate-video.js (không sửa file đó),
 * chỉ viết satori template + hàm trích nội dung riêng cho dạng câu hỏi.
 */

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const satori = require('satori').default;
const { Resvg } = require('@resvg/resvg-js');
const {
  getFonts, FPS, STAGE_SEC, VIDEO_W, VIDEO_H, TMP_DIR,
  encodeStageVideo, concatStageVideos, muxAudio, ffprobeDurationSec,
  pickMusicFile, getMinioClient, BUCKET, PUBLIC_URL,
} = require('./generate-video');
const { parseQuestionCaption } = require('./generate-card-dac-dinh');

// ─── Satori template — mỗi giai đoạn tự center nội dung, cắt cảnh cứng ─────
// giống generate-video.js (không crossfade — nặng cho EC2 nhỏ).

// Bố cục v2 (2026-09-22) — bản cũ chỉ chiếm ~35-40% chiều cao khung hình,
// để trống quá nhiều phía trên/dưới → nhìn "chán", giống slide PowerPoint hơn
// TikTok/Reels. Sửa 3 điểm: (1) cỡ chữ lớn hơn hẳn, (2) watermark "?" mờ phía
// sau lấp khoảng trống thị giác không cần animation, (3) dải footer màu luôn
// hiện diện từ stage 0 (không đợi payoff mới xuất hiện) để khung hình có nội
// dung xuyên suốt thay vì nửa dưới trống trơn ở 3/4 thời lượng video.
function questionVideoStageTemplate({ chapterTitleVi, questionJa, questionVi, options, stage }) {
  const badgeLabel = `CÂU HỎI ÔN THI HÔM NAY — ${chapterTitleVi.toUpperCase()}`;
  const OPTION_COLORS = ['#059669', '#0891B2', '#D97706', '#DC2626'];

  const contentChildren = [
    {
      type: 'div',
      props: {
        style: {
          display: 'flex', alignSelf: 'flex-start', background: '#05966918',
          borderRadius: '9999px', padding: '14px 28px',
          fontSize: '28px', fontWeight: 700, color: '#059669', letterSpacing: '0.5px',
        },
        children: badgeLabel,
      },
    },
    { type: 'div', props: { style: { fontSize: '68px', fontWeight: 700, color: '#1A1A2E', lineHeight: 1.32, marginTop: '38px' }, children: questionJa } },
    // VI hiện ngay từ stage 0 cùng câu hỏi — 2 giây mở đầu là lúc quyết định
    // người xem lướt tiếp hay dừng lại, không để trống chờ tới stage 1.
    { type: 'div', props: { style: { fontSize: '48px', fontWeight: 400, color: '#4B5563', lineHeight: 1.4, marginTop: '40px' }, children: questionVi } },
  ];
  // Lưới đáp án A-D — chia làm 2 đợt (stage 1: A,B — stage 2: +C,D) để nội
  // dung trải đều qua các stage thay vì dồn hết vào 1 giai đoạn, đồng thời
  // lấp khoảng trống thị giác. KHÔNG tô màu đáp án đúng, giữ đúng cơ chế
  // "comment trước khi xem giải thích" của caption gốc.
  const revealOptions = stage >= 2 ? 4 : stage >= 1 ? 2 : 0;
  if (revealOptions > 0 && options && options.length === 4) {
    contentChildren.push({
      type: 'div',
      props: {
        style: { display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '48px' },
        children: options.slice(0, revealOptions).map(opt => ({
          type: 'div',
          props: {
            style: {
              display: 'flex', alignItems: 'center', gap: '20px',
              background: '#FFFFFF', border: '2px solid #ECECF4', borderRadius: '20px',
              padding: '22px 28px',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '56px', height: '56px', borderRadius: '9999px',
                    background: OPTION_COLORS[opt.letter.charCodeAt(0) - 65] || '#059669',
                    fontSize: '28px', fontWeight: 700, color: '#FFFFFF', flexShrink: 0,
                  },
                  children: opt.letter,
                },
              },
              { type: 'div', props: { style: { fontSize: '30px', fontWeight: 400, color: '#1A1A2E', lineHeight: 1.3 }, children: opt.text.length > 46 ? opt.text.slice(0, 45).trim() + '…' : opt.text } },
            ],
          },
        })),
      },
    });
  }
  if (stage >= 3) {
    contentChildren.push({ type: 'div', props: { style: { fontSize: '40px', fontWeight: 700, color: '#059669', marginTop: '40px' }, children: 'Comment đáp án của anh chị nhé' } });
  }

  return {
    type: 'div',
    props: {
      style: {
        display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
        width: `${VIDEO_W}px`, height: `${VIDEO_H}px`,
        background: '#FFFBF5', fontFamily: 'Be Vietnam Pro, Noto Sans JP',
      },
      children: [
        // watermark "?" khổng lồ, mờ — lấp chiều sâu thị giác cho khoảng trống
        // còn lại, không cần chuyển động thật vẫn đỡ trơ.
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute', top: '-100px', right: '-60px',
              fontSize: '620px', fontWeight: 700, color: '#0596690D', lineHeight: 1,
            },
            children: '?',
          },
        },
        // vùng nội dung chính
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'flex-start', padding: '210px 80px 0' },
            children: [
              // brand badge
              {
                type: 'div',
                props: {
                  style: { display: 'flex', alignItems: 'center', gap: '18px', position: 'absolute', top: '80px', left: '80px' },
                  children: [
                    { type: 'div', props: { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '72px', height: '72px', borderRadius: '9999px', background: '#10B981', fontSize: '30px', fontWeight: 700, color: '#FFFFFF' }, children: 'TT' } },
                    { type: 'div', props: { style: { fontSize: '38px', fontWeight: 700, color: '#047857' }, children: 'Trao Tay' } },
                  ],
                },
              },
              ...contentChildren,
            ],
          },
        },
        // dải footer màu — luôn hiện diện (không đợi payoff) để đáy khung không
        // bao giờ trống trơn; nội dung "đáp án trong bài viết" chỉ nổi bật ở stage cuối.
        {
          type: 'div',
          props: {
            style: {
              display: 'flex', flexDirection: 'column', gap: '10px',
              background: '#10B981', padding: '40px 80px 56px',
            },
            children: [
              { type: 'div', props: { style: { fontSize: '32px', fontWeight: 700, color: '#FFFFFF' }, children: 'traotay.com.vn/dac-dinh' } },
              {
                type: 'div',
                props: {
                  style: { fontSize: '28px', color: stage >= 3 ? '#FFFFFF' : '#D1FAE5', fontWeight: stage >= 3 ? 700 : 400 },
                  children: stage >= 3 ? 'Đáp án + giải thích đầy đủ trong bài viết' : 'Ôn thi Đặc định số 2 miễn phí',
                },
              },
            ],
          },
        },
      ],
    },
  };
}

async function renderStagePng(stageProps) {
  const fonts = await getFonts();
  const svg = await satori(questionVideoStageTemplate(stageProps), { width: VIDEO_W, height: VIDEO_H, fonts });
  return new Resvg(svg, { fitTo: { mode: 'width', value: VIDEO_W } }).render().asPng();
}

async function renderQuestionReelMp4(captionText) {
  await fsp.mkdir(TMP_DIR, { recursive: true });
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const { chapterTitleVi, questionJa, questionVi, options } = parseQuestionCaption(captionText);

  const stages = [0, 1, 2, 3];
  const totalDuration = STAGE_SEC * stages.length;

  const tmpPaths = [];
  try {
    const stageVideoPaths = [];
    for (const stage of stages) {
      const png = await renderStagePng({ chapterTitleVi, questionJa, questionVi, options, stage });
      const framePath = path.join(TMP_DIR, `dd-frame-${id}-${stage}.png`);
      await fsp.writeFile(framePath, png);
      tmpPaths.push(framePath);

      const stageVideoPath = path.join(TMP_DIR, `dd-stage-${id}-${stage}.mp4`);
      await encodeStageVideo(framePath, STAGE_SEC, FPS, stageVideoPath);
      tmpPaths.push(stageVideoPath);
      stageVideoPaths.push(stageVideoPath);
    }

    const concatPath = path.join(TMP_DIR, `dd-concat-${id}.mp4`);
    tmpPaths.push(concatPath);
    await concatStageVideos(stageVideoPaths, concatPath);

    const outputPath = path.join(TMP_DIR, `dd-reel-${id}.mp4`);
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

// Không throw ra ngoài — lỗi ở bất kỳ bước nào đều trả null, post-all.js fallback
// êm về ảnh tĩnh cho slot đó (giống getOrCreateReelUrl của generate-video.js).
async function getOrCreateQuestionReelUrl(file, captionText) {
  try {
    const key = `social-reels/dac-dinh/${path.basename(file, '.txt')}.mp4`;
    const url = `${PUBLIC_URL}/${BUCKET}/${key}`;
    const client = getMinioClient();

    try {
      await client.statObject(BUCKET, key);
      return url; // cache hit
    } catch {
      // chưa có, render mới
    }

    const mp4Buffer = await renderQuestionReelMp4(captionText);
    await client.putObject(BUCKET, key, mp4Buffer, mp4Buffer.length, { 'Content-Type': 'video/mp4' });
    return url;
  } catch (err) {
    console.warn(`⚠️  Không tạo được video /dac-dinh (${err.message}) — fallback ảnh tĩnh.`);
    return null;
  }
}

module.exports = { getOrCreateQuestionReelUrl, renderQuestionReelMp4 };

// ─── CLI test mode ──────────────────────────────────────────────────────────

if (require.main === module && process.argv.includes('--test')) {
  const sampleCaption = `Chào cả nhà ôn thi Đặc định số 2 ngành nhà hàng 👋 Thử sức với câu hỏi thật trong đề hôm nay nhé!

CÂU HỎI ÔN THI HÔM NAY — Lưu ý về sơ chế
📝 魚のえらを取る手順として正しいものはどれか。
🇻🇳 Quy trình lấy mang cá đúng là gì?

A. 魚の腹を上にしてえらぶたを開き、包丁の刃先を入れてえらと身のつなぎ部分を切り、反対側も同様にして引き出す
B. 頭を完全に切り落としてから取る
C. 手で無理やり引きちぎる
D. 煮てから箸で取り除く

✅ Đáp án đúng: A. 魚の腹を上にしてえらぶたを開き、包丁の刃先を入れてえらと身のつなぎ部分を切り、反対側も同様にして引き出す
💡 Lấy mang cá: lật bụng cá lên, mở nắp mang, đưa mũi dao vào cắt phần nối giữa mang và thân, làm tương tự bên kia rồi kéo mang ra.
📖 Trích dẫn OTAFF trang 5: "test"

🌐 https://traotay.com.vn/dac-dinh
`;
  (async () => {
    try {
      console.log('🎬 Render test reel câu hỏi /dac-dinh...');
      const mp4Buffer = await renderQuestionReelMp4(sampleCaption);
      const outPath = path.join(__dirname, 'test-reel-dac-dinh.mp4');
      fs.writeFileSync(outPath, mp4Buffer);
      console.log('✅ Đã render video mẫu:', outPath, `(${(mp4Buffer.length / 1024).toFixed(0)} KB)`);
    } catch (err) {
      console.error('❌ Lỗi render:', err);
      process.exit(1);
    }
  })();
}
