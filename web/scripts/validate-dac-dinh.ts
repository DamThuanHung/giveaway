// Kiểm tra cấu trúc dữ liệu bài tập /dac-dinh — chạy: npm run validate:dac-dinh
// Chỉ bắt lỗi KỸ THUẬT (thiếu trường, sai kiểu, lệch phân bố đáp án...).
// KHÔNG kiểm tra được nội dung có bỏ sót tài liệu OTAFF hay không — việc đó vẫn phải làm thủ công
// theo quy trình Bước A-B-C (xem comment kiểm kê trong app/dac-dinh/data.ts).

import { CHAPTERS, QUESTIONS, TRANSLATIONS, REORDERS, VOCAB, SCENARIOS, PLANNINGS, MATCHINGS, FILLBLANKS } from "../app/dac-dinh/data";

type Issue = { level: "error" | "warn"; message: string };

const issues: Issue[] = [];
const err = (message: string) => issues.push({ level: "error", message });
const warn = (message: string) => issues.push({ level: "warn", message });

const chapterIds = new Set(CHAPTERS.map((c) => c.id));

function checkDuplicateIds(items: { id: string }[], label: string) {
  const seen = new Set<string>();
  for (const it of items) {
    if (seen.has(it.id)) err(`[${label}] id trùng lặp: ${it.id}`);
    seen.add(it.id);
  }
}

function checkChapterRefs(items: { id: string; chapterId: string }[], label: string) {
  for (const it of items) {
    if (!chapterIds.has(it.chapterId)) {
      err(`[${label}] ${it.id} tham chiếu chapterId không tồn tại: "${it.chapterId}"`);
    }
  }
}

function checkMCQ(items: { id: string; options: unknown[]; correctIndex: number }[], label: string) {
  for (const it of items) {
    if (it.options.length !== 4) err(`[${label}] ${it.id} không có đúng 4 đáp án (có ${it.options.length})`);
    if (it.correctIndex < 0 || it.correctIndex > 3) {
      err(`[${label}] ${it.id} correctIndex ngoài phạm vi 0-3: ${it.correctIndex}`);
    }
  }
}

function checkCitation(items: { id: string; sourceQuoteJa: string; sourcePage: number }[], label: string) {
  for (const it of items) {
    if (!it.sourceQuoteJa?.trim()) err(`[${label}] ${it.id} thiếu sourceQuoteJa`);
    if (!it.sourcePage || it.sourcePage < 1) err(`[${label}] ${it.id} sourcePage không hợp lệ: ${it.sourcePage}`);
  }
}

// Cảnh báo nếu đáp án đúng dồn quá nhiều vào 1 vị trí trong cùng 1 chương — dấu hiệu soạn ẩu
// (đây chính là loại lỗi "toàn A" đã xảy ra thực tế trước đó).
function checkDistribution(items: { chapterId: string; correctIndex: number }[], label: string) {
  const byChapter = new Map<string, number[]>();
  for (const it of items) {
    const arr = byChapter.get(it.chapterId) ?? [];
    arr.push(it.correctIndex);
    byChapter.set(it.chapterId, arr);
  }
  byChapter.forEach((indices, chId) => {
    if (indices.length < 4) return; // mẫu quá nhỏ, thống kê không có ý nghĩa
    const counts = [0, 0, 0, 0];
    indices.forEach((i: number) => counts[i]++);
    const max = Math.max(...counts);
    const ratio = max / indices.length;
    if (ratio > 0.6) {
      warn(
        `[${label}] chương "${chId}": ${Math.round(ratio * 100)}% đáp án đúng dồn vào 1 vị trí trong ${indices.length} câu — nên xáo lại vị trí`
      );
    }
  });
}

checkDuplicateIds(QUESTIONS, "QUESTIONS");
checkDuplicateIds(TRANSLATIONS, "TRANSLATIONS");
checkDuplicateIds(REORDERS, "REORDERS");
checkDuplicateIds(VOCAB, "VOCAB");
checkDuplicateIds(SCENARIOS, "SCENARIOS");
checkDuplicateIds(PLANNINGS, "PLANNINGS");

checkChapterRefs(QUESTIONS, "QUESTIONS");
checkChapterRefs(TRANSLATIONS, "TRANSLATIONS");
checkChapterRefs(REORDERS, "REORDERS");
checkChapterRefs(VOCAB, "VOCAB");
checkChapterRefs(SCENARIOS, "SCENARIOS");
checkChapterRefs(PLANNINGS, "PLANNINGS");

checkMCQ(QUESTIONS, "QUESTIONS");
checkMCQ(TRANSLATIONS, "TRANSLATIONS");
checkMCQ(VOCAB, "VOCAB");
checkMCQ(SCENARIOS, "SCENARIOS");

for (const r of REORDERS) {
  if (r.chunks.length < 2) err(`[REORDERS] ${r.id} chỉ có ${r.chunks.length} cụm — cần tối thiểu 2`);
  if (!r.meaningVi?.trim()) err(`[REORDERS] ${r.id} thiếu meaningVi`);
  if (new Set(r.chunks).size !== r.chunks.length) {
    warn(`[REORDERS] ${r.id} có cụm từ trùng nhau trong chunks — có thể gây nhầm lẫn khi ghép câu`);
  }
}

