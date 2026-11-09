#!/usr/bin/env node
/**
 * Giảm hashtag block của caption /dac-dinh trong queue/ từ 9-11 tag generic
 * xuống còn tối đa 5 tag (giữ brand + chủ đề cốt lõi + tag đặc thù riêng của
 * từng caption), theo đúng khuyến nghị audit 2026-09-22 (quá nhiều hashtag dễ
 * bị Explore/FYP coi là spam) — nhánh marketplace đã áp dụng, nhánh dac-dinh
 * (sinh 1 lần qua gen-question-captions.js/gen-vocab-captions.js/...) thì
 * chưa, nên sửa trực tiếp các file .txt đã sinh thay vì sửa lại generator.
 *
 * Usage: node scripts/social/reduce-dac-dinh-hashtags.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const QUEUE_DIR = path.join(__dirname, 'queue');
const isDryRun = process.argv.includes('--dry-run');

// Giữ cố định theo đúng thứ tự nếu có mặt — brand + chủ đề cốt lõi, không phải
// tag mô tả đối tượng (đã có #NguoiVietTaiNhat đại diện đủ).
const CORE_ORDER = ['TraoTay', 'DacDinhKyNang', 'TokuteiGinou', 'NguoiVietTaiNhat'];
// Tag lặp lại ở hầu hết caption, không phân biệt được bài này với bài khác —
// bỏ để nhường chỗ cho tag đặc thù (CauHoiOnThi, TuVungTiengNhat, BaoLanhGiaDinh...).
const FILLER = new Set(['OnThiTiengNhat', 'NganhNhaHangNhatBan', 'LaoDongNhatBan', 'DuHocNhat', 'ThucTapSinhNhatBan', 'CongDongNguoiViet']);
const MAX_TAGS = 5;

function reduceLine(line) {
  const tags = line.trim().split(/\s+/);
  const core = CORE_ORDER.filter(t => tags.includes(`#${t}`)).map(t => `#${t}`);
  const specific = tags.filter(t => {
    const name = t.slice(1);
    return !CORE_ORDER.includes(name) && !FILLER.has(name);
  });
  return [...core, ...specific].slice(0, MAX_TAGS).join(' ');
}

const files = fs.readdirSync(QUEUE_DIR).filter(f => f.endsWith('.txt'));
let changed = 0;

for (const file of files) {
  const filePath = path.join(QUEUE_DIR, file);
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split('\n');
  let lastIdx = lines.length - 1;
  while (lastIdx >= 0 && lines[lastIdx].trim() === '') lastIdx--;
  const lastLine = lines[lastIdx] || '';

  if (!lastLine.includes('#DacDinhKyNang')) continue; // chỉ đụng caption dac-dinh

  const reduced = reduceLine(lastLine);
  if (reduced === lastLine.trim()) continue;

  lines[lastIdx] = reduced;
  changed++;
  if (!isDryRun) fs.writeFileSync(filePath, lines.join('\n'));
  if (changed <= 3) console.log(`[mẫu] ${file}\n  trước: ${lastLine.trim()}\n  sau:   ${reduced}\n`);
}

console.log(`${isDryRun ? '[DRY RUN] Sẽ sửa' : 'Đã sửa'} ${changed} file (giảm hashtag dac-dinh xuống tối đa ${MAX_TAGS} tag).`);
