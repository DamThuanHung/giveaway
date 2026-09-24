#!/usr/bin/env node
/**
 * Sinh caption "Từ vựng hôm nay" cho TOÀN BỘ ngân hàng VOCAB /dac-dinh (507 từ,
 * chưa từng dùng cho social — xem web/app/dac-dinh/data.ts export VOCAB).
 *
 * Tái dùng NGUYÊN VẸN template thẻ câu hỏi đã có (generate-card-dac-dinh.js —
 * isQuestionCaption/parseQuestionCaption/renderQuestionCardPng) — không sửa
 * code render, chỉ tạo caption đúng đánh dấu mà parser đó đã nhận diện sẵn:
 * badge "CÂU HỎI ÔN THI HÔM NAY — {chương}", dòng 📝 (khớp Nhật), dòng 🇻🇳
 * (khớp Việt), 4 dòng "A. "…"D. ", dòng "✅ Đáp án đúng: ...".
 *
 * VocabQuestion không có sourceQuoteJa/sourcePage/explanationVi như QUESTIONS
 * — KHÔNG tự bịa phần giải thích/trích dẫn (đúng quy tắc "không chắc thì
 * không bịa"), chỉ giữ đúng dữ liệu thật có: term + 4 lựa chọn + đáp án đúng.
 *
 * direction="ja-to-vi": term là tiếng Nhật, 4 lựa chọn là tiếng Việt.
 * direction="vi-to-ja": term là tiếng Việt, 4 lựa chọn là tiếng Nhật — khi đó
 * dòng 📝 không thể lộ luôn đáp án đúng (options[correctIndex] tiếng Nhật),
 * nên dòng 📝 chỉ ghi hướng dẫn, term thật nằm ở dòng 🇻🇳.
 */
const fs = require('fs');
const path = require('path');

const vocab = JSON.parse(fs.readFileSync(path.join(__dirname, 'vocab-export.json'), 'utf8'));
const letters = ['A', 'B', 'C', 'D'];
const HASHTAGS = '#TraoTay #DacDinhKyNang #TokuteiGinou #OnThiTiengNhat #NganhNhaHangNhatBan #NguoiVietTaiNhat #LaoDongNhatBan #DuHocNhat #ThucTapSinhNhatBan #TuVungTiengNhat';

const QUEUE_DIR = path.join(__dirname, 'queue');
if (!fs.existsSync(QUEUE_DIR)) fs.mkdirSync(QUEUE_DIR, { recursive: true });

let count = 0;
for (const v of vocab) {
  const optionsText = v.options.map((o, idx) => `${letters[idx]}. ${o}`).join('\n');
  const correctLetter = letters[v.correctIndex];
  const correctText = v.options[v.correctIndex];

  const jaLine = v.direction === 'ja-to-vi' ? v.term : 'Chọn đúng nghĩa tiếng Nhật ở 4 lựa chọn bên dưới 👇';
  const viLine = v.direction === 'ja-to-vi' ? 'Từ này nghĩa tiếng Việt là gì?' : v.term;

  const caption = `Chào cả nhà ôn thi Đặc định số 2 ngành nhà hàng 👋 Từ vựng hôm nay, thử đoán xem!

CÂU HỎI ÔN THI HÔM NAY — ${v.chapterTitleVi}
📝 ${jaLine}
🇻🇳 ${viLine}

${optionsText}

✅ Đáp án đúng: ${correctLetter}. ${correctText}

Lưu lại để ôn từ vựng dần nhé!

🌐 https://traotay.com.vn/dac-dinh
📱 https://traotay.com.vn/downloads/traotay.apk

Anh chị đoán đúng không? Comment câu trả lời trước khi xem đáp án nhé 👇

Cảm ơn cả nhà đã đọc!

${HASHTAGS}`;
  fs.writeFileSync(path.join(QUEUE_DIR, `q-${v.id}.txt`), caption);
  count++;
}
console.log(`Đã tạo ${count} file caption từ vựng.`);
