"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/components/AuthProvider";
import { fetchMyPosts } from "@/lib/auth";
import { formatPrice, formatDate, CATEGORIES } from "@/lib/api";

const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: "", label: "Tất cả" },
  { key: "available", label: "Đang hiển thị" },
  { key: "reserved", label: "Đang giữ chỗ" },
  { key: "done", label: "Đã hoàn tất" },
  { key: "hidden", label: "Đã ẩn" },
];

const STATUS_CHIP: Record<string, { label: string; className: string }> = {
  available: { label: "Hiển thị", className: "bg-emerald-100 text-emerald-700" },
  hidden: { label: "Đã ẩn", className: "bg-gray-100 text-gray-600" },
  done: { label: "Đã xong", className: "bg-blue-100 text-blue-700" },
  reserved: { label: "Giữ chỗ", className: "bg-amber-100 text-amber-700" },
  deleted_by_admin: { label: "Đã bị admin xóa", className: "bg-red-100 text-red-700" },
};

export default function MyPostsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<any[] | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login/?next=/me/posts/");
      return;
    }
    setPosts(null);
    fetchMyPosts(filter || undefined).then((data) => setPosts(data));
  }, [user, authLoading, filter, router]);

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
        <div className="max-w-5xl mx-auto px-4 py-7 flex items-center justify-between flex-wrap gap-3">
          <div>
            <Link href="/me/" className="text-sm text-gray-500 hover:text-primary mb-2 inline-block">
              ← Quay lại Hồ sơ
            </Link>
            <h1 className="text-2xl md:text-3xl font-extrabold text-navy">📦 Tin đăng của tôi</h1>
            <p className="text-gray-600 text-sm mt-1">
              {posts == null ? "Đang tải..." : `${posts.length} bài`}
            </p>
          </div>
          <Link
            href="/posts/new/"
            className="bg-primary hover:bg-primary-dark text-white font-bold px-5 py-2.5 rounded-lg"
          >
            + Đăng tin mới
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-2 flex-wrap mb-5 overflow-x-auto">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`text-sm font-semibold px-4 py-1.5 rounded-full border transition whitespace-nowrap ${filter === f.key ? "bg-primary text-white border-primary" : "bg-white text-gray-700 border-gray-300 hover:border-primary"}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {posts == null ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 h-24 animate-pulse" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
            <div className="text-5xl mb-3">📭</div>
            <p className="font-semibold text-navy mb-1">
              {filter ? "Không có bài nào ở trạng thái này" : "Bạn chưa đăng bài nào"}
            </p>
            <Link
              href="/posts/new/"
              className="inline-block mt-4 bg-primary hover:bg-primary-dark text-white font-bold px-6 py-3 rounded-lg"
            >
              Đăng tin đầu tiên
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((p) => {
              const chip = STATUS_CHIP[p.status] || { label: p.status, className: "bg-gray-100 text-gray-600" };
              return (
                <div
                  key={p.id}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col"
                >
                  <Link href={`/posts/${p.id}/`} className="block">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt={p.title} className="w-full aspect-square object-cover" />
                    ) : (
                      <div className="aspect-square bg-gray-100 flex items-center justify-center text-5xl">📦</div>
                    )}
                  </Link>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <Link
                        href={`/posts/${p.id}/`}
                        className="font-semibold text-navy hover:text-primary line-clamp-2 text-sm"
                      >
                        {p.title}
                      </Link>
                      <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded ${chip.className}`}>
                        {chip.label}
                      </span>
                    </div>
                    <div className={`text-base font-extrabold mb-1 ${p.price === 0 ? "text-primary" : "text-red-600"}`}>
                      {p.price === 0 ? "🎁 Miễn phí" : formatPrice(p.price)}
                    </div>
                    <div className="text-xs text-gray-500 mb-3">
                      {CATEGORIES[p.itemCategory] || p.itemCategory} · {p.viewCount || 0} lượt xem · {formatDate(p.createdAt)}
                    </div>
                    {p.status !== "deleted_by_admin" && (
                      <div className="flex gap-2 mt-auto">
                        <Link
                          href={`/posts/edit/?id=${p.id}`}
                          className="flex-1 text-center bg-gray-100 hover:bg-gray-200 text-navy text-sm font-semibold py-2 rounded-lg"
                        >
                          ✏️ Sửa
                        </Link>
                        <Link
                          href={`/posts/${p.id}/`}
                          className="flex-1 text-center bg-primary-light hover:bg-emerald-100 text-primary-dark text-sm font-semibold py-2 rounded-lg"
                        >
                          Xem
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Footer />
    </>
  );
}
