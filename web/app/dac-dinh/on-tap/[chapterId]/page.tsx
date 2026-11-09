import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  PARTS,
  CHAPTERS,
  SOURCE_DOC_BY_PART,
  questionsByChapter,
  translationsByChapter,
  vocabByChapter,
  reordersByChapter,
  scenariosByChapter,
  planningsByChapter,
  matchingsByChapter,
  fillBlanksByChapter,
} from "../../data";

// Trang MỚI, server-rendered tĩnh (SSG qua generateStaticParams) — hiện ĐẦY ĐỦ
// câu hỏi + đáp án đúng ngay (khác app luyện tập /dac-dinh/ bắt làm bài trước
// mới lộ đáp án) để Google/AI đọc + trích dẫn được, không cần đăng nhập/chạy JS.
// Quyết định 2026-11-09: chấp nhận đánh đổi lộ đáp án để đổi lấy hiệu quả AEO —
// không đụng gì tới app luyện tập tương tác hiện có ở page.tsx (file khác).

export async function generateStaticParams() {
  return CHAPTERS.map((c) => ({ chapterId: c.id }));
}

export async function generateMetadata({
  params,
}: {
  params: { chapterId: string };
}): Promise<Metadata> {
  const chapter = CHAPTERS.find((c) => c.id === params.chapterId);
  if (!chapter) return { title: "Không tìm thấy chương" };
  const totalQuestions = questionsByChapter(chapter.id).length;
  const title = `Chương ${chapter.order}: ${chapter.titleVi} — Ôn thi Đặc định số 2`;
  const desc = `Câu hỏi + đáp án song ngữ Nhật-Việt, chương "${chapter.titleVi}" (${chapter.titleJa}) — kỳ thi Đặc định kỹ năng số 2 ngành nhà hàng, theo tài liệu OTAFF chính thức.`;
  return {
    title,
    description: desc,
    alternates: { canonical: `https://traotay.com.vn/dac-dinh/on-tap/${chapter.id}/` },
    openGraph: { title, description: desc, type: "article", locale: "vi_VN", siteName: "Trao Tay" },
  };
}

