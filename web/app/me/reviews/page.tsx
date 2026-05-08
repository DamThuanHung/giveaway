"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/components/AuthProvider";
import { fetchMyGivenReviews } from "@/lib/auth";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";

type GivenReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewee: { id: string; name: string | null; avatar: string | null };
  post: { id: string; title: string; listingType: string };
};

function avatarColor(name: string | null): string {
  const colors = [
    "bg-emerald-500",
    "bg-blue-500",
    "bg-rose-500",
    "bg-violet-500",
    "bg-amber-500",
    "bg-cyan-500",
  ];
  return colors[(name || "U").charCodeAt(0) % colors.length];
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function MyReviewsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState<GivenReview[] | null>(null);
  const [fetchError, setFetchError] = useState(false);

  const refetch = () => {
    setFetchError(false);
    setReviews(null);
    fetchMyGivenReviews()
      .then((data) => setReviews(data))
      .catch(() => setFetchError(true));
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login/?next=/me/reviews/");
      return;
    }
    setFetchError(false);
    fetchMyGivenReviews()
      .then((data) => setReviews(data))
      .catch(() => setFetchError(true));
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <>
        <Header />
        <div className="text-center py-20 text-ink-500">Đang tải...</div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <section className="bg-gradient-warm border-b border-ink-200/50">
        <div className="max-w-3xl mx-auto px-4 py-7 md:py-8">
          <Link href="/me/" className="text-sm text-ink-500 hover:text-primary-600 mb-2 inline-block transition-colors duration-150">
            ← Quay lại Hồ sơ
          </Link>
          <h1 className="text-2xl md:text-3xl font-extrabold text-ink-900 tracking-tight">
            ⭐ Đánh giá tôi đã viết
          </h1>
          <p className="text-ink-600 text-sm mt-1">
            {reviews == null
              ? "Đang tải..."
              : reviews.length === 0
              ? "Bạn chưa viết đánh giá nào"
              : `${reviews.length} đánh giá đã gửi`}
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-6">
        {fetchError ? (
          <ErrorState
            title="Không tải được đánh giá"
            description="Mạng yếu hoặc server tạm gián đoạn. Thử lại nhé."
            onRetry={refetch}
          />
        ) : reviews == null ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white border border-ink-200/70 rounded-md p-5 h-32 animate-pulse" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <EmptyState
            emoji="📝"
            title="Chưa có đánh giá nào"
            description="Sau khi giao dịch hoàn tất, bạn có thể đánh giá đối tác — đánh giá đã gửi sẽ hiện ở đây."
            cta={{ href: "/posts/", label: "Khám phá bài đăng" }}
          />
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => {
              const name = r.reviewee.name || "Người dùng";
              const initial = name.trim()[0]?.toUpperCase() || "?";
              return (
                <div
                  key={r.id}
                  className="bg-white border border-ink-200/70 hover:border-primary/40 hover:shadow-soft rounded-md p-5 transition duration-250 ease-warm"
                >
                  <div className="flex items-start gap-3">
                    {r.reviewee.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.reviewee.avatar}
                        alt={name}
                        className="w-12 h-12 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div
                        className={`w-12 h-12 rounded-full ${avatarColor(name)} text-white font-bold flex items-center justify-center shrink-0`}
                      >
                        {initial}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <Link
                          href={`/users/${r.reviewee.id}/`}
                          className="font-semibold text-ink-900 hover:text-primary-600 transition-colors duration-150"
                        >
                          {name}
                        </Link>
                        <span className="text-xs text-ink-400">{fmtDate(r.createdAt)}</span>
                      </div>
                      <div className="text-amber-500 text-base mt-0.5">
                        {"★".repeat(r.rating)}
                        <span className="text-ink-300">{"★".repeat(5 - r.rating)}</span>
                      </div>
                      {r.comment && (
                        <p className="text-sm text-ink-700 mt-2 whitespace-pre-wrap leading-relaxed">
                          {r.comment}
                        </p>
                      )}
                      <Link
                        href={`/posts/${r.post.id}/`}
                        className="inline-flex items-center gap-1 text-xs text-ink-500 hover:text-primary-600 mt-2 transition-colors duration-150"
                      >
                        📦 {r.post.title}
                      </Link>
                    </div>
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
