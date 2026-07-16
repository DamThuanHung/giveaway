"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/components/AuthProvider";
import {
  PARTS,
  CHAPTERS,
  SOURCE_DOC_BY_PART,
  chaptersByPart,
  questionsByChapter,
  translationsByChapter,
  vocabByChapter,
  reordersByChapter,
  type QuizQuestion,
  type TranslationQuestion,
  type VocabQuestion,
  type ReorderQuestion,
  type ExerciseType,
} from "./data";

type Screen = "parts" | "chapters" | "exercise" | "vocab" | "translation" | "reorder" | "quiz" | "result";

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type BestScore = { score: number; total: number; date: string };

const STORAGE_KEY = "dac-dinh-best-scores-v2";

// Thứ tự học: Từ vựng → Dịch câu → Sắp xếp câu → Trắc nghiệm kiến thức.
// Dạng sau chỉ mở khóa khi dạng ngay trước đạt 100% (điểm tuyệt đối) ở chương đó.
const EXERCISE_TYPES: { id: ExerciseType; emoji: string; label: string }[] = [
  { id: "vocab", emoji: "🔤", label: "Từ vựng" },
  { id: "translation", emoji: "🔄", label: "Dịch câu" },
  { id: "reorder", emoji: "🧩", label: "Sắp xếp câu" },
  { id: "quiz", emoji: "📝", label: "Trắc nghiệm kiến thức" },
];

function exerciseStorageKey(chapterId: string, exerciseId: ExerciseType) {
  return `${chapterId}:${exerciseId}`;
}