export default function OnTapChapterPage({ params }: { params: { chapterId: string } }) {
  const chapter = CHAPTERS.find((c) => c.id === params.chapterId);
  if (!chapter) notFound();
  const part = PARTS.find((p) => p.id === chapter.partId);
  const sourceDoc = SOURCE_DOC_BY_PART[chapter.partId];

  const quiz = questionsByChapter(chapter.id);
  const vocab = vocabByChapter(chapter.id);
  const fillblank = fillBlanksByChapter(chapter.id);
  const translation = translationsByChapter(chapter.id);
  const reorder = reordersByChapter(chapter.id);
  const scenario = scenariosByChapter(chapter.id);
  const planning = planningsByChapter(chapter.id);
  const matching = matchingsByChapter(chapter.id);

  // FAQPage schema — chỉ gom các dạng hỏi-đáp 1 câu hỏi/1 đáp án rõ ràng (quiz,
  // vocab, fillblank, translation) vì khớp đúng mô hình Question/acceptedAnswer;
  // các dạng ghép-chuỗi (reorder/planning/matching) không khớp cấu trúc này.
  const faqEntities = [
    ...quiz.map((q) => ({
      "@type": "Question",
      name: q.questionJa,
      acceptedAnswer: { "@type": "Answer", text: `${q.questionVi}\n\nĐáp án: ${q.options[q.correctIndex].vi}. ${q.explanationVi}` },
    })),
    ...vocab.map((v) => ({
      "@type": "Question",
      name: v.term,
      acceptedAnswer: { "@type": "Answer", text: v.options[v.correctIndex] },
    })),
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqEntities,
  };

  return (
    <>
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="bg-gradient-warm border-b border-ink-200/50">
        <div className="max-w-3xl mx-auto px-4 py-7 md:py-8">
          <nav className="text-xs text-ink-500 mb-2 flex items-center gap-1.5 flex-wrap">
            <Link href="/dac-dinh/on-tap/" className="hover:text-primary">Ôn tập Đặc định số 2</Link>
            <span>/</span>
            <span>{part?.titleVi}</span>
          </nav>
          <h1 className="text-xl md:text-2xl font-extrabold text-ink-900 tracking-tight">
            Chương {chapter.order}: {chapter.titleVi}
          </h1>
          <p className="text-ink-600 text-sm mt-1">{chapter.titleJa}</p>
          <Link
            href="/dac-dinh/"
            className="inline-block mt-3 bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-2 rounded-md shadow-soft transition duration-150 ease-warm"
          >
            Luyện tập có tính điểm →
          </Link>
        </div>
      </section>

      <article className="max-w-3xl mx-auto px-4 py-6 space-y-10">
        {quiz.length > 0 && (
          <section>
            <h2 className="text-lg font-extrabold text-ink-900 mb-3">📝 Trắc nghiệm kiến thức</h2>
            <div className="space-y-4">
              {quiz.map((q, i) => (
                <div key={q.id} className="bg-white border border-ink-200/70 rounded-md shadow-soft p-4">
                  <p className="font-bold text-ink-900">{i + 1}. {q.questionJa}</p>
                  <p className="text-sm text-ink-500 mb-2">{q.questionVi}</p>
                  <ul className="text-sm space-y-1 mb-2">
                    {q.options.map((opt, oi) => (
                      <li key={oi} className={oi === q.correctIndex ? "font-semibold text-primary-dark" : "text-ink-700"}>
                        {oi === q.correctIndex ? "✅ " : "— "}{opt.ja} ({opt.vi})
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm text-ink-600">{q.explanationVi}</p>
                  <p className="text-xs text-ink-400 mt-2">📖 {sourceDoc}, trang {q.sourcePage}: 「{q.sourceQuoteJa}」</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {vocab.length > 0 && (
          <section>
            <h2 className="text-lg font-extrabold text-ink-900 mb-3">🔤 Từ vựng</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {vocab.map((v) => (
                <div key={v.id} className="bg-white border border-ink-200/70 rounded-md shadow-soft p-3">
                  <p className="font-semibold text-ink-900 text-sm">{v.term}</p>
                  <p className="text-sm text-primary-dark font-medium">{v.options[v.correctIndex]}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {fillblank.length > 0 && (
          <section>
            <h2 className="text-lg font-extrabold text-ink-900 mb-3">✏️ Điền từ vào chỗ trống</h2>
            <div className="space-y-4">
              {fillblank.map((f, i) => (
                <div key={f.id} className="bg-white border border-ink-200/70 rounded-md shadow-soft p-4">
                  <p className="font-bold text-ink-900">{i + 1}. {f.sentenceJa}</p>
                  <p className="text-sm text-ink-500 mb-2">{f.sentenceVi}</p>
                  <p className="text-sm font-semibold text-primary-dark mb-1">Đáp án: {f.options[f.correctIndex]}</p>
                  <p className="text-sm text-ink-600">{f.explanationVi}</p>
                  <p className="text-xs text-ink-400 mt-2">📖 {sourceDoc}, trang {f.sourcePage}: 「{f.sourceQuoteJa}」</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {translation.length > 0 && (
          <section>
            <h2 className="text-lg font-extrabold text-ink-900 mb-3">🔄 Dịch câu</h2>
            <div className="space-y-4">
              {translation.map((t, i) => (
                <div key={t.id} className="bg-white border border-ink-200/70 rounded-md shadow-soft p-4">
                  <p className="font-bold text-ink-900">{i + 1}. {t.prompt}</p>
                  <p className="text-sm font-semibold text-primary-dark mt-1">Đáp án: {t.options[t.correctIndex]}</p>
                  <p className="text-xs text-ink-400 mt-2">📖 {sourceDoc}, trang {t.sourcePage}: 「{t.sourceQuoteJa}」</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {reorder.length > 0 && (
          <section>
            <h2 className="text-lg font-extrabold text-ink-900 mb-3">🧩 Sắp xếp câu</h2>
            <div className="space-y-4">
              {reorder.map((r, i) => (
                <div key={r.id} className="bg-white border border-ink-200/70 rounded-md shadow-soft p-4">
                  <p className="font-bold text-ink-900">{i + 1}. {r.chunks.join("")}</p>
                  <p className="text-sm text-ink-600">{r.meaningVi}</p>
                  <p className="text-xs text-ink-400 mt-2">📖 {sourceDoc}, trang {r.sourcePage}: 「{r.sourceQuoteJa}」</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {scenario.length > 0 && (
          <section>
            <h2 className="text-lg font-extrabold text-ink-900 mb-3">🎯 Tình huống & Tính toán</h2>
            <div className="space-y-4">
              {scenario.map((s, i) => (
                <div key={s.id} className="bg-white border border-ink-200/70 rounded-md shadow-soft p-4">
                  <p className="text-sm text-ink-500 italic mb-1">{s.scenarioVi}</p>
                  <p className="font-bold text-ink-900">{i + 1}. {s.questionJa}</p>
                  <p className="text-sm text-ink-500 mb-2">{s.questionVi}</p>
                  <p className="text-sm font-semibold text-primary-dark mb-1">
                    Đáp án: {s.options[s.correctIndex].ja} ({s.options[s.correctIndex].vi})
                  </p>
                  <p className="text-sm text-ink-600">{s.explanationVi}</p>
                  <p className="text-xs text-ink-400 mt-2">📖 {sourceDoc}, trang {s.sourcePage}: 「{s.sourceQuoteJa}」</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {planning.length > 0 && (
          <section>
            <h2 className="text-lg font-extrabold text-ink-900 mb-3">📋 Lập kế hoạch</h2>
            <div className="space-y-4">
              {planning.map((p, i) => (
                <div key={p.id} className="bg-white border border-ink-200/70 rounded-md shadow-soft p-4">
                  <p className="text-sm text-ink-500 italic mb-2">{p.scenarioVi}</p>
                  <p className="font-semibold text-ink-900 text-sm mb-1">{i + 1}. Quy trình đúng:</p>
                  <ol className="text-sm list-decimal list-inside space-y-0.5 text-ink-700">
                    {p.steps.map((st, si) => (
                      <li key={si}>{st.ja} — {st.vi}</li>
                    ))}
                  </ol>
                  <p className="text-xs text-ink-400 mt-2">📖 {sourceDoc}, trang {p.sourcePage}: 「{p.sourceQuoteJa}」</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {matching.length > 0 && (
          <section>
            <h2 className="text-lg font-extrabold text-ink-900 mb-3">🧷 Phân loại</h2>
            <div className="space-y-4">
              {matching.map((m, i) => (
                <div key={m.id} className="bg-white border border-ink-200/70 rounded-md shadow-soft p-4">
                  <p className="font-semibold text-ink-900 text-sm mb-2">{i + 1}. {m.instructionVi}</p>
                  <ul className="text-sm space-y-1 text-ink-700">
                    {m.items.map((it) => {
                      const target = m.targets.find((t) => t.id === it.targetId);
                      return (
                        <li key={it.id}>
                          {it.ja} ({it.vi}) → <span className="font-semibold text-primary-dark">{target?.labelVi}</span>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="text-sm text-ink-600 mt-2">{m.explanationVi}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="text-center pt-4">
          <Link
            href="/dac-dinh/"
            className="inline-block bg-primary hover:bg-primary-dark text-white font-bold px-6 py-3 rounded-md shadow-soft hover:shadow-card transition duration-150 ease-warm"
          >
            Luyện tập chương này có tính điểm →
          </Link>
        </div>
      </article>
      <Footer />
    </>
  );
}
