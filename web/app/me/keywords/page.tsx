"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/components/AuthProvider";
import {
  fetchKeywordAlerts,
  subscribeKeyword,
  unsubscribeKeyword,
} from "@/lib/auth";

export default function KeywordAlertsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [keywords, setKeywords] = useState<string[] | null>(null);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login/?next=/me/keywords/");
      return;
    }
    fetchKeywordAlerts().then((data) => setKeywords(data));
  }, [user, authLoading, router]);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    const kw = input.trim().toLowerCase();
    if (kw.length < 2) return setErr("Từ khóa tối thiểu 2 ký tự");
    if (kw.length > 50) return setErr("Tối đa 50 ký tự");
    if (keywords?.includes(kw)) return setErr("Đã có từ khóa này");
    if ((keywords?.length ?? 0) >= 20) return setErr("Tối đa 20 từ khóa");
    setPending(true);
    setErr(null);
    const ok = await subscribeKeyword(kw);
    setPending(false);
    if (!ok) {
      setErr("Thêm thất bại — thử lại");
      return;
    }
    setKeywords((prev) => [...(prev ?? []), kw]);
    setInput("");
  }

  async function onRemove(kw: string) {
    if (!confirm(`Xóa cảnh báo "${kw}"?`)) return;
    const ok = await unsubscribeKeyword(kw);
    if (ok) {
      setKeywords((prev) => prev?.filter((k) => k !== kw) ?? null);
    }
  }

  if (authLoading || !user) {
    return (
      <>
        <Header />
        <div className="text-center py-20 text-gray-500">Đang tải...</div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <section className="bg-gradient-to-br from-primary-light to-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-7">
          <Link href="/me/" className="text-sm text-gray-500 hover:text-primary mb-2 inline-block">
            ← Quay lại Hồ sơ
          </Link>
          <h1 className="text-2xl md:text-3xl font-extrabold text-navy">🔔 Cảnh báo từ khóa</h1>
          <p className="text-gray-600 text-sm mt-1">
            Bạn sẽ nhận thông báo khi có bài mới chứa các từ khóa bạn quan tâm
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-6">
        <form onSubmit={onAdd} className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
          <label className="block text-sm font-semibold text-navy mb-2">
            Thêm từ khóa mới
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 50))}
              placeholder="VD: iPhone 14, tủ lạnh Toshiba, xe đạp..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={pending || !input.trim()}
              className="bg-primary hover:bg-primary-dark text-white font-bold px-5 rounded-lg disabled:opacity-60"
            >
              {pending ? "..." : "Thêm"}
            </button>
          </div>
          {err && <p className="text-sm text-red-600 mt-2">⚠ {err}</p>}
          <p className="text-xs text-gray-500 mt-2">
            Tối đa 20 từ khóa · 2-50 ký tự mỗi từ khóa
          </p>
        </form>

        {keywords == null ? (
          <div className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse h-32" />
        ) : keywords.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
            <div className="text-5xl mb-3">🔕</div>
            <p className="font-semibold text-navy mb-1">Chưa có từ khóa nào</p>
            <p className="text-gray-500 text-sm">
              Thêm từ khóa ở trên để được thông báo khi có bài đăng mới phù hợp
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-navy mb-3">
              {keywords.length} từ khóa đang theo dõi
            </h3>
            <div className="flex gap-2 flex-wrap">
              {keywords.map((kw) => (
                <div
                  key={kw}
                  className="flex items-center gap-1.5 bg-primary-light text-primary-dark text-sm font-semibold px-3 py-1.5 rounded-full"
                >
                  <span>{kw}</span>
                  <button
                    onClick={() => onRemove(kw)}
                    className="hover:bg-emerald-200 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                    aria-label={`Xóa ${kw}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <Footer />
    </>
  );
}