for (const p of PLANNINGS) {
  if (p.steps.length < 2) err(`[PLANNINGS] ${p.id} chỉ có ${p.steps.length} bước — cần tối thiểu 2`);
  if (!p.scenarioJa?.trim() || !p.scenarioVi?.trim()) err(`[PLANNINGS] ${p.id} thiếu scenarioJa/scenarioVi`);
  const jaSteps = p.steps.map((s) => s.ja);
  if (new Set(jaSteps).size !== jaSteps.length) {
    warn(`[PLANNINGS] ${p.id} có bước trùng nhau trong steps — có thể gây nhầm lẫn khi sắp xếp`);
  }
}

for (const s of SCENARIOS) {
  if (!s.scenarioJa?.trim() || !s.scenarioVi?.trim()) err(`[SCENARIOS] ${s.id} thiếu scenarioJa/scenarioVi`);
}

checkDuplicateIds(MATCHINGS, "MATCHINGS");
checkDuplicateIds(FILLBLANKS, "FILLBLANKS");
checkChapterRefs(MATCHINGS, "MATCHINGS");
checkChapterRefs(FILLBLANKS, "FILLBLANKS");
checkMCQ(FILLBLANKS, "FILLBLANKS");
checkCitation(FILLBLANKS, "FILLBLANKS");
checkDistribution(FILLBLANKS, "FILLBLANKS");

for (const m of MATCHINGS) {
  if (!m.instructionJa?.trim() || !m.instructionVi?.trim()) err(`[MATCHINGS] ${m.id} thiếu instructionJa/instructionVi`);
  if (m.items.length < 2) err(`[MATCHINGS] ${m.id} chỉ có ${m.items.length} item — cần tối thiểu 2`);
  if (m.targets.length < 1) err(`[MATCHINGS] ${m.id} không có target nào`);
  if (!m.explanationVi?.trim()) err(`[MATCHINGS] ${m.id} thiếu explanationVi`);

  const targetIds = new Set(m.targets.map((t) => t.id));
  const seenItemIds = new Set<string>();
  for (const it of m.items) {
    if (seenItemIds.has(it.id)) err(`[MATCHINGS] ${m.id} item id trùng lặp trong cùng câu: ${it.id}`);
    seenItemIds.add(it.id);
    if (!targetIds.has(it.targetId)) {
      err(`[MATCHINGS] ${m.id} item ${it.id} tham chiếu targetId không tồn tại: "${it.targetId}"`);
    }
    if (!it.sourceQuoteJa?.trim()) err(`[MATCHINGS] ${m.id} item ${it.id} thiếu sourceQuoteJa`);
    if (!it.sourcePage || it.sourcePage < 1) err(`[MATCHINGS] ${m.id} item ${it.id} sourcePage không hợp lệ: ${it.sourcePage}`);
  }
  // Nếu >1 target mà tất cả item đều dồn vào đúng 1 target thì câu Phân loại này không có giá trị phân loại thật.
  if (m.targets.length > 1) {
    const usedTargets = new Set(m.items.map((it) => it.targetId));
    if (usedTargets.size === 1) {
      warn(`[MATCHINGS] ${m.id} có ${m.targets.length} nhóm nhưng tất cả item đều thuộc đúng 1 nhóm — không có giá trị phân loại`);
    }
  }
}

checkCitation(QUESTIONS, "QUESTIONS");
checkCitation(TRANSLATIONS, "TRANSLATIONS");
checkCitation(REORDERS, "REORDERS");
checkCitation(SCENARIOS, "SCENARIOS");
checkCitation(PLANNINGS, "PLANNINGS");

checkDistribution(QUESTIONS, "QUESTIONS");
checkDistribution(TRANSLATIONS, "TRANSLATIONS");
checkDistribution(VOCAB, "VOCAB");
checkDistribution(SCENARIOS, "SCENARIOS");

const errors = issues.filter((i) => i.level === "error");
const warnings = issues.filter((i) => i.level === "warn");

console.log("\n=== Kiểm tra dữ liệu /dac-dinh ===");
console.log(
  `Chương: ${CHAPTERS.length} | Trắc nghiệm: ${QUESTIONS.length} | Dịch câu: ${TRANSLATIONS.length} | Sắp xếp câu: ${REORDERS.length} | Từ vựng: ${VOCAB.length} | Tình huống & Tính toán: ${SCENARIOS.length} | Lập kế hoạch: ${PLANNINGS.length} | Phân loại: ${MATCHINGS.length} | Điền từ: ${FILLBLANKS.length}\n`
);

if (errors.length) {
  console.log(`❌ ${errors.length} LỖI:`);
  errors.forEach((e) => console.log(`  - ${e.message}`));
}
if (warnings.length) {
  console.log(`⚠️  ${warnings.length} CẢNH BÁO:`);
  warnings.forEach((w) => console.log(`  - ${w.message}`));
}
if (!errors.length && !warnings.length) {
  console.log("✅ Không phát hiện lỗi cấu trúc nào.");
}
console.log("");

process.exit(errors.length > 0 ? 1 : 0);