function loadBestScores(): Record<string, BestScore> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveBestScore(key: string, score: number, total: number) {
  const all = loadBestScores();
  const prev = all[key];
  if (!prev || score > prev.score) {
    all[key] = { score, total, date: new Date().toISOString() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }
}

const DAC_DINH_PATH = "/dac-dinh/";

export default function DacDinhPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("parts");
  const [partId, setPartId] = useState<string | null>(null);
  const [chapterId, setChapterId] = useState<string | null>(null);
  const [activeExercise, setActiveExercise] = useState<ExerciseType | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [translationQuestions, setTranslationQuestions] = useState<TranslationQuestion[]>([]);
  const [vocabQuestions, setVocabQuestions] = useState<VocabQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [bestScores, setBestScores] = useState<Record<string, BestScore>>({});

  // Sắp xếp câu — trạng thái riêng vì cơ chế "ghép cụm từ" khác với trắc nghiệm chọn 1 đáp án.
  const [reorderQuestions, setReorderQuestions] = useState<ReorderQuestion[]>([]);
  const [reorderPool, setReorderPool] = useState<string[]>([]);
  const [reorderBuilt, setReorderBuilt] = useState<string[]>([]);
  const [reorderRevealed, setReorderRevealed] = useState(false);
  const [reorderAnswers, setReorderAnswers] = useState<boolean[]>([]);
  // CHỈ DÙNG ĐỂ TEST — mở khóa tạm thời toàn bộ dạng bài để xem giao diện, không đụng vào localStorage/điểm số thật.
  // Gỡ bỏ khi các dạng bài đã có đủ nội dung và không cần bypass nữa.
  const [devUnlockAll, setDevUnlockAll] = useState(false);

  useEffect(() => {
    setBestScores(loadBestScores());
  }, []);

  function openPart(id: string) {
    setPartId(id);
    setScreen("chapters");
  }

  function openChapter(id: string) {
    setChapterId(id);
    setScreen("exercise");
  }

  // Duyệt Phần/Chương thì tự do, nhưng phải đăng nhập Trao Tay mới được bắt đầu làm bài.
  function requireAuth(): boolean {
    if (authLoading) return false; // chưa xác định được trạng thái đăng nhập, chưa làm gì cả
    if (!user) {
      router.push(`/login/?next=${encodeURIComponent(DAC_DINH_PATH)}`);
      return false;
    }
    return true;
  }

  function startQuiz(chId: string) {
    if (!requireAuth()) return;
    const qs = questionsByChapter(chId);
    if (qs.length === 0) return;
    setChapterId(chId);
    setActiveExercise("quiz");
    setQuestions(qs);
    setCurrent(0);
    setSelected(null);
    setAnswers([]);
    setScreen("quiz");
  }

  function startTranslation(chId: string) {
    if (!requireAuth()) return;
    const ts = translationsByChapter(chId);
    if (ts.length === 0) return;
    setChapterId(chId);
    setActiveExercise("translation");
    setTranslationQuestions(ts);
    setCurrent(0);
    setSelected(null);
    setAnswers([]);
    setScreen("translation");
  }

  function startVocab(chId: string) {
    if (!requireAuth()) return;
    const vs = vocabByChapter(chId);
    if (vs.length === 0) return;
    setChapterId(chId);
    setActiveExercise("vocab");
    setVocabQuestions(vs);
    setCurrent(0);
    setSelected(null);
    setAnswers([]);
    setScreen("vocab");
  }

  function startReorder(chId: string) {
    if (!requireAuth()) return;
    const rs = reordersByChapter(chId);
    if (rs.length === 0) return;
    setChapterId(chId);
    setActiveExercise("reorder");
    setReorderQuestions(rs);
    setCurrent(0);
    setReorderPool(shuffleArray(rs[0].chunks));
    setReorderBuilt([]);
    setReorderRevealed(false);
    setReorderAnswers([]);
    setScreen("reorder");
  }

  function pickAnswer(index: number) {
    if (selected !== null) return; // đã chọn rồi, khóa lại
    setSelected(index);
  }

  function correctIndexAt(i: number): number | undefined {
    if (activeExercise === "quiz") return questions[i]?.correctIndex;
    if (activeExercise === "translation") return translationQuestions[i]?.correctIndex;
    if (activeExercise === "vocab") return vocabQuestions[i]?.correctIndex;
    return undefined;
  }

  function nextQuestion() {
    const nextAnswers = [...answers, selected];
    setAnswers(nextAnswers);
    setSelected(null);

    const total =
      activeExercise === "quiz" ? questions.length : activeExercise === "translation" ? translationQuestions.length : vocabQuestions.length;

    if (current + 1 < total) {
      setCurrent(current + 1);
    } else {
      const sc = nextAnswers.filter((a, i) => a === correctIndexAt(i)).length;
      if (chapterId && activeExercise) saveBestScore(exerciseStorageKey(chapterId, activeExercise), sc, total);
      setBestScores(loadBestScores());
      setScreen("result");
    }
  }

  // Sắp xếp câu: bấm cụm trong "pool" để thêm vào câu đang ghép, bấm lại trong câu đang ghép để trả về pool.
  function pickChunk(index: number) {
    if (reorderRevealed) return;
    const chunk = reorderPool[index];
    setReorderPool((p) => p.filter((_, i) => i !== index));
    setReorderBuilt((b) => [...b, chunk]);
  }

  function unpickChunk(index: number) {
    if (reorderRevealed) return;
    const chunk = reorderBuilt[index];
    setReorderBuilt((b) => b.filter((_, i) => i !== index));
    setReorderPool((p) => [...p, chunk]);
  }

  function checkReorder() {
    const rq = reorderQuestions[current];
    const correct = JSON.stringify(reorderBuilt) === JSON.stringify(rq.chunks);
    setReorderRevealed(true);
    setReorderAnswers((a) => [...a, correct]);
  }

  function nextReorderQuestion() {
    const nextIdx = current + 1;
    if (nextIdx < reorderQuestions.length) {
      setCurrent(nextIdx);
      setReorderPool(shuffleArray(reorderQuestions[nextIdx].chunks));
      setReorderBuilt([]);
      setReorderRevealed(false);
    } else {
      const sc = reorderAnswers.filter(Boolean).length;
      if (chapterId) saveBestScore(exerciseStorageKey(chapterId, "reorder"), sc, reorderQuestions.length);
      setBestScores(loadBestScores());
      setScreen("result");
    }
  }

  function backToParts() {
    setScreen("parts");
    setPartId(null);
    setChapterId(null);
    setActiveExercise(null);
  }

  function backToChapters() {
    setScreen("chapters");
    setChapterId(null);
    setActiveExercise(null);
  }

  // Thoát khỏi dạng bài đang làm dở, quay về menu chọn dạng bài của chương hiện tại (không mất chương/phần đang chọn).
  function exitExercise() {
    setScreen("exercise");
    setActiveExercise(null);
  }

  // Dạng bài chỉ mở khóa khi dạng ngay trước nó đã đạt 100% ở cùng chương.
  // Từ vựng (dạng đầu tiên) luôn mở.
  function isUnlocked(chId: string, exerciseId: ExerciseType): boolean {
    if (devUnlockAll) return true; // CHỈ DÙNG ĐỂ TEST
    const idx = EXERCISE_TYPES.findIndex((e) => e.id === exerciseId);
    if (idx <= 0) return true;
    const prevId = EXERCISE_TYPES[idx - 1].id;
    const prevBest = bestScores[exerciseStorageKey(chId, prevId)];
    return !!prevBest && prevBest.total > 0 && prevBest.score === prevBest.total;
  }

  const part = PARTS.find((p) => p.id === partId);
  const chapter = CHAPTERS.find((c) => c.id === chapterId);
  const q = questions[current];
  const tq = translationQuestions[current];
  const vq = vocabQuestions[current];
  const rq = reorderQuestions[current];
  const resultTotal =
    activeExercise === "quiz"
      ? questions.length
      : activeExercise === "translation"
      ? translationQuestions.length
      : activeExercise === "vocab"
      ? vocabQuestions.length
      : reorderQuestions.length;
  const score =
    activeExercise === "reorder"
      ? reorderAnswers.filter(Boolean).length
      : answers.filter((a, i) => a === correctIndexAt(i)).length;

  return (
    <>
      <Header />

      <section className="bg-gradient-warm border-b border-ink-200/50">
        <div className="max-w-3xl mx-auto px-4 py-7 md:py-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-ink-900 tracking-tight">
            🇯🇵 Luyện thi Đặc định kỹ năng
          </h1>
          <p className="text-ink-600 text-sm mt-1">
            外食業特定技能２号技能測定試験 — Bài tập song ngữ theo tài liệu học tập chính thức OTAFF
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-6">
        {screen === "parts" && (
          <div className="grid sm:grid-cols-2 gap-4 animate-fade-in">
            {PARTS.map((p) => {
              const chapters = chaptersByPart(p.id);
              const totalQuestions = chapters.reduce((sum, c) => sum + questionsByChapter(c.id).length, 0);
              return (
                <button
                  key={p.id}
                  onClick={() => openPart(p.id)}
                  className="text-left bg-white border border-ink-200/70 rounded-md shadow-soft hover:shadow-card hover:border-primary transition duration-150 ease-warm p-5 flex flex-col gap-2"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl leading-none">{p.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-ink-900">{p.titleVi}</p>
                      <p className="text-sm text-ink-500">{p.titleJa}</p>
                    </div>
                  </div>
                  <p className="text-xs text-ink-500">
                    {chapters.length} chương · {totalQuestions} câu hỏi hiện có
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {screen === "chapters" && part && (
          <div className="animate-fade-in">
            <button
              onClick={backToParts}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-800 bg-white border border-ink-200 hover:border-primary hover:text-primary hover:bg-primary-light/50 active:scale-[0.97] px-4 py-2 rounded-full shadow-soft hover:shadow-card transition duration-150 ease-warm mb-4"
            >
              ← Quay lại
            </button>
            <h2 className="text-xl font-extrabold text-ink-900 mb-1">
              {part.emoji} {part.titleVi}
            </h2>
            <p className="text-sm text-ink-500 mb-5">{part.titleJa}</p>

            <div className="space-y-2.5">
              {chaptersByPart(part.id).map((c) => {
                const qs = questionsByChapter(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => openChapter(c.id)}
                    className="w-full text-left bg-white border border-ink-200/70 hover:border-primary rounded-md shadow-soft hover:shadow-card transition duration-150 ease-warm p-4 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 shrink-0 rounded-full bg-primary-100 text-primary-dark font-bold text-sm flex items-center justify-center">
                      {c.order}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink-900 text-sm">{c.titleVi}</p>
                      <p className="text-xs text-ink-500">{c.titleJa}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-ink-500">{qs.length > 0 ? `${qs.length} câu` : "Sắp có"}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {screen === "exercise" && chapter && part && (
          <div className="animate-fade-in">
            <button
              onClick={backToChapters}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-800 bg-white border border-ink-200 hover:border-primary hover:text-primary hover:bg-primary-light/50 active:scale-[0.97] px-4 py-2 rounded-full shadow-soft hover:shadow-card transition duration-150 ease-warm mb-4"
            >
              ← Quay lại
            </button>
            <p className="text-xs text-ink-500">
              {part.emoji} {part.titleVi} · Chương {chapter.order}
            </p>
            <h2 className="text-xl font-extrabold text-ink-900 mb-1">{chapter.titleVi}</h2>
            <p className="text-sm text-ink-500 mb-5">{chapter.titleJa}</p>

            {!authLoading && !user && (
              <div className="mb-4 bg-primary-100/40 border border-primary/40 rounded-md p-3 flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm text-ink-700">
                  🔐 Cần <span className="font-semibold">đăng nhập Trao Tay</span> để bắt đầu làm bài.
                </p>
                <button
                  onClick={() => router.push(`/login/?next=${encodeURIComponent(DAC_DINH_PATH)}`)}
                  className="bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-1.5 rounded-md shadow-soft transition duration-150 ease-warm"
                >
                  Đăng nhập ngay
                </button>
              </div>
            )}

            {process.env.NODE_ENV === "development" && (
              <button
                onClick={() => setDevUnlockAll((v) => !v)}
                className="mb-4 text-xs border border-dashed border-amber-400 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-md"
              >
                🛠️ DEV ONLY — {devUnlockAll ? "Đang mở khóa tạm thời (bấm để tắt)" : "Mở khóa tạm thời để test giao diện"}
              </button>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              {EXERCISE_TYPES.map((ex, idx) => {
                const contentLength =
                  ex.id === "quiz"
                    ? questionsByChapter(chapter.id).length
                    : ex.id === "translation"
                    ? translationsByChapter(chapter.id).length
                    : ex.id === "vocab"
                    ? vocabByChapter(chapter.id).length
                    : reordersByChapter(chapter.id).length;
                const hasContent = contentLength > 0;
                const unlocked = isUnlocked(chapter.id, ex.id);
                const available = unlocked && hasContent;

                let statusText = "Sắp có nội dung";
                if (!unlocked) {
                  const prevLabel = EXERCISE_TYPES[idx - 1].label;
                  statusText = `Khóa — cần đạt 100% "${prevLabel}" trước`;
                } else if (hasContent) {
                  statusText = `${contentLength} câu`;
                }

                return (
                  <button
                    key={ex.id}
                    onClick={() => {
                      if (!available) return;
                      if (ex.id === "quiz") startQuiz(chapter.id);
                      else if (ex.id === "translation") startTranslation(chapter.id);
                      else if (ex.id === "vocab") startVocab(chapter.id);
                      else if (ex.id === "reorder") startReorder(chapter.id);
                    }}
                    disabled={!available}
                    className={`text-left border rounded-md p-4 flex items-center gap-3 transition duration-150 ease-warm ${
                      available
                        ? "bg-white border-ink-200/70 hover:border-primary hover:shadow-card shadow-soft"
                        : "bg-cream-50 border-ink-200/50 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <div className="text-2xl leading-none">{unlocked ? ex.emoji : "🔒"}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink-900 text-sm">{ex.label}</p>
                      <p className="text-xs text-ink-500">{statusText}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {screen === "vocab" && vq && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-ink-600">
                {part?.emoji} {chapter?.titleVi} · 🔤 Từ vựng
              </p>
              <div className="flex items-center gap-3 shrink-0">
                <p className="text-sm text-ink-500">
                  Câu {current + 1}/{vocabQuestions.length}
                </p>
                <button
                  onClick={exitExercise}
                  className="text-xs font-semibold text-ink-500 hover:text-primary border border-ink-200 hover:border-primary rounded-full px-2.5 py-1 transition duration-150 ease-warm"
                >
                  ✕ Thoát
                </button>
              </div>
            </div>

            <div className="w-full h-2 bg-ink-100 rounded-full overflow-hidden mb-5">
              <div
                className="h-full bg-primary transition-all duration-250 ease-warm"
                style={{ width: `${((current + 1) / vocabQuestions.length) * 100}%` }}
              />
            </div>

            <div className="bg-white border border-ink-200/70 rounded-md shadow-card p-5 md:p-6">
              <p className="text-xs font-semibold text-primary-dark mb-2">
                {vq.direction === "ja-to-vi" ? "🇯🇵 Từ/cụm từ này nghĩa là gì?" : "🇻🇳 Từ tiếng Nhật tương ứng là gì?"}
              </p>
              <p className="text-lg font-bold text-ink-900 leading-relaxed mb-5">{vq.term}</p>

              <div className="space-y-2.5">
                {vq.options.map((opt, i) => {
                  const isCorrect = i === vq.correctIndex;
                  const isSelected = i === selected;
                  const revealed = selected !== null;

                  let style =
                    "border-ink-200/70 bg-white hover:border-primary hover:bg-primary-100/20";
                  if (revealed && isCorrect) {
                    style = "border-primary bg-primary-100/40";
                  } else if (revealed && isSelected && !isCorrect) {
                    style = "border-red-300 bg-red-50";
                  } else if (revealed) {
                    style = "border-ink-200/70 bg-white opacity-60";
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => pickAnswer(i)}
                      disabled={revealed}
                      className={`w-full text-left border rounded-md px-4 py-3 transition duration-150 ease-warm ${style}`}
                    >
                      <p className="font-semibold text-ink-900">{opt}</p>
                    </button>
                  );
                })}
              </div>

              {selected !== null && (
                <div className="mt-5 bg-cream-50 border border-ink-200/50 rounded-md p-4 animate-fade-in">
                  <p className="font-bold text-sm mb-1">
                    {selected === vq.correctIndex ? "✅ Chính xác!" : "❌ Chưa đúng — đáp án đúng là:"}
                  </p>
                  {selected !== vq.correctIndex && (
                    <p className="text-sm font-semibold text-primary-dark">{vq.options[vq.correctIndex]}</p>
                  )}
                  <button
                    onClick={nextQuestion}
                    className="mt-4 bg-primary hover:bg-primary-dark active:scale-[0.97] text-white font-bold px-5 py-2.5 rounded-md shadow-soft hover:shadow-card transition duration-150 ease-warm"
                  >
                    {current + 1 < vocabQuestions.length ? "Câu tiếp theo →" : "Xem kết quả"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {screen === "translation" && tq && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-ink-600">
                {part?.emoji} {chapter?.titleVi} · 🔄 Dịch câu
              </p>
              <div className="flex items-center gap-3 shrink-0">
                <p className="text-sm text-ink-500">
                  Câu {current + 1}/{translationQuestions.length}
                </p>
                <button
                  onClick={exitExercise}
                  className="text-xs font-semibold text-ink-500 hover:text-primary border border-ink-200 hover:border-primary rounded-full px-2.5 py-1 transition duration-150 ease-warm"
                >
                  ✕ Thoát
                </button>
              </div>
            </div>

            <div className="w-full h-2 bg-ink-100 rounded-full overflow-hidden mb-5">
              <div
                className="h-full bg-primary transition-all duration-250 ease-warm"
                style={{ width: `${((current + 1) / translationQuestions.length) * 100}%` }}
              />
            </div>

            <div className="bg-white border border-ink-200/70 rounded-md shadow-card p-5 md:p-6">
              <p className="text-xs font-semibold text-primary-dark mb-2">
                {tq.direction === "ja-to-vi" ? "🇯🇵 Dịch câu sau sang tiếng Việt" : "🇻🇳 Dịch câu sau sang tiếng Nhật"}
              </p>
              <p className="text-lg font-bold text-ink-900 leading-relaxed mb-5">{tq.prompt}</p>

              <div className="space-y-2.5">
                {tq.options.map((opt, i) => {
                  const isCorrect = i === tq.correctIndex;
                  const isSelected = i === selected;
                  const revealed = selected !== null;

                  let style =
                    "border-ink-200/70 bg-white hover:border-primary hover:bg-primary-100/20";
                  if (revealed && isCorrect) {
                    style = "border-primary bg-primary-100/40";
                  } else if (revealed && isSelected && !isCorrect) {
                    style = "border-red-300 bg-red-50";
                  } else if (revealed) {
                    style = "border-ink-200/70 bg-white opacity-60";
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => pickAnswer(i)}
                      disabled={revealed}
                      className={`w-full text-left border rounded-md px-4 py-3 transition duration-150 ease-warm ${style}`}
                    >
                      <p className="font-semibold text-ink-900">{opt}</p>
                    </button>
                  );
                })}
              </div>

              {selected !== null && (
                <div className="mt-5 bg-cream-50 border border-ink-200/50 rounded-md p-4 animate-fade-in">
                  <p className="font-bold text-sm mb-1">
                    {selected === tq.correctIndex ? "✅ Chính xác!" : "❌ Chưa đúng — đáp án đúng là:"}
                  </p>
                  {selected !== tq.correctIndex && (
                    <p className="text-sm font-semibold text-primary-dark mb-2">{tq.options[tq.correctIndex]}</p>
                  )}
                  <div className="pt-1">
                    <p className="text-xs text-ink-500 leading-relaxed">
                      📖 Trích dẫn OTAFF — {chapter && SOURCE_DOC_BY_PART[chapter.partId]}, trang {tq.sourcePage}:
                      「{tq.sourceQuoteJa}」
                    </p>
                  </div>
                  <button
                    onClick={nextQuestion}
                    className="mt-4 bg-primary hover:bg-primary-dark active:scale-[0.97] text-white font-bold px-5 py-2.5 rounded-md shadow-soft hover:shadow-card transition duration-150 ease-warm"
                  >
                    {current + 1 < translationQuestions.length ? "Câu tiếp theo →" : "Xem kết quả"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {screen === "reorder" && rq && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-ink-600">
                {part?.emoji} {chapter?.titleVi} · 🧩 Sắp xếp câu
              </p>
              <div className="flex items-center gap-3 shrink-0">
                <p className="text-sm text-ink-500">
                  Câu {current + 1}/{reorderQuestions.length}
                </p>
                <button
                  onClick={exitExercise}
                  className="text-xs font-semibold text-ink-500 hover:text-primary border border-ink-200 hover:border-primary rounded-full px-2.5 py-1 transition duration-150 ease-warm"
                >
                  ✕ Thoát
                </button>
              </div>
            </div>

            <div className="w-full h-2 bg-ink-100 rounded-full overflow-hidden mb-5">
              <div
                className="h-full bg-primary transition-all duration-250 ease-warm"
                style={{ width: `${((current + 1) / reorderQuestions.length) * 100}%` }}
              />
            </div>

            <div className="bg-white border border-ink-200/70 rounded-md shadow-card p-5 md:p-6">
              <p className="text-xs font-semibold text-primary-dark mb-3">
                Bấm các cụm từ bên dưới theo đúng thứ tự để ghép thành câu hoàn chỉnh
              </p>

              {/* Khung câu đang ghép */}
              <div className="min-h-[3.5rem] border-2 border-dashed border-ink-200 rounded-md p-3 flex flex-wrap gap-2 mb-4 bg-cream-50">
                {reorderBuilt.length === 0 && (
                  <p className="text-sm text-ink-400">Bấm cụm từ bên dưới để bắt đầu ghép câu...</p>
                )}
                {reorderBuilt.map((chunk, i) => (
                  <button
                    key={i}
                    onClick={() => unpickChunk(i)}
                    disabled={reorderRevealed}
                    className="bg-primary-100 border border-primary text-primary-dark font-semibold text-sm px-3 py-1.5 rounded-md hover:bg-primary-100/60 transition duration-150 ease-warm"
                  >
                    {chunk}
                  </button>
                ))}
              </div>

              {/* Pool các cụm còn lại */}
              <div className="flex flex-wrap gap-2 mb-4">
                {reorderPool.map((chunk, i) => (
                  <button
                    key={i}
                    onClick={() => pickChunk(i)}
                    className="bg-white border border-ink-200/70 text-ink-900 font-semibold text-sm px-3 py-1.5 rounded-md hover:border-primary hover:bg-primary-100/20 transition duration-150 ease-warm"
                  >
                    {chunk}
                  </button>
                ))}
              </div>

              {!reorderRevealed && (
                <button
                  onClick={checkReorder}
                  disabled={reorderPool.length > 0}
                  className="bg-primary hover:bg-primary-dark active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-5 py-2.5 rounded-md shadow-soft hover:shadow-card transition duration-150 ease-warm"
                >
                  Kiểm tra
                </button>
              )}

              {reorderRevealed && (
                <div className="mt-2 bg-cream-50 border border-ink-200/50 rounded-md p-4 animate-fade-in">
                  <p className="font-bold text-sm mb-2">
                    {JSON.stringify(reorderBuilt) === JSON.stringify(rq.chunks)
                      ? "✅ Chính xác!"
                      : "❌ Chưa đúng thứ tự"}
                  </p>
                  <p className="text-sm text-ink-900 font-semibold mb-1">Câu đúng: {rq.chunks.join("")}</p>
                  <p className="text-sm text-ink-600 leading-relaxed mb-3">Nghĩa: {rq.meaningVi}</p>
                  <p className="text-xs text-ink-500 leading-relaxed border-t border-ink-200/50 pt-2">
                    📖 Trích dẫn OTAFF — {chapter && SOURCE_DOC_BY_PART[chapter.partId]}, trang {rq.sourcePage}:
                    「{rq.sourceQuoteJa}」
                  </p>
                  <button
                    onClick={nextReorderQuestion}
                    className="mt-4 bg-primary hover:bg-primary-dark active:scale-[0.97] text-white font-bold px-5 py-2.5 rounded-md shadow-soft hover:shadow-card transition duration-150 ease-warm"
                  >
                    {current + 1 < reorderQuestions.length ? "Câu tiếp theo →" : "Xem kết quả"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {screen === "quiz" && q && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-ink-600">
                {part?.emoji} {chapter?.titleVi}
              </p>
              <div className="flex items-center gap-3 shrink-0">
                <p className="text-sm text-ink-500">
                  Câu {current + 1}/{questions.length}
                </p>
                <button
                  onClick={exitExercise}
                  className="text-xs font-semibold text-ink-500 hover:text-primary border border-ink-200 hover:border-primary rounded-full px-2.5 py-1 transition duration-150 ease-warm"
                >
                  ✕ Thoát
                </button>
              </div>
            </div>

            <div className="w-full h-2 bg-ink-100 rounded-full overflow-hidden mb-5">
              <div
                className="h-full bg-primary transition-all duration-250 ease-warm"
                style={{ width: `${((current + 1) / questions.length) * 100}%` }}
              />
            </div>

            <div className="bg-white border border-ink-200/70 rounded-md shadow-card p-5 md:p-6">
              <p className="text-lg font-bold text-ink-900 leading-relaxed">{q.questionJa}</p>
              <p className="text-sm text-ink-500 mt-1 mb-5">{q.questionVi}</p>

              <div className="space-y-2.5">
                {q.options.map((opt, i) => {
                  const isCorrect = i === q.correctIndex;
                  const isSelected = i === selected;
                  const revealed = selected !== null;

                  let style =
                    "border-ink-200/70 bg-white hover:border-primary hover:bg-primary-100/20";
                  if (revealed && isCorrect) {
                    style = "border-primary bg-primary-100/40";
                  } else if (revealed && isSelected && !isCorrect) {
                    style = "border-red-300 bg-red-50";
                  } else if (revealed) {
                    style = "border-ink-200/70 bg-white opacity-60";
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => pickAnswer(i)}
                      disabled={revealed}
                      className={`w-full text-left border rounded-md px-4 py-3 transition duration-150 ease-warm ${style}`}
                    >
                      <p className="font-semibold text-ink-900">{opt.ja}</p>
                      <p className="text-sm text-ink-500">{opt.vi}</p>
                    </button>
                  );
                })}
              </div>

              {selected !== null && (
                <div className="mt-5 bg-cream-50 border border-ink-200/50 rounded-md p-4 animate-fade-in">
                  <p className="font-bold text-sm mb-1">
                    {selected === q.correctIndex ? "✅ Chính xác!" : "❌ Chưa đúng — đáp án đúng là:"}
                  </p>
                  {selected !== q.correctIndex && (
                    <p className="text-sm font-semibold text-primary-dark mb-2">
                      {q.options[q.correctIndex].vi}
                    </p>
                  )}
                  <p className="text-sm text-ink-600 leading-relaxed">{q.explanationVi}</p>
                  <div className="mt-3 pt-3 border-t border-ink-200/50">
                    <p className="text-xs text-ink-500 leading-relaxed">
                      📖 Trích dẫn OTAFF — {chapter && SOURCE_DOC_BY_PART[chapter.partId]}, trang {q.sourcePage}:
                      「{q.sourceQuoteJa}」
                    </p>
                  </div>
                  <button
                    onClick={nextQuestion}
                    className="mt-4 bg-primary hover:bg-primary-dark active:scale-[0.97] text-white font-bold px-5 py-2.5 rounded-md shadow-soft hover:shadow-card transition duration-150 ease-warm"
                  >
                    {current + 1 < questions.length ? "Câu tiếp theo →" : "Xem kết quả"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {screen === "result" && (
          <div className="animate-fade-in">
            <div className="bg-white border border-ink-200/70 rounded-md shadow-card p-6 text-center">
              <div className="text-5xl mb-2">
                {score === resultTotal ? "🎉" : score >= resultTotal / 2 ? "👍" : "💪"}
              </div>
              <p className="text-2xl font-extrabold text-ink-900">
                {score}/{resultTotal} câu đúng
              </p>
              <p className="text-ink-500 text-sm mt-1">
                {part?.emoji} {chapter?.titleVi} ·{" "}
                {EXERCISE_TYPES.find((e) => e.id === activeExercise)?.label}
              </p>
              {score < resultTotal && (
                <p className="text-xs text-ink-400 mt-2">
                  Cần đạt {resultTotal}/{resultTotal} (100%) để mở khóa dạng bài tiếp theo.
                </p>
              )}
            </div>

            <div className="mt-5 space-y-3">
              <p className="font-bold text-ink-900 text-sm">Xem lại đáp án</p>

              {activeExercise === "quiz" &&
                questions.map((qq, i) => {
                  const userAnswer = answers[i];
                  const correct = userAnswer === qq.correctIndex;
                  return (
                    <div
                      key={qq.id}
                      className={`bg-white border rounded-md p-4 ${correct ? "border-ink-200/70" : "border-red-200"}`}
                    >
                      <p className="text-sm font-semibold text-ink-900">
                        {correct ? "✅" : "❌"} {qq.questionJa}
                      </p>
                      <p className="text-xs text-ink-500 mb-2">{qq.questionVi}</p>
                      {!correct && userAnswer !== null && userAnswer !== undefined && (
                        <p className="text-xs text-red-600 mb-1">Bạn chọn: {qq.options[userAnswer].vi}</p>
                      )}
                      <p className="text-xs text-primary-dark font-semibold mb-1">
                        Đáp án đúng: {qq.options[qq.correctIndex].vi}
                      </p>
                      <p className="text-xs text-ink-600 leading-relaxed mb-2">{qq.explanationVi}</p>
                      <p className="text-xs text-ink-400 leading-relaxed border-t border-ink-200/50 pt-2">
                        📖 Trích dẫn OTAFF — {part && SOURCE_DOC_BY_PART[part.id]}, trang {qq.sourcePage}:
                        「{qq.sourceQuoteJa}」
                      </p>
                    </div>
                  );
                })}

              {activeExercise === "translation" &&
                translationQuestions.map((tqq, i) => {
                  const userAnswer = answers[i];
                  const correct = userAnswer === tqq.correctIndex;
                  return (
                    <div
                      key={tqq.id}
                      className={`bg-white border rounded-md p-4 ${correct ? "border-ink-200/70" : "border-red-200"}`}
                    >
                      <p className="text-xs text-ink-400 mb-1">
                        {tqq.direction === "ja-to-vi" ? "🇯🇵 → 🇻🇳" : "🇻🇳 → 🇯🇵"}
                      </p>
                      <p className="text-sm font-semibold text-ink-900">
                        {correct ? "✅" : "❌"} {tqq.prompt}
                      </p>
                      {!correct && userAnswer !== null && userAnswer !== undefined && (
                        <p className="text-xs text-red-600 mb-1 mt-1">Bạn chọn: {tqq.options[userAnswer]}</p>
                      )}
                      <p className="text-xs text-primary-dark font-semibold mb-1 mt-1">
                        Đáp án đúng: {tqq.options[tqq.correctIndex]}
                      </p>
                      <p className="text-xs text-ink-400 leading-relaxed border-t border-ink-200/50 pt-2 mt-2">
                        📖 Trích dẫn OTAFF — {part && SOURCE_DOC_BY_PART[part.id]}, trang {tqq.sourcePage}:
                        「{tqq.sourceQuoteJa}」
                      </p>
                    </div>
                  );
                })}

              {activeExercise === "vocab" &&
                vocabQuestions.map((vqq, i) => {
                  const userAnswer = answers[i];
                  const correct = userAnswer === vqq.correctIndex;
                  return (
                    <div
                      key={vqq.id}
                      className={`bg-white border rounded-md p-4 ${correct ? "border-ink-200/70" : "border-red-200"}`}
                    >
                      <p className="text-xs text-ink-400 mb-1">
                        {vqq.direction === "ja-to-vi" ? "🇯🇵 → 🇻🇳" : "🇻🇳 → 🇯🇵"}
                      </p>
                      <p className="text-sm font-semibold text-ink-900">
                        {correct ? "✅" : "❌"} {vqq.term}
                      </p>
                      {!correct && userAnswer !== null && userAnswer !== undefined && (
                        <p className="text-xs text-red-600 mb-1 mt-1">Bạn chọn: {vqq.options[userAnswer]}</p>
                      )}
                      <p className="text-xs text-primary-dark font-semibold mt-1">
                        Đáp án đúng: {vqq.options[vqq.correctIndex]}
                      </p>
                    </div>
                  );
                })}

              {activeExercise === "reorder" &&
                reorderQuestions.map((rqq, i) => {
                  const correct = reorderAnswers[i];
                  return (
                    <div
                      key={rqq.id}
                      className={`bg-white border rounded-md p-4 ${correct ? "border-ink-200/70" : "border-red-200"}`}
                    >
                      <p className="text-sm font-semibold text-ink-900">
                        {correct ? "✅" : "❌"} {rqq.chunks.join("")}
                      </p>
                      <p className="text-xs text-ink-500 mt-1">{rqq.meaningVi}</p>
                      <p className="text-xs text-ink-400 leading-relaxed border-t border-ink-200/50 pt-2 mt-2">
                        📖 Trích dẫn OTAFF — {part && SOURCE_DOC_BY_PART[part.id]}, trang {rqq.sourcePage}:
                        「{rqq.sourceQuoteJa}」
                      </p>
                    </div>
                  );
                })}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  if (!chapterId) return;
                  if (activeExercise === "quiz") startQuiz(chapterId);
                  else if (activeExercise === "translation") startTranslation(chapterId);
                  else if (activeExercise === "vocab") startVocab(chapterId);
                  else if (activeExercise === "reorder") startReorder(chapterId);
                }}
                className="flex-1 bg-primary hover:bg-primary-dark active:scale-[0.97] text-white font-bold px-4 py-3 rounded-md shadow-soft hover:shadow-card transition duration-150 ease-warm"
              >
                Làm lại
              </button>
              <button
                onClick={backToChapters}
                className="flex-1 border border-ink-200/70 hover:border-primary text-ink-900 font-bold px-4 py-3 rounded-md transition duration-150 ease-warm"
              >
                Chọn chương khác
              </button>
            </div>
          </div>
        )}
      </section>

      <Footer />
    </>
  );
}
