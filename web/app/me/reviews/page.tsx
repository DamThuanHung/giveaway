"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/components/AuthProvider";
import { fetchMyGivenReviews } from "@/lib/auth";

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

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login/?next=/me/reviews/");
      return;
    }
    fetchMyGivenReviews().then((data) => setReviews(data));
  }, [user, authLoading, router]);

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
          <h1 className="text-2xl md:text-3xl font-extrabold text-navy">
            ⭐ Đánh giá tôi đã viết
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            {reviews == null
              ? "Đang tải..."
              : reviews.length === 0
              ? "Bạn chưa viết đánh giá nào"
              : `${reviews.length} đánh giá đã gửi`}
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-6">
        {reviews == null ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 h-32 animate-pulse" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
            <div className="text-5xl mb-3">📝</div>
            <p className="font-semibold text-navy mb-1">Chưa có đánh giá nào</p>
            <p className="text-gray-500 text-sm mb-5">
              Sau khi giao dịch hoàn tất, bạn có thể đánh giá đối tác — bạn nhận xét nào sẽ hiện ở đây
            </p>
            <Link
              href="/posts/"
              className="inline-block bg-primary hover:bg-primary-dark text-white font-bold px-6 py-3 rounded-lg"
            >
              Khám phá tin đăng
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => {
              const name = r.reviewee.name || "Người dùng";
              const initial = name.trim()[0]?.toUpperCase() || "?";
              return (
                <div
                  key={r.id}
                  className="bg-white border border-gray-200 rounded-xl p-5"
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
                          className="font-semibold text-navy hover:text-primary"
                        >
                          {name}
                        </Link>
                        <span className="text-xs text-gray-400">{fmtDate(r.createdAt)}</span>
                      </div>
                      <div className="text-amber-500 text-base mt-0.5">
                        {"★".repeat(r.rating)}
                        <span className="text-gray-300">{"★".repeat(5 - r.rating)}</span>
                      </div>
                      {r.comment && (
                        <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                          {r.comment}
                        </p>
                      )}
                      <Link
                        href={`/posts/${r.post.id}/`}
                        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-primary mt-2"
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
