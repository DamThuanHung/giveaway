"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/components/AuthProvider";
import { fetchMyPosts } from "@/lib/auth";
import { formatPrice, formatDate, isFreePost, CATEGORIES } from "@/lib/api";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";

const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: "", label: "Tất cả" },
  { key: "available", label: "Đang hiển thị" },
  { key: "reserved", label: "Đang giữ chỗ" },
  { key: "done", label: "Đã hoàn tất" },
  { key: "hidden", label: "Đã ẩn" },
];

const STATUS_CHIP: Record<string, { label: string; className: string }> = {
  available: { label: "Hiển thị", className: "bg-primary-100 text-primary-800" },
  hidden: { label: "Đã ẩn", className: "bg-ink-100 text-ink-600" },
  done: { label: "Đã xong", className: "bg-blue-100 text-blue-700" },
  reserved: { label: "Giữ chỗ", className: "bg-amber-100 text-amber-700" },
  deleted_by_admin: { label: "Đã bị admin xóa", className: "bg-red-100 text-red-700" },
};

export default function MyPostsPage() {
  return (
    <Suspense fallback={<><Header /><div className="text-center py-20 text-ink-500">Đang tải...</div><Footer /></>}>
      <MyPostsContent />
    </Suspense>
  );
}

function MyPostsContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<any[] | null>(null);
  const [filter, setFilter] = useState("");
  const [fetchError, setFetchError] = useState(false);
  const [newPostId, setNewPostId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get("new");
    if (id) {
      setNewPostId(id);
      // Xóa query param khỏi URL, không reload page
      router.replace("/me/posts/", { scroll: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refetch = () => {
    setFetchError(false);
    setPosts(null);
    fetchMyPosts(filter || undefined)
      .then((data) => setPosts(data))
      .catch(() => setFetchError(true));
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login/?next=/me/posts/");
      return;
    }
    setFetchError(false);
    setPosts(null);
    fetchMyPosts(filter || undefined)
      .then((data) => setPosts(data))
      .catch(() => setFetchError(true));
  }, [user, authLoading, filter, router]);

  if (authLoading || !user) {
    return null;
  }

  return (
    <>
      <Header />

      <section className="bg-gradient-warm border-b border-ink-200/50">
        <div className="max-w-5xl mx-auto px-4 py-7 md:py-8 flex items-center justify-between flex-wrap gap-3">
          <div>
            <Link href="/me/" className="text-sm text-ink-500 hover:text-primary-600 mb-2 inline-block transition-colors duration-150">
              ← Quay lại Hồ sơ
            </Link>
            <h1 className="text-2xl md:text-3xl font-extrabold text-ink-900 tracking-tight">📦 Bài đăng của tôi</h1>
            <p className="text-ink-600 text-sm mt-1">
              {posts == null ? "Đang tải..." : `${posts.length} bài`}
            </p>
          </div>
          <Link
            href="/posts/new/"
            className="bg-primary hover:bg-primary-dark active:scale-[0.97] text-white font-bold px-5 py-2.5 rounded-md shadow-soft hover:shadow-card transition duration-150 ease-warm"
          >
            + Đăng tin mới
          </Link>
        </div>
      </section>

      {newPostId && (
        <div className="max-w-5xl mx-auto px-4 pt-5">
          <div className="bg-primary-100 border border-primary-300 text-primary-900 rounded-md px-4 py-3 flex items-center justify-between gap-3 text-sm font-medium shadow-soft">
            <span>Đăng bài thành công! Bài đăng của bạn đang hiển thị.</span>
            <button
              type="button"
              onClick={() => setNewPostId(null)}
              className="text-primary-600 hover:text-primary-900 font-bold text-base leading-none"
              aria-label="Đóng"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <section className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex gap-2 flex-wrap mb-5 overflow-x-auto">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`text-sm font-semibold px-4 py-1.5 rounded-full border transition duration-150 ease-warm whitespace-nowrap ${
                filter === f.key
                  ? "bg-primary text-white border-primary shadow-soft"
                  : "bg-white text-ink-700 border-ink-200 hover:border-primary hover:text-primary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {fetchError ? (
          <ErrorState
            title="Không tải được bài đăng của bạn"
            description="Có thể do mạng yếu. Thử lại nhé."
            onRetry={refetch}
          />
        ) : posts == null ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white border border-ink-200/70 rounded-md p-4 h-64 animate-pulse" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            emoji="📭"
            title={filter ? "Không có bài nào ở trạng thái này" : "Bạn chưa đăng bài nào"}
            description={
              filter
                ? "Thử chuyển sang trạng thái khác hoặc đăng bài mới."
                : "Bắt đầu cho hành trình trao tay đồ cũ — bài đầu tiên thường về người nhanh nhất."
            }
            cta={{ href: "/posts/new/", label: "Đăng tin đầu tiên" }}
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((p) => {
              const chip = STATUS_CHIP[p.status] || { label: p.status, className: "bg-ink-100 text-ink-600" };
              return (
                <div
                  key={p.id}
                  className="bg-white border border-ink-200/70 hover:border-primary/60 hover:shadow-card rounded-md overflow-hidden flex flex-col transition duration-250 ease-warm"
                >
                  <Link href={`/posts/${p.id}/`} className="block">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt={p.title} className="w-full aspect-square object-cover" />
                    ) : (
                      <div className="aspect-square bg-cream-100 flex items-center justify-center text-5xl text-ink-300">📦</div>
                    )}
                  </Link>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <Link
                        href={`/posts/${p.id}/`}
                        className="font-semibold text-ink-900 hover:text-primary-600 line-clamp-2 text-sm transition-colors duration-150"
                      >
                        {p.title}
                      </Link>
                      <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-sm ${chip.className}`}>
                        {chip.label}
                      </span>
                    </div>
                    <div className={`text-base font-extrabold mb-1 ${isFreePost(p) ? "text-primary-600" : "text-ink-900"}`}>
                      {isFreePost(p) ? "🎁 Miễn phí" : formatPrice(p.price)}
                    </div>
                    <div className="text-xs text-ink-500 mb-3">
                      {CATEGORIES[p.itemCategory] || p.itemCategory} · {p.viewCount || 0} lượt xem · {formatDate(p.createdAt)}
                    </div>
                    {p.status !== "deleted_by_admin" && (
                      <div className="flex gap-2 mt-auto">
                        <Link
                          href={`/posts/edit/?id=${p.id}`}
                          className="flex-1 text-center bg-ink-100 hover:bg-ink-200 text-ink-800 text-sm font-semibold py-2 rounded-md transition duration-150 ease-warm"
                        >
                          ✏️ Sửa
                        </Link>
                        <Link
                          href={`/posts/${p.id}/`}
                          className="flex-1 text-center bg-primary-100 hover:bg-primary-200 text-primary-800 text-sm font-semibold py-2 rounded-md transition duration-150 ease-warm"
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
