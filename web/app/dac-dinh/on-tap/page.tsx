import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PARTS, chaptersByPart, questionsByChapter } from "../data";

// Trang liệt kê — server-rendered tĩnh, không cần đăng nhập/JS, để Google/AI
// đọc được danh sách chương (xem on-tap/[chapterId]/page.tsx cho nội dung đầy đủ).
export const metadata: Metadata = {
  title: "Ôn tập Đặc định kỹ năng số 2 ngành nhà hàng — Toàn bộ câu hỏi & đáp án",
  description:
    "Tổng hợp đầy đủ câu hỏi, đáp án, giải thích cho kỳ thi Đặc định kỹ năng số 2 (外食業特定技能２号) ngành nhà hàng Nhật Bản — song ngữ Nhật-Việt, trích dẫn tài liệu OTAFF chính thức.",
  alternates: { canonical: "https://traotay.com.vn/dac-dinh/on-tap/" },
};

export default function OnTapIndexPage() {
  return (
    <>
      <Header />
      <section className="bg-gradient-warm border-b border-ink-200/50">
        <div className="max-w-3xl mx-auto px-4 py-7 md:py-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-ink-900 tracking-tight">
            Ôn tập Đặc định kỹ năng số 2 — Toàn bộ câu hỏi & đáp án
          </h1>
          <p className="text-ink-600 text-sm mt-1">
            外食業特定技能２号技能測定試験 — song ngữ Nhật-Việt, theo đúng tài liệu học tập chính thức OTAFF.
            Đọc miễn phí, không cần đăng nhập.{" "}
            <Link href="/dac-dinh/" className="text-primary-dark font-semibold underline">
              Luyện tập có tính điểm →
            </Link>
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        {PARTS.map((part) => {
          const chapters = chaptersByPart(part.id);
          return (
            <div key={part.id}>
              <h2 className="text-lg font-extrabold text-ink-900 mb-1">
                {part.emoji} {part.titleVi}
              </h2>
              <p className="text-sm text-ink-500 mb-3">{part.titleJa}</p>
              <div className="space-y-2">
                {chapters.map((c) => {
                  const count = questionsByChapter(c.id).length;
                  return (
                    <Link
                      key={c.id}
                      href={`/dac-dinh/on-tap/${c.id}/`}
                      className="block bg-white border border-ink-200/70 hover:border-primary rounded-md shadow-soft hover:shadow-card transition duration-150 ease-warm p-4"
                    >
                      <p className="font-semibold text-ink-900 text-sm">
                        Chương {c.order} — {c.titleVi}
                      </p>
                      <p className="text-xs text-ink-500">{c.titleJa}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>
      <Footer />
    </>
  );
}
