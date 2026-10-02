#!/usr/bin/env node
// Sinh caption cho các dạng bài dac-dinh CHƯA từng khai thác (translation, reorder,
// planning, matching) + vét nốt số câu hỏi (quiz) còn sót lại — toàn bộ lấy từ
// web/app/dac-dinh/data.ts (nguồn thật, bám OTAFF), KHÔNG tự bịa nội dung.
//
// 2 bước chuẩn bị trước khi chạy (không commit kết quả 2 bước này vào git —
// _dac-dinh-data.cjs là build artifact, used-ids.txt là snapshot tạm thời):
//
// 1. Build data.ts (TypeScript, không require() thẳng được) sang JS:
//      cd web && node_modules/.bin/esbuild app/dac-dinh/data.ts --bundle=false \
//        --format=cjs --outfile=../scripts/social/_dac-dinh-data.cjs
//
// 2. Lấy danh sách ID caption đã từng đăng (cả queue/ lẫn queue/done/ trên
//    production, KHÔNG phải local — local có thể lệch do chưa sync hết):
//      ssh ... "cd .../queue && (ls *.txt; ls done/*.txt) 2>/dev/null \
//        | grep -E '/?q-' | sed -E 's#.*/##; s/^[0-9]+-//; s/^q-//; s/\.txt$//'" \
//        > scripts/social/used-ids.txt
//
// Rồi chạy: node gen-remaining-dac-dinh.js
const fs = require('fs');
const path = require('path');
const data = require('./_dac-dinh-data.cjs');

const QUEUE_DIR = path.join(__dirname, 'queue');
const usedIds = new Set(
  fs.readFileSync(path.join(__dirname, 'used-ids.txt'), 'utf8')
    .split('\n').map(s => s.trim()).filter(Boolean)
);

const chapterTitle = {};
for (const c of data.CHAPTERS) chapterTitle[c.id] = c.titleVi;

const HASHTAGS = '#TraoTay #DacDinhKyNang #TokuteiGinou #OnThiTiengNhat #NganhNhaHangNhatBan #NguoiVietTaiNhat #LaoDongNhatBan #DuHocNhat #ThucTapSinhNhatBan';
const letters = ['A', 'B', 'C', 'D'];
let total = 0;

function write(id, caption) {
  fs.writeFileSync(path.join(QUEUE_DIR, `q-${id}.txt`), caption);
  total++;
}

// ── 1. QUIZ còn sót lại ─────────────────────────────────────────────────────
for (const q of data.QUESTIONS) {
  if (usedIds.has(q.id)) continue;
  const optionsText = q.options.map((o, i) => `${letters[i]}. ${o.vi}`).join('\n');
  const caption = `Chào cả nhà ôn thi Đặc định số 2 ngành nhà hàng 👋 Thử sức với câu hỏi thật trong đề hôm nay nhé!

CÂU HỎI ÔN THI HÔM NAY — ${chapterTitle[q.chapterId] || ''}
📝 ${q.questionJa}
🇻🇳 ${q.questionVi}

${optionsText}

✅ Đáp án đúng: ${letters[q.correctIndex]}. ${q.options[q.correctIndex].vi}
💡 ${q.explanationVi}
📖 Trích dẫn OTAFF trang ${q.sourcePage}: "${q.sourceQuoteJa}"

Lưu lại để ôn dần nhé!

🌐 https://traotay.com.vn/dac-dinh
📱 https://traotay.com.vn/downloads/traotay.apk

Anh chị trả lời đúng không? Comment câu trả lời trước khi đọc phần giải thích ở trên nhé 👇

Cảm ơn cả nhà đã đọc!

${HASHTAGS} #CauHoiOnThi`;
  write(q.id, caption);
}

// ── 2. TRANSLATION — dịch câu ────────────────────────────────────────────────
for (const t of data.TRANSLATIONS) {
  if (usedIds.has(t.id)) continue;
  const promptLabel = t.direction === 'ja-to-vi' ? '🇯🇵 Câu tiếng Nhật' : '🇻🇳 Câu tiếng Việt';
  const optionsLabel = t.direction === 'ja-to-vi' ? 'Chọn nghĩa tiếng Việt đúng' : 'Chọn câu tiếng Nhật đúng';
  const optionsText = t.options.map((o, i) => `${letters[i]}. ${o}`).join('\n');
  const caption = `Chào cả nhà ôn thi Đặc định số 2 ngành nhà hàng 👋 Thử dịch câu này xem sao nhé!

DỊCH CÂU HÔM NAY — ${chapterTitle[t.chapterId] || ''}
${promptLabel}: ${t.prompt}

${optionsLabel}:
${optionsText}

✅ Đáp án đúng: ${letters[t.correctIndex]}. ${t.options[t.correctIndex]}
📖 Trích dẫn OTAFF trang ${t.sourcePage}: "${t.sourceQuoteJa}"

Lưu lại để ôn dần nhé!

🌐 https://traotay.com.vn/dac-dinh
📱 https://traotay.com.vn/downloads/traotay.apk

Anh chị dịch đúng không? Comment đáp án trước khi xem giải thích ở trên nhé 👇

Cảm ơn cả nhà đã đọc!

${HASHTAGS} #DichCauTiengNhat`;
  write(t.id, caption);
}

