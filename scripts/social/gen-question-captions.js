#!/usr/bin/env node
// Sinh caption "Câu hỏi ôn thi hôm nay" cho TOÀN BỘ câu hỏi thật trong ngân hàng
// /dac-dinh (không chỉ 1 mẫu nhỏ) — tránh lặp lại lỗi "làm mẫu thay vì làm đủ".
const fs = require('fs');
const path = require('path');

const ALREADY_USED = new Set(['sm-1', 'sm-31', 'sm-60', 'sm-89', 'sm-117', 'hy-1', 'hy-21', 'hy-44', 'hy-64', 'hy-86', 'ck-1', 'ck-28', 'ck-57', 'ck-86', 'ck-117', 'cs-3', 'cs-19', 'cs-37', 'cs-56', 'cs-73']);

const questions = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'web', 'scratch-all-questions.json'), 'utf8'));
const letters = ['A', 'B', 'C', 'D'];
const HASHTAGS = '#TraoTay #DacDinhKyNang #TokuteiGinou #OnThiTiengNhat #NganhNhaHangNhatBan #NguoiVietTaiNhat #LaoDongNhatBan #DuHocNhat #ThucTapSinhNhatBan #CauHoiOnThi';

const QUEUE_DIR = path.join(__dirname, 'queue');

let count = 0;
for (const q of questions) {
  if (ALREADY_USED.has(q.id)) continue;
  const optionsText = q.options.map((o, idx) => `${letters[idx]}. ${o.vi}`).join('\n');
  const correctLetter = letters[q.correctIndex];
  const correctText = q.options[q.correctIndex].vi;
  const caption = `Chào cả nhà ôn thi Đặc định số 2 ngành nhà hàng 👋 Thử sức với câu hỏi thật trong đề hôm nay nhé!

CÂU HỎI ÔN THI HÔM NAY — ${q.chapterTitleVi}
📝 ${q.questionJa}
🇻🇳 ${q.questionVi}

${optionsText}

✅ Đáp án đúng: ${correctLetter}. ${correctText}
💡 ${q.explanationVi}
📖 Trích dẫn OTAFF trang ${q.sourcePage}: "${q.sourceQuoteJa}"

Lưu lại để ôn dần nhé!

🌐 https://traotay.com.vn/dac-dinh
📱 https://traotay.com.vn/downloads/traotay.apk

Anh chị trả lời đúng không? Comment câu trả lời trước khi đọc phần giải thích ở trên nhé 👇

Cảm ơn cả nhà đã đọc!

${HASHTAGS}`;
  fs.writeFileSync(path.join(QUEUE_DIR, `q-${q.id}.txt`), caption);
  count++;
}
console.log(`Đã tạo ${count} file caption câu hỏi (bỏ qua ${ALREADY_USED.size} câu đã dùng trước đó)`);
