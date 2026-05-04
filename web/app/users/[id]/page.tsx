import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PostCard } from "@/components/PostCard";
import {
  fetchUserById,
  fetchUserPosts,
  fetchUserReviews,
  fetchAllAuthorIds,
  formatDate,
} from "@/lib/api";
import { BlockUserButton } from "@/components/BlockUserButton";

export async function generateStaticParams() {
  return await fetchAllAuthorIds();
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const user = await fetchUserById(params.id).catch(() => null);
  if (!user) return { title: "Người dùng không tồn tại" };

  const name = user.name || "Người dùng";
  const desc = `${name} trên Trao Tay — ${user._count.posts} tin đăng, ${user.completedTransactions} giao dịch hoàn tất, ${user._count.reviewsReceived} đánh giá.`;
  const url = `https://traotay.com.vn/users/${user.id}/`;

  return {
    title: `${name} — Hồ sơ người bán`,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: name,
      description: desc,
      url,
      type: "profile",
      locale: "vi_VN",
      images: user.avatar ? [user.avatar] : ["/assets/icon_512.png"],
    },
  };
}

function memberSince(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const months =
    (now.getFullYear() - d.getFullYear()) * 12 +
    (now.getMonth() - d.getMonth());
  if (months < 1) return "Mới tham gia";
  if (months < 12) return `${months} tháng trước`;
  return `${Math.floor(months / 12)} năm trước`;
}

function avatarFallback(name: string | null): string {
  if (!name) return "?";
  return name.trim()[0].toUpperCase();
}

function avatarColor(name: string | null): string {
  const colors = [
    "bg-emerald-500",
    "bg-blue-500",
    "bg-rose-500",
    "bg-violet-500",
    "bg-amber-500",
    "bg-cyan-500",
    "bg-pink-500",
    "bg-indigo-500",
  ];
  const seed = (name || "U").charCodeAt(0);
  return colors[seed % colors.length];
}

export default async function UserProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const [user, userPosts, reviews] = await Promise.all([
    fetchUserById(params.id).catch(() => null),
    fetchUserPosts(params.id).catch(() => []),
    fetchUserReviews(params.id).catch(() => []),
  ]);
  if (!user) notFound();

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

  // JSON-LD Person schema cho rich result
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: user.name || "Người dùng Trao Tay",
    image: user.avatar || undefined,
    url: `https://traotay.com.vn/users/${user.id}/`,
    ...(avgRating != null
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: avgRating.toFixed(2),
            reviewCount: reviews.length,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  return (
    <>
      <Header />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="max-w-5xl mx-auto px-4 py-8">
        <nav className="text-sm text-gray-500 mb-4 flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-primary">Trang chủ</Link>
          <span>›</span>
          <Link href="/posts/" className="hover:text-primary">Tin đăng</Link>
          <span>›</span>
          <span className="text-gray-700">{user.name || "Người dùng"}</span>
        </nav>

        {/* Profile header */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row gap-6 md:items-center">
            <div className="shrink-0">
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar}
                  alt={user.name || "Avatar"}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                />
              ) : (
                <div
                  className={`w-24 h-24 rounded-full ${avatarColor(user.name)} text-white text-4xl font-bold flex items-center justify-center shadow-md`}
                >
                  {avatarFallback(user.name)}
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-2xl md:text-3xl font-extrabold text-navy">
                  {user.name || "Người dùng ẩn danh"}
                </h1>
                {user.role === "admin" && (
                  <span className="bg-violet-100 text-violet-700 text-xs font-bold px-2.5 py-1 rounded-md">
                    ADMIN
                  </span>
                )}
                {user.isPhoneVerified && (
                  <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-md flex items-center gap-1">
                    ✓ Đã xác minh SĐT
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-sm">
                Tham gia Trao Tay {memberSince(user.createdAt)}
              </p>

              <div className="mt-3">
                <BlockUserButton targetId={user.id} targetName={user.name || "Người dùng"} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-extrabold text-navy">
                    {user._count.posts}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">Tin đăng</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-extrabold text-primary">
                    {user.completedTransactions}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">Hoàn tất</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-extrabold text-amber-600">
                    {avgRating != null ? `${avgRating.toFixed(1)}★` : "—"}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">Đánh giá TB</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-extrabold text-navy">
                    {reviews.length}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">Lượt đánh giá</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User posts */}
        <section className="mb-8">
          <h2 className="text-xl font-extrabold text-navy mb-4">
            Tin đăng của {user.name || "người dùng này"} ({userPosts.length})
          </h2>
          {userPosts.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500">
              Chưa có tin đăng nào đang hiển thị
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {userPosts.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          )}
        </section>

        {/* Reviews */}
        {reviews.length > 0 && (
          <section>
            <h2 className="text-xl font-extrabold text-navy mb-4">
              Đánh giá từ người mua/người tặng ({reviews.length})
            </h2>
            <div className="space-y-3">
              {reviews.slice(0, 10).map((r) => (
                <div
                  key={r.id}
                  className="bg-white border border-gray-200 rounded-xl p-5"
                >
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      {r.reviewer.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.reviewer.avatar}
                          alt={r.reviewer.name || ""}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className={`w-9 h-9 rounded-full ${avatarColor(r.reviewer.name)} text-white text-sm font-bold flex items-center justify-center`}
                        >
                          {avatarFallback(r.reviewer.name)}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-sm text-navy">
                          {r.reviewer.name || "Người dùng ẩn danh"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(r.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="text-amber-500 font-bold">
                      {"★".repeat(r.rating)}
                      <span className="text-gray-300">
                        {"★".repeat(5 - r.rating)}
                      </span>
                    </div>
                  </div>
                  {r.comment && (
                    <p className="text-gray-700 text-sm leading-relaxed mt-2">
                      {r.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </article>

      <Footer />
    </>
  );
}