// ── 3. REORDER — sắp xếp câu ─────────────────────────────────────────────────
// Fisher-Yates xáo trộn thật, seed theo id để tái lập được (không dùng Math.random()).
// Bản cũ (i * hằng số % (i+1)) sai: với mảng ngắn (3-5 phần tử) gần như không đổi
// thứ tự gì — phát hiện khi review mẫu thấy "đã xáo trộn" trùng y hệt đáp án đúng.
function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}
function shuffle(arr, seedStr) {
  const a = [...arr];
  let seed = hashSeed(seedStr);
  const next = () => {
    seed = (seed * 1103515245 + 12345) >>> 0;
    return seed;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = next() % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
for (const r of data.REORDERS) {
  if (usedIds.has(r.id)) continue;
  let scrambled = shuffle(r.chunks, r.id);
  // An toàn cho mảng ngắn (2-3 cụm): nếu xáo trộn ra trùng y hệt thứ tự gốc, đảo ngược lại.
  if (r.chunks.length > 1 && scrambled.every((c, i) => c === r.chunks[i])) scrambled = [...r.chunks].reverse();
  const chunksDisplay = scrambled.map((c, i) => `${i + 1}. ${c}`).join('\n');
  const caption = `Chào cả nhà ôn thi Đặc định số 2 ngành nhà hàng 👋 Thử sắp xếp các cụm từ dưới đây thành 1 câu hoàn chỉnh xem!

SẮP XẾP CÂU HÔM NAY — ${chapterTitle[r.chapterId] || ''}
Các cụm từ (đã xáo trộn):
${chunksDisplay}

✅ Thứ tự đúng: ${r.chunks.join('')}
🇻🇳 Nghĩa: ${r.meaningVi}
📖 Trích dẫn OTAFF trang ${r.sourcePage}: "${r.sourceQuoteJa}"

Lưu lại để ôn dần nhé!

🌐 https://traotay.com.vn/dac-dinh
📱 https://traotay.com.vn/downloads/traotay.apk

Anh chị sắp đúng thứ tự không? Comment đáp án trước khi xem lời giải ở trên nhé 👇

Cảm ơn cả nhà đã đọc!

${HASHTAGS} #SapXepCauTiengNhat`;
  write(r.id, caption);
}

// ── 4. PLANNING — lập kế hoạch/quy trình ────────────────────────────────────
for (const p of data.PLANNINGS) {
  if (usedIds.has(p.id)) continue;
  let scrambledSteps = shuffle(p.steps, p.id);
  if (p.steps.length > 1 && scrambledSteps.every((s, i) => s === p.steps[i])) scrambledSteps = [...p.steps].reverse();
  const stepsDisplay = scrambledSteps.map((s, i) => `${i + 1}. ${s.ja} — ${s.vi}`).join('\n');
  const correctDisplay = p.steps.map((s, i) => `${i + 1}. ${s.ja} — ${s.vi}`).join('\n');
  const caption = `Chào cả nhà ôn thi Đặc định số 2 ngành nhà hàng 👋 Thử sắp đúng thứ tự quy trình dưới đây xem!

TÌNH HUỐNG: ${p.scenarioJa}
🇻🇳 ${p.scenarioVi}

Các bước (đã xáo trộn):
${stepsDisplay}

✅ Thứ tự đúng:
${correctDisplay}

📖 Trích dẫn OTAFF trang ${p.sourcePage}: "${p.sourceQuoteJa}"

Lưu lại để ôn dần nhé!

🌐 https://traotay.com.vn/dac-dinh
📱 https://traotay.com.vn/downloads/traotay.apk

Anh chị sắp đúng thứ tự quy trình không? Comment trước khi xem đáp án ở trên nhé 👇

Cảm ơn cả nhà đã đọc!

${HASHTAGS} #LapKeHoach`;
  write(p.id, caption);
}

// ── 5. MATCHING — phân loại/ghép cặp ────────────────────────────────────────
for (const m of data.MATCHINGS) {
  if (usedIds.has(m.id)) continue;
  const targetLabel = {};
  for (const t of m.targets) targetLabel[t.id] = t.labelVi;
  const itemsDisplay = m.items.map((it, i) => `${i + 1}. ${it.ja} (${it.vi})`).join('\n');
  const answerDisplay = m.items.map((it, i) => `${i + 1}. ${it.ja} → ${targetLabel[it.targetId] || it.targetId}`).join('\n');
  const caption = `Chào cả nhà ôn thi Đặc định số 2 ngành nhà hàng 👋 Thử phân loại danh sách dưới đây xem!

${m.instructionVi}
(${m.instructionJa})

Danh sách cần phân loại:
${itemsDisplay}

Các nhóm: ${m.targets.map(t => t.labelVi).join(' / ')}

✅ Đáp án đúng:
${answerDisplay}

💡 ${m.explanationVi}

Lưu lại để ôn dần nhé!

🌐 https://traotay.com.vn/dac-dinh
📱 https://traotay.com.vn/downloads/traotay.apk

Anh chị phân loại đúng không? Comment trước khi xem đáp án ở trên nhé 👇

Cảm ơn cả nhà đã đọc!

${HASHTAGS} #PhanLoai`;
  write(m.id, caption);
}

console.log(`Đã sinh ${total} caption mới (quiz+translation+reorder+planning+matching, lọc trùng với used-ids.txt).`);
