"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/components/AuthProvider";
import { recordDacDinhAttempt, sendDacDinhHeartbeat } from "@/lib/auth";
import {
  PARTS,
  CHAPTERS,
  SOURCE_DOC_BY_PART,
  chaptersByPart,
  questionsByChapter,
  translationsByChapter,
  vocabByChapter,
  reordersByChapter,
  scenariosByChapter,
  planningsByChapter,
  matchingsByChapter,
  fillBlanksByChapter,
  type QuizQuestion,
  type TranslationQuestion,
  type VocabQuestion,
  type ReorderQuestion,
  type ScenarioQuestion,
  type PlanningQuestion,
  type MatchingQuestion,
  type FillBlankQuestion,
  type ExerciseType,
} from "./data";

type Screen =
  | "parts"
  | "chapters"
  | "exercise"
  | "vocab"
  | "translation"
  | "reorder"
  | "matching"
  | "fillblank"
  | "quiz"
  | "judgment"
  | "planning"
  | "result";

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

// Thứ tự học: Từ vựng → Điền từ vào chỗ trống → Dịch câu → Sắp xếp câu → Trắc nghiệm kiến thức →
// Phân loại → Tình huống & Tính toán → Lập kế hoạch.
// Dạng sau chỉ mở khóa khi dạng ngay trước đạt 100% (điểm tuyệt đối) ở chương đó.
// "Điền từ" đặt ngay sau Từ vựng vì cùng kiểm tra từ vựng (thêm ngữ cảnh câu). "Phân loại" đặt sau
// Trắc nghiệm, ngay trước 2 dạng mô phỏng 実技試験 cuối cùng, vì cùng tầng kiến thức nội dung nhưng đòi
// hỏi phân biệt nhiều thuật ngữ cùng lúc thay vì chỉ chọn 1/4 — xem docs/modules/dac-dinh.md phần chuẩn nguồn.
const EXERCISE_TYPES: { id: ExerciseType; emoji: string; label: string }[] = [
  { id: "vocab", emoji: "🔤", label: "Từ vựng" },
  { id: "fillblank", emoji: "✏️", label: "Điền từ vào chỗ trống" },
  { id: "translation", emoji: "🔄", label: "Dịch câu" },
  { id: "reorder", emoji: "🧩", label: "Sắp xếp câu" },
  { id: "quiz", emoji: "📝", label: "Trắc nghiệm kiến thức" },
  { id: "matching", emoji: "🧷", label: "Phân loại" },
  { id: "judgment", emoji: "🎯", label: "Tình huống & Tính toán" },
  { id: "planning", emoji: "📋", label: "Lập kế hoạch" },
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

  // Tình huống & Tính toán (判断試験 + tính toán) — dùng chung cơ chế chọn 1 đáp án như quiz.
  const [scenarioQuestions, setScenarioQuestions] = useState<ScenarioQuestion[]>([]);

  // Lập kế hoạch (計画立案試験) — cơ chế ghép giống Sắp xếp câu, nhưng mỗi "step" hiện song song ja+vi.
  const [planningQuestions, setPlanningQuestions] = useState<PlanningQuestion[]>([]);
  const [planningPool, setPlanningPool] = useState<{ ja: string; vi: string }[]>([]);
  const [planningBuilt, setPlanningBuilt] = useState<{ ja: string; vi: string }[]>([]);
  const [planningRevealed, setPlanningRevealed] = useState(false);
  const [planningAnswers, setPlanningAnswers] = useState<boolean[]>([]);

  // Điền từ vào chỗ trống — dùng chung cơ chế chọn 1 đáp án như quiz.
  const [fillBlankQuestions, setFillBlankQuestions] = useState<FillBlankQuestion[]>([]);

  // Phân loại — bấm chọn 1 item trong "pool", rồi bấm 1 target để gán (không dùng drag-and-drop thật).
  const [matchingQuestions, setMatchingQuestions] = useState<MatchingQuestion[]>([]);
  const [matchingPool, setMatchingPool] = useState<{ id: string; ja: string; vi: string }[]>([]);
  const [matchingAssignments, setMatchingAssignments] = useState<Record<string, string>>({});
  const [matchingSelectedItem, setMatchingSelectedItem] = useState<string | null>(null);
  const [matchingRevealed, setMatchingRevealed] = useState(false);
  const [matchingAnswers, setMatchingAnswers] = useState<boolean[]>([]);
  // CHỈ DÙNG ĐỂ TEST — mở khóa tạm thời toàn bộ dạng bài để xem giao diện, không đụng vào localStorage/điểm số thật.
  // Gỡ bỏ khi các dạng bài đã có đủ nội dung và không cần bypass nữa.
  const [devUnlockAll, setDevUnlockAll] = useState(false);

  useEffect(() => {
    setBestScores(loadBestScores());
  }, []);

  // Ping presence cho admin đếm "đang online" — chạy suốt thời gian còn ở trang /dac-dinh,
  // không phụ thuộc đang làm bài hay chỉ xem danh sách chương. Xem ADR-0016.
  useEffect(() => {
    if (!user) return;
    sendDacDinhHeartbeat();
    const interval = setInterval(sendDacDinhHeartbeat, 45_000);
    return () => clearInterval(interval);
  }, [user]);

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

  function startJudgment(chId: string) {
    if (!requireAuth()) return;
    const ss = scenariosByChapter(chId);
    if (ss.length === 0) return;
    setChapterId(chId);
    setActiveExercise("judgment");
    setScenarioQuestions(ss);
    setCurrent(0);
    setSelected(null);
    setAnswers([]);
    setScreen("judgment");
  }

  function startPlanning(chId: string) {
    if (!requireAuth()) return;
    const ps = planningsByChapter(chId);
    if (ps.length === 0) return;
    setChapterId(chId);
    setActiveExercise("planning");
    setPlanningQuestions(ps);
    setCurrent(0);
    setPlanningPool(shuffleArray(ps[0].steps));
    setPlanningBuilt([]);
    setPlanningRevealed(false);
    setPlanningAnswers([]);
    setScreen("planning");
  }

  function startFillBlank(chId: string) {
    if (!requireAuth()) return;
    const fs = fillBlanksByChapter(chId);
    if (fs.length === 0) return;
    setChapterId(chId);
    setActiveExercise("fillblank");
    setFillBlankQuestions(fs);
    setCurrent(0);
    setSelected(null);
    setAnswers([]);
    setScreen("fillblank");
  }

  function startMatching(chId: string) {
    if (!requireAuth()) return;
    const ms = matchingsByChapter(chId);
    if (ms.length === 0) return;
    setChapterId(chId);
    setActiveExercise("matching");
    setMatchingQuestions(ms);
    setCurrent(0);
    setMatchingPool(shuffleArray(ms[0].items));
    setMatchingAssignments({});
    setMatchingSelectedItem(null);
    setMatchingRevealed(false);
    setMatchingAnswers([]);
    setScreen("matching");
  }

  function pickAnswer(index: number) {
    if (selected !== null) return; // đã chọn rồi, khóa lại
    setSelected(index);
  }

  function correctIndexAt(i: number): number | undefined {
    if (activeExercise === "quiz") return questions[i]?.correctIndex;
    if (activeExercise === "translation") return translationQuestions[i]?.correctIndex;
    if (activeExercise === "vocab") return vocabQuestions[i]?.correctIndex;
    if (activeExercise === "judgment") return scenarioQuestions[i]?.correctIndex;
    if (activeExercise === "fillblank") return fillBlankQuestions[i]?.correctIndex;
    return undefined;
  }

  function nextQuestion() {
    const nextAnswers = [...answers, selected];
    setAnswers(nextAnswers);
    setSelected(null);

    const total =
      activeExercise === "quiz"
        ? questions.length
        : activeExercise === "translation"
        ? translationQuestions.length
        : activeExercise === "judgment"
        ? scenarioQuestions.length
        : activeExercise === "fillblank"
        ? fillBlankQuestions.length
        : vocabQuestions.length;

    if (current + 1 < total) {
      setCurrent(current + 1);
    } else {
      const sc = nextAnswers.filter((a, i) => a === correctIndexAt(i)).length;
      if (chapterId && activeExercise) {
        saveBestScore(exerciseStorageKey(chapterId, activeExercise), sc, total);
        recordDacDinhAttempt(chapterId, activeExercise, sc, total);
      }
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
      if (chapterId) {
        saveBestScore(exerciseStorageKey(chapterId, "reorder"), sc, reorderQuestions.length);
        recordDacDinhAttempt(chapterId, "reorder", sc, reorderQuestions.length);
      }
      setBestScores(loadBestScores());
      setScreen("result");
    }
  }

  // Lập kế hoạch: bấm bước trong "pool" để thêm vào chuỗi đang ghép, bấm lại trong chuỗi để trả về pool.
  function pickPlanningStep(index: number) {
    if (planningRevealed) return;
    const step = planningPool[index];
    setPlanningPool((p) => p.filter((_, i) => i !== index));
    setPlanningBuilt((b) => [...b, step]);
  }

  function unpickPlanningStep(index: number) {
    if (planningRevealed) return;
    const step = planningBuilt[index];
    setPlanningBuilt((b) => b.filter((_, i) => i !== index));
    setPlanningPool((p) => [...p, step]);
  }

  function checkPlanning() {
    const pq = planningQuestions[current];
    const correct = JSON.stringify(planningBuilt.map((s) => s.ja)) === JSON.stringify(pq.steps.map((s) => s.ja));
    setPlanningRevealed(true);
    setPlanningAnswers((a) => [...a, correct]);
  }

  function nextPlanningQuestion() {
    const nextIdx = current + 1;
    if (nextIdx < planningQuestions.length) {
      setCurrent(nextIdx);
      setPlanningPool(shuffleArray(planningQuestions[nextIdx].steps));
      setPlanningBuilt([]);
      setPlanningRevealed(false);
    } else {
      const sc = planningAnswers.filter(Boolean).length;
      if (chapterId) {
        saveBestScore(exerciseStorageKey(chapterId, "planning"), sc, planningQuestions.length);
        recordDacDinhAttempt(chapterId, "planning", sc, planningQuestions.length);
      }
      setBestScores(loadBestScores());
      setScreen("result");
    }
  }

  // Phân loại: bấm 1 item trong pool để chọn (bấm lại để bỏ chọn), rồi bấm 1 target để gán item đã chọn
  // vào đó. Bấm 1 item ĐÃ gán (hiện trong target) để trả nó về lại pool.
  function pickMatchingItem(itemId: string) {
    if (matchingRevealed) return;
    setMatchingSelectedItem((cur) => (cur === itemId ? null : itemId));
  }

  function assignMatchingTarget(targetId: string) {
    if (matchingRevealed || !matchingSelectedItem) return;
    setMatchingAssignments((a) => ({ ...a, [matchingSelectedItem]: targetId }));
    setMatchingPool((p) => p.filter((it) => it.id !== matchingSelectedItem));
    setMatchingSelectedItem(null);
  }

  function unassignMatchingItem(itemId: string) {
    if (matchingRevealed) return;
    const mq = matchingQuestions[current];
    const item = mq?.items.find((it) => it.id === itemId);
    if (!item) return;
    setMatchingAssignments((a) => {
      const next = { ...a };
      delete next[itemId];
      return next;
    });
    setMatchingPool((p) => [...p, { id: item.id, ja: item.ja, vi: item.vi }]);
  }

  function checkMatching() {
    const mq = matchingQuestions[current];
    const allCorrect = mq.items.every((it) => matchingAssignments[it.id] === it.targetId);
    setMatchingRevealed(true);
    setMatchingAnswers((a) => [...a, allCorrect]);
  }

  function nextMatchingQuestion() {
    const nextIdx = current + 1;
    if (nextIdx < matchingQuestions.length) {
      setCurrent(nextIdx);
      setMatchingPool(shuffleArray(matchingQuestions[nextIdx].items));
      setMatchingAssignments({});
      setMatchingSelectedItem(null);
      setMatchingRevealed(false);
    } else {
      const sc = matchingAnswers.filter(Boolean).length;
      if (chapterId) {
        saveBestScore(exerciseStorageKey(chapterId, "matching"), sc, matchingQuestions.length);
        recordDacDinhAttempt(chapterId, "matching", sc, matchingQuestions.length);
      }
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
  function contentLengthFor(chId: string, exerciseId: ExerciseType): number {
    if (exerciseId === "quiz") return questionsByChapter(chId).length;
    if (exerciseId === "translation") return translationsByChapter(chId).length;
    if (exerciseId === "vocab") return vocabByChapter(chId).length;
    if (exerciseId === "reorder") return reordersByChapter(chId).length;
    if (exerciseId === "judgment") return scenariosByChapter(chId).length;
    if (exerciseId === "matching") return matchingsByChapter(chId).length;
    if (exerciseId === "fillblank") return fillBlanksByChapter(chId).length;
    return planningsByChapter(chId).length; // "planning"
  }

  // Dạng bài chỉ mở khóa khi dạng NGAY TRƯỚC ĐÓ CÓ NỘI DUNG đạt 100%. Nếu 1 chương không có nội dung
  // cho dạng liền trước (ví dụ chương chỉ có Lập kế hoạch mà không có Tình huống & Tính toán), bỏ qua
  // dạng rỗng đó và lùi tiếp về dạng có nội dung gần nhất — tránh khóa vĩnh viễn dạng bài phía sau.
  function isUnlocked(chId: string, exerciseId: ExerciseType): boolean {
    if (devUnlockAll) return true; // CHỈ DÙNG ĐỂ TEST
    let idx = EXERCISE_TYPES.findIndex((e) => e.id === exerciseId) - 1;
    while (idx >= 0) {
      const prevId = EXERCISE_TYPES[idx].id;
      if (contentLengthFor(chId, prevId) === 0) {
        idx -= 1;
        continue;
      }
      const prevBest = bestScores[exerciseStorageKey(chId, prevId)];
      return !!prevBest && prevBest.total > 0 && prevBest.score === prevBest.total;
    }
    return true;
  }

  // Nhãn dạng bài THẬT SỰ đang được yêu cầu hoàn thành 100% để mở khóa (bỏ qua các dạng rỗng ở giữa) —
  // dùng để hiển thị đúng thông báo khóa, tránh nhắc tên 1 dạng không có nội dung trong chương đó.
  function requiredPrevLabel(chId: string, exerciseId: ExerciseType): string | null {
    let idx = EXERCISE_TYPES.findIndex((e) => e.id === exerciseId) - 1;
    while (idx >= 0) {
      const prevId = EXERCISE_TYPES[idx].id;
      if (contentLengthFor(chId, prevId) === 0) {
        idx -= 1;
        continue;
      }
      return EXERCISE_TYPES[idx].label;
    }
    return null;
  }

  const part = PARTS.find((p) => p.id === partId);
  const chapter = CHAPTERS.find((c) => c.id === chapterId);
  const q = questions[current];
  const tq = translationQuestions[current];
  const vq = vocabQuestions[current];
  const rq = reorderQuestions[current];
  const sq = scenarioQuestions[current];
  const pq = planningQuestions[current];
  const fbq = fillBlankQuestions[current];
  const mq = matchingQuestions[current];
  const resultTotal =
    activeExercise === "quiz"
      ? questions.length
      : activeExercise === "translation"
      ? translationQuestions.length
      : activeExercise === "vocab"
      ? vocabQuestions.length
      : activeExercise === "judgment"
      ? scenarioQuestions.length
      : activeExercise === "planning"
      ? planningQuestions.length
      : activeExercise === "fillblank"
      ? fillBlankQuestions.length
      : activeExercise === "matching"
      ? matchingQuestions.length
      : reorderQuestions.length;
  const score =
    activeExercise === "reorder"
      ? reorderAnswers.filter(Boolean).length
      : activeExercise === "planning"
      ? planningAnswers.filter(Boolean).length
      : activeExercise === "matching"
      ? matchingAnswers.filter(Boolean).length
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
                const contentLength = contentLengthFor(chapter.id, ex.id);
                const hasContent = contentLength > 0;
                const unlocked = isUnlocked(chapter.id, ex.id);
                const available = unlocked && hasContent;

                let statusText = "Sắp có nội dung";
                if (!unlocked) {
                  const prevLabel = requiredPrevLabel(chapter.id, ex.id);
                  statusText = prevLabel ? `Khóa — cần đạt 100% "${prevLabel}" trước` : "Khóa";
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
                      else if (ex.id === "judgment") startJudgment(chapter.id);
                      else if (ex.id === "planning") startPlanning(chapter.id);
                      else if (ex.id === "fillblank") startFillBlank(chapter.id);
                      else if (ex.id === "matching") startMatching(chapter.id);
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

        {screen === "fillblank" && fbq && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-ink-600">
                {part?.emoji} {chapter?.titleVi} · ✏️ Điền từ vào chỗ trống
              </p>
              <div className="flex items-center gap-3 shrink-0">
                <p className="text-sm text-ink-500">
                  Câu {current + 1}/{fillBlankQuestions.length}
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
                style={{ width: `${((current + 1) / fillBlankQuestions.length) * 100}%` }}
              />
            </div>

            <div className="bg-white border border-ink-200/70 rounded-md shadow-card p-5 md:p-6">
              <p className="text-xs font-semibold text-primary-dark mb-2">🇯🇵 Điền từ đúng vào chỗ trống</p>
              <p className="text-lg font-bold text-ink-900 leading-relaxed">
                {fbq.sentenceJa.split("＿＿＿").map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <span className="inline-block mx-1 px-2 border-b-2 border-primary text-primary-dark">
                        ＿＿＿
                      </span>
                    )}
                  </span>
                ))}
              </p>
              <p className="text-sm text-ink-500 mt-1 mb-5">{fbq.sentenceVi}</p>

              <div className="space-y-2.5">
                {fbq.options.map((opt, i) => {
                  const isCorrect = i === fbq.correctIndex;
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
                    {selected === fbq.correctIndex ? "✅ Chính xác!" : "❌ Chưa đúng — đáp án đúng là:"}
                  </p>
                  {selected !== fbq.correctIndex && (
                    <p className="text-sm font-semibold text-primary-dark mb-2">{fbq.options[fbq.correctIndex]}</p>
                  )}
                  <p className="text-sm text-ink-600 leading-relaxed">{fbq.explanationVi}</p>
                  <div className="mt-3 pt-3 border-t border-ink-200/50">
                    <p className="text-xs text-ink-500 leading-relaxed">
                      📖 Câu đầy đủ — {chapter && SOURCE_DOC_BY_PART[chapter.partId]}, trang {fbq.sourcePage}:
                      「{fbq.sourceQuoteJa}」
                    </p>
                  </div>
                  <button
                    onClick={nextQuestion}
                    className="mt-4 bg-primary hover:bg-primary-dark active:scale-[0.97] text-white font-bold px-5 py-2.5 rounded-md shadow-soft hover:shadow-card transition duration-150 ease-warm"
                  >
                    {current + 1 < fillBlankQuestions.length ? "Câu tiếp theo →" : "Xem kết quả"}
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

        {screen === "matching" && mq && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-ink-600">
                {part?.emoji} {chapter?.titleVi} · 🧷 Phân loại
              </p>
              <div className="flex items-center gap-3 shrink-0">
                <p className="text-sm text-ink-500">
                  Câu {current + 1}/{matchingQuestions.length}
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
                style={{ width: `${((current + 1) / matchingQuestions.length) * 100}%` }}
              />
            </div>

            <div className="bg-white border border-ink-200/70 rounded-md shadow-card p-5 md:p-6">
              <p className="text-sm font-bold text-ink-900 leading-relaxed">{mq.instructionJa}</p>
              <p className="text-xs text-ink-500 mt-1 mb-4">{mq.instructionVi}</p>

              {!matchingRevealed && (
                <p className="text-xs font-semibold text-primary-dark mb-3">
                  {matchingSelectedItem
                    ? "Đã chọn — bấm vào 1 nhóm bên dưới để gán"
                    : "Bấm chọn 1 mục bên dưới, rồi bấm vào nhóm đúng"}
                </p>
              )}

              {/* Các nhóm/đích — bấm để gán mục đang chọn vào đây */}
              <div className="space-y-2.5 mb-4">
                {mq.targets.map((t) => {
                  const assignedItems = mq.items.filter((it) => matchingAssignments[it.id] === t.id);
                  return (
                    <div
                      key={t.id}
                      onClick={() => assignMatchingTarget(t.id)}
                      className={`border-2 rounded-md p-3 transition duration-150 ease-warm ${
                        !matchingRevealed && matchingSelectedItem
                          ? "border-dashed border-primary bg-primary-100/20 cursor-pointer hover:bg-primary-100/40"
                          : "border-dashed border-ink-200 bg-cream-50"
                      }`}
                    >
                      <p className="text-sm font-bold text-ink-900">{t.labelJa}</p>
                      <p className="text-xs text-ink-500 mb-2">{t.labelVi}</p>
                      <div className="flex flex-wrap gap-2">
                        {assignedItems.length === 0 && (
                          <p className="text-xs text-ink-400 italic">Chưa có mục nào</p>
                        )}
                        {assignedItems.map((it) => {
                          const isCorrect = it.targetId === t.id;
                          let chipStyle = "bg-primary-100 border-primary text-primary-dark";
                          if (matchingRevealed) {
                            chipStyle = isCorrect
                              ? "bg-primary-100 border-primary text-primary-dark"
                              : "bg-red-50 border-red-300 text-red-700";
                          }
                          return (
                            <button
                              key={it.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                unassignMatchingItem(it.id);
                              }}
                              disabled={matchingRevealed}
                              className={`border font-semibold text-sm px-3 py-1.5 rounded-md transition duration-150 ease-warm ${chipStyle}`}
                            >
                              {matchingRevealed && (isCorrect ? "✅ " : "❌ ")}
                              {it.ja}
                              <span className="block text-xs font-normal opacity-80">{it.vi}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pool các mục chưa gán */}
              {matchingPool.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {matchingPool.map((it) => (
                    <button
                      key={it.id}
                      onClick={() => pickMatchingItem(it.id)}
                      className={`text-left border font-semibold text-sm px-3 py-1.5 rounded-md transition duration-150 ease-warm ${
                        matchingSelectedItem === it.id
                          ? "bg-primary text-white border-primary"
                          : "bg-white border-ink-200/70 text-ink-900 hover:border-primary hover:bg-primary-100/20"
                      }`}
                    >
                      {it.ja}
                      <span className="block text-xs font-normal opacity-80">{it.vi}</span>
                    </button>
                  ))}
                </div>
              )}

              {!matchingRevealed && (
                <button
                  onClick={checkMatching}
                  disabled={matchingPool.length > 0}
                  className="bg-primary hover:bg-primary-dark active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-5 py-2.5 rounded-md shadow-soft hover:shadow-card transition duration-150 ease-warm"
                >
                  Kiểm tra
                </button>
              )}

              {matchingRevealed && (
                <div className="mt-2 bg-cream-50 border border-ink-200/50 rounded-md p-4 animate-fade-in">
                  <p className="font-bold text-sm mb-2">
                    {mq.items.every((it) => matchingAssignments[it.id] === it.targetId)
                      ? "✅ Chính xác toàn bộ!"
                      : "❌ Có mục chưa đúng nhóm — xem đáp án đúng bên trên"}
                  </p>
                  <p className="text-sm text-ink-600 leading-relaxed mb-3">{mq.explanationVi}</p>
                  <div className="space-y-1.5 border-t border-ink-200/50 pt-2">
                    {mq.items.map((it) => (
                      <p key={it.id} className="text-xs text-ink-500 leading-relaxed">
                        📖 <span className="font-semibold text-ink-700">{it.ja}</span> —{" "}
                        {chapter && SOURCE_DOC_BY_PART[chapter.partId]}, trang {it.sourcePage}: 「{it.sourceQuoteJa}」
                      </p>
                    ))}
                  </div>
                  <button
                    onClick={nextMatchingQuestion}
                    className="mt-4 bg-primary hover:bg-primary-dark active:scale-[0.97] text-white font-bold px-5 py-2.5 rounded-md shadow-soft hover:shadow-card transition duration-150 ease-warm"
                  >
                    {current + 1 < matchingQuestions.length ? "Câu tiếp theo →" : "Xem kết quả"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {screen === "judgment" && sq && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-ink-600">
                {part?.emoji} {chapter?.titleVi} · {sq.kind === "calculation" ? "🧮 Tính toán" : "🎯 Phán đoán tình huống"}
              </p>
              <div className="flex items-center gap-3 shrink-0">
                <p className="text-sm text-ink-500">
                  Câu {current + 1}/{scenarioQuestions.length}
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
                style={{ width: `${((current + 1) / scenarioQuestions.length) * 100}%` }}
              />
            </div>

            <div className="bg-white border border-ink-200/70 rounded-md shadow-card p-5 md:p-6">
              <div className="bg-amber-50 border border-amber-200/70 rounded-md p-3 mb-4">
                <p className="text-xs font-bold text-amber-700 mb-1">🎭 Tình huống mô phỏng</p>
                <p className="text-sm text-ink-800 leading-relaxed">{sq.scenarioJa}</p>
                <p className="text-xs text-ink-500 mt-1">{sq.scenarioVi}</p>
              </div>

              <p className="text-lg font-bold text-ink-900 leading-relaxed">{sq.questionJa}</p>
              <p className="text-sm text-ink-500 mt-1 mb-5">{sq.questionVi}</p>

              <div className="space-y-2.5">
                {sq.options.map((opt, i) => {
                  const isCorrect = i === sq.correctIndex;
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
                    {selected === sq.correctIndex ? "✅ Chính xác!" : "❌ Chưa đúng — đáp án đúng là:"}
                  </p>
                  {selected !== sq.correctIndex && (
                    <p className="text-sm font-semibold text-primary-dark mb-2">
                      {sq.options[sq.correctIndex].vi}
                    </p>
                  )}
                  <p className="text-sm text-ink-600 leading-relaxed">{sq.explanationVi}</p>
                  <div className="mt-3 pt-3 border-t border-ink-200/50">
                    <p className="text-xs text-ink-500 leading-relaxed">
                      📖 Căn cứ quy tắc OTAFF — {chapter && SOURCE_DOC_BY_PART[chapter.partId]}, trang {sq.sourcePage}:
                      「{sq.sourceQuoteJa}」
                    </p>
                  </div>
                  <button
                    onClick={nextQuestion}
                    className="mt-4 bg-primary hover:bg-primary-dark active:scale-[0.97] text-white font-bold px-5 py-2.5 rounded-md shadow-soft hover:shadow-card transition duration-150 ease-warm"
                  >
                    {current + 1 < scenarioQuestions.length ? "Câu tiếp theo →" : "Xem kết quả"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {screen === "planning" && pq && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-ink-600">
                {part?.emoji} {chapter?.titleVi} · 📋 Lập kế hoạch
              </p>
              <div className="flex items-center gap-3 shrink-0">
                <p className="text-sm text-ink-500">
                  Câu {current + 1}/{planningQuestions.length}
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
                style={{ width: `${((current + 1) / planningQuestions.length) * 100}%` }}
              />
            </div>

            <div className="bg-white border border-ink-200/70 rounded-md shadow-card p-5 md:p-6">
              <div className="bg-amber-50 border border-amber-200/70 rounded-md p-3 mb-4">
                <p className="text-xs font-bold text-amber-700 mb-1">🎭 Tình huống mô phỏng</p>
                <p className="text-sm text-ink-800 leading-relaxed">{pq.scenarioJa}</p>
                <p className="text-xs text-ink-500 mt-1">{pq.scenarioVi}</p>
              </div>

              <p className="text-xs font-semibold text-primary-dark mb-3">
                Bấm các bước bên dưới theo đúng thứ tự thực hiện
              </p>

              <div className="min-h-[3.5rem] border-2 border-dashed border-ink-200 rounded-md p-3 flex flex-col gap-2 mb-4 bg-cream-50">
                {planningBuilt.length === 0 && (
                  <p className="text-sm text-ink-400">Bấm bước bên dưới để bắt đầu sắp xếp...</p>
                )}
                {planningBuilt.map((step, i) => (
                  <button
                    key={i}
                    onClick={() => unpickPlanningStep(i)}
                    disabled={planningRevealed}
                    className="text-left bg-primary-100 border border-primary text-primary-dark font-semibold text-sm px-3 py-2 rounded-md hover:bg-primary-100/60 transition duration-150 ease-warm"
                  >
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-xs font-bold mr-2">
                      {i + 1}
                    </span>
                    {step.ja}
                    <span className="block text-xs font-normal text-primary-dark/70 ml-7">{step.vi}</span>
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-2 mb-4">
                {planningPool.map((step, i) => (
                  <button
                    key={i}
                    onClick={() => pickPlanningStep(i)}
                    className="text-left bg-white border border-ink-200/70 text-ink-900 font-semibold text-sm px-3 py-2 rounded-md hover:border-primary hover:bg-primary-100/20 transition duration-150 ease-warm"
                  >
                    {step.ja}
                    <span className="block text-xs font-normal text-ink-500">{step.vi}</span>
                  </button>
                ))}
              </div>

              {!planningRevealed && (
                <button
                  onClick={checkPlanning}
                  disabled={planningPool.length > 0}
                  className="bg-primary hover:bg-primary-dark active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-5 py-2.5 rounded-md shadow-soft hover:shadow-card transition duration-150 ease-warm"
                >
                  Kiểm tra
                </button>
              )}

              {planningRevealed && (
                <div className="mt-2 bg-cream-50 border border-ink-200/50 rounded-md p-4 animate-fade-in">
                  <p className="font-bold text-sm mb-2">
                    {JSON.stringify(planningBuilt.map((s) => s.ja)) === JSON.stringify(pq.steps.map((s) => s.ja))
                      ? "✅ Chính xác!"
                      : "❌ Chưa đúng thứ tự"}
                  </p>
                  <div className="space-y-1 mb-3">
                    {pq.steps.map((s, i) => (
                      <p key={i} className="text-sm text-ink-900">
                        <span className="font-bold">{i + 1}.</span> {s.ja}{" "}
                        <span className="text-ink-500">— {s.vi}</span>
                      </p>
                    ))}
                  </div>
                  <p className="text-xs text-ink-500 leading-relaxed border-t border-ink-200/50 pt-2">
                    📖 Căn cứ quy tắc OTAFF — {chapter && SOURCE_DOC_BY_PART[chapter.partId]}, trang {pq.sourcePage}:
                    「{pq.sourceQuoteJa}」
                  </p>
                  <button
                    onClick={nextPlanningQuestion}
                    className="mt-4 bg-primary hover:bg-primary-dark active:scale-[0.97] text-white font-bold px-5 py-2.5 rounded-md shadow-soft hover:shadow-card transition duration-150 ease-warm"
                  >
                    {current + 1 < planningQuestions.length ? "Câu tiếp theo →" : "Xem kết quả"}
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

              {activeExercise === "judgment" &&
                scenarioQuestions.map((sqq, i) => {
                  const userAnswer = answers[i];
                  const correct = userAnswer === sqq.correctIndex;
                  return (
                    <div
                      key={sqq.id}
                      className={`bg-white border rounded-md p-4 ${correct ? "border-ink-200/70" : "border-red-200"}`}
                    >
                      <p className="text-xs text-ink-400 mb-1">{sqq.kind === "calculation" ? "🧮 Tính toán" : "🎯 Phán đoán"}</p>
                      <p className="text-xs text-ink-500 italic mb-1">{sqq.scenarioVi}</p>
                      <p className="text-sm font-semibold text-ink-900">
                        {correct ? "✅" : "❌"} {sqq.questionJa}
                      </p>
                      <p className="text-xs text-ink-500 mb-2">{sqq.questionVi}</p>
                      {!correct && userAnswer !== null && userAnswer !== undefined && (
                        <p className="text-xs text-red-600 mb-1">Bạn chọn: {sqq.options[userAnswer].vi}</p>
                      )}
                      <p className="text-xs text-primary-dark font-semibold mb-1">
                        Đáp án đúng: {sqq.options[sqq.correctIndex].vi}
                      </p>
                      <p className="text-xs text-ink-600 leading-relaxed mb-2">{sqq.explanationVi}</p>
                      <p className="text-xs text-ink-400 leading-relaxed border-t border-ink-200/50 pt-2">
                        📖 Căn cứ quy tắc OTAFF — {part && SOURCE_DOC_BY_PART[part.id]}, trang {sqq.sourcePage}:
                        「{sqq.sourceQuoteJa}」
                      </p>
                    </div>
                  );
                })}

              {activeExercise === "planning" &&
                planningQuestions.map((pqq, i) => {
                  const correct = planningAnswers[i];
                  return (
                    <div
                      key={pqq.id}
                      className={`bg-white border rounded-md p-4 ${correct ? "border-ink-200/70" : "border-red-200"}`}
                    >
                      <p className="text-xs text-ink-400 mb-1">📋 Lập kế hoạch</p>
                      <p className="text-xs text-ink-500 italic mb-2">{pqq.scenarioVi}</p>
                      <p className="text-sm font-semibold text-ink-900 mb-1">{correct ? "✅ Đúng thứ tự" : "❌ Sai thứ tự"}</p>
                      <div className="space-y-0.5 mb-2">
                        {pqq.steps.map((s, si) => (
                          <p key={si} className="text-xs text-ink-600">
                            <span className="font-semibold">{si + 1}.</span> {s.ja} — {s.vi}
                          </p>
                        ))}
                      </div>
                      <p className="text-xs text-ink-400 leading-relaxed border-t border-ink-200/50 pt-2">
                        📖 Căn cứ quy tắc OTAFF — {part && SOURCE_DOC_BY_PART[part.id]}, trang {pqq.sourcePage}:
                        「{pqq.sourceQuoteJa}」
                      </p>
                    </div>
                  );
                })}

              {activeExercise === "fillblank" &&
                fillBlankQuestions.map((fqq, i) => {
                  const userAnswer = answers[i];
                  const correct = userAnswer === fqq.correctIndex;
                  return (
                    <div
                      key={fqq.id}
                      className={`bg-white border rounded-md p-4 ${correct ? "border-ink-200/70" : "border-red-200"}`}
                    >
                      <p className="text-sm font-semibold text-ink-900">
                        {correct ? "✅" : "❌"} {fqq.sentenceJa}
                      </p>
                      <p className="text-xs text-ink-500 mb-2">{fqq.sentenceVi}</p>
                      {!correct && userAnswer !== null && userAnswer !== undefined && (
                        <p className="text-xs text-red-600 mb-1">Bạn chọn: {fqq.options[userAnswer]}</p>
                      )}
                      <p className="text-xs text-primary-dark font-semibold mb-1">
                        Đáp án đúng: {fqq.options[fqq.correctIndex]}
                      </p>
                      <p className="text-xs text-ink-600 leading-relaxed mb-2">{fqq.explanationVi}</p>
                      <p className="text-xs text-ink-400 leading-relaxed border-t border-ink-200/50 pt-2">
                        📖 Câu đầy đủ — {part && SOURCE_DOC_BY_PART[part.id]}, trang {fqq.sourcePage}:
                        「{fqq.sourceQuoteJa}」
                      </p>
                    </div>
                  );
                })}

              {activeExercise === "matching" &&
                matchingQuestions.map((mqq, i) => {
                  const correct = matchingAnswers[i];
                  return (
                    <div
                      key={mqq.id}
                      className={`bg-white border rounded-md p-4 ${correct ? "border-ink-200/70" : "border-red-200"}`}
                    >
                      <p className="text-xs text-ink-400 mb-1">🧷 Phân loại</p>
                      <p className="text-xs text-ink-500 italic mb-2">{mqq.instructionVi}</p>
                      <p className="text-sm font-semibold text-ink-900 mb-2">
                        {correct ? "✅ Đúng toàn bộ" : "❌ Có mục chưa đúng nhóm"}
                      </p>
                      <div className="space-y-0.5 mb-2">
                        {mqq.items.map((it) => {
                          const t = mqq.targets.find((tg) => tg.id === it.targetId);
                          return (
                            <p key={it.id} className="text-xs text-ink-600">
                              <span className="font-semibold">{it.ja}</span> ({it.vi}) → {t?.labelVi}
                            </p>
                          );
                        })}
                      </div>
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
                  else if (activeExercise === "judgment") startJudgment(chapterId);
                  else if (activeExercise === "planning") startPlanning(chapterId);
                  else if (activeExercise === "fillblank") startFillBlank(chapterId);
                  else if (activeExercise === "matching") startMatching(chapterId);
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
