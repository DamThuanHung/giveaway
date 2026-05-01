import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  fetchPostById,
  fetchAllPostIds,
  fetchPosts,
  formatPrice,
  formatDate,
  formatLocation,
  CATEGORIES,
} from "@/lib/api";
import { PostCard } from "@/components/PostCard";
import { FavoriteButton } from "@/components/FavoriteButton";

// Pre-render mọi /posts/[id]/ tại build time. Cap 500 posts mới nhất.
export async function generateStaticParams() {
  return await fetchAllPostIds();
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const post = await fetchPostById(params.id).catch(() => null);
  if (!post) return { title: "Không tìm thấy bài đăng" };

  const desc = post.description.slice(0, 160).replace(/\n/g, " ");
  const url = `https://traotay.com.vn/posts/${post.id}/`;

  return {
    title: `${post.title} — ${formatPrice(post.price)} · ${post.province}`,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: desc,
      url,
      images: post.imageUrl ? [post.imageUrl] : [],
      type: "article",
      locale: "vi_VN",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: desc,
      images: post.imageUrl ? [post.imageUrl] : [],
    },
  };
}

export default async function PostDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const post = await fetchPostById(params.id).catch(() => null);
  if (!post) notFound();

  // Fetch 4 bài cùng category để gợi ý "Tin liên quan" (SEO + internal linking)
  const similarRes = await fetchPosts({
    page: 1,
    limit: 8,
    itemCategory: post.itemCategory,
  }).catch(() => null);
  const similar = (similarRes?.data ?? [])
    .filter((p) => p.id !== post.id)
    .slice(0, 4);

  const isFree = post.price === 0;
  const isVip = post.boostTier === 3;

  // JSON-LD Product schema cho Google rich result
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: post.title,
    description: post.description,
    image: post.images.length > 0 ? post.images : [post.imageUrl].filter(Boolean),
    offers: {
      "@type": "Offer",
      price: post.price,
      priceCurrency: "VND",
      availability:
        post.status === "available"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/UsedCondition",
      seller: {
        "@type": "Person",
        name: post.author?.name || "Người dùng Trao Tay",
      },
    },
    category: CATEGORIES[post.itemCategory] || "Đồ cũ",
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
          <span className="text-gray-700 truncate">{post.title}</span>
        </nav>

        <div className="grid md:grid-cols-[1.6fr_1fr] gap-8">
          {/* Left: images + description */}
          <div>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-5">
              {post.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.imageUrl} alt={post.title} className="w-full aspect-square object-cover" />
              ) : (
                <div className="aspect-square flex items-center justify-center text-7xl text-gray-300 bg-gray-50">📦</div>
              )}
            </div>

            {post.images && post.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2 mb-6">
                {post.images.slice(0, 8).map((img, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={img}
                    alt={`${post.title} ${i + 1}`}
                    className="w-full aspect-square object-cover rounded-lg border border-gray-200"
                  />
                ))}
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="font-bold text-navy mb-3">Mô tả</h2>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{post.description}</p>
            </div>
          </div>

          {/* Right: title, price, info */}
          <aside>
            <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-20">
              {isVip && (
                <span className="inline-block bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold px-2.5 py-1 rounded-md mb-3">
                  ⭐ Bài VIP
                </span>
              )}

              <h1 className="text-2xl font-extrabold text-navy mb-3 leading-tight">
                {post.title}
              </h1>

              <div className={`text-3xl font-extrabold mb-5 ${isFree ? "text-primary" : "text-red-600"}`}>
                {isFree ? "🎁 Miễn phí" : formatPrice(post.price)}
              </div>

              <dl className="text-sm space-y-2.5 mb-5 border-t border-gray-100 pt-4">
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-500 shrink-0">Danh mục</dt>
                  <dd className="text-right font-medium">{CATEGORIES[post.itemCategory] || post.itemCategory}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-500 shrink-0">Khu vực</dt>
                  <dd className="text-right">{formatLocation(post)}</dd>
                </div>
                {post.area && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500 shrink-0">Diện tích</dt>
                    <dd className="text-right font-medium">{post.area} m²</dd>
                  </div>
                )}
                {post.bedrooms && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500 shrink-0">Phòng ngủ</dt>
                    <dd className="text-right font-medium">{post.bedrooms}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-500 shrink-0">Người đăng</dt>
                  <dd className="text-right font-medium">
                    {post.author?.id ? (
                      <Link href={`/users/${post.author.id}/`} className="text-primary hover:underline">
                        {post.author.name || "Ẩn danh"}
                      </Link>
                    ) : (
                      post.author?.name || "Ẩn danh"
                    )}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-500 shrink-0">Ngày đăng</dt>
                  <dd className="text-right">{formatDate(post.createdAt)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-500 shrink-0">Lượt xem</dt>
                  <dd className="text-right">{post.viewCount}</dd>
                </div>
              </dl>

              <div className="flex gap-2 mb-2">
                <a
                  href="https://play.google.com/store/apps/details?id=vn.traotay.app"
                  target="_blank"
                  rel="noopener"
                  className="flex-1 bg-primary hover:bg-primary-dark text-white text-center font-bold py-3.5 rounded-xl transition"
                >
                  💬 Tải app để chat
                </a>
                <FavoriteButton postId={post.id} size="lg" className="!w-14 !h-14 !rounded-xl" />
              </div>
              <p className="text-xs text-gray-500 text-center mt-1">
                Liên hệ + giao dịch qua app Trao Tay
              </p>
            </div>
          </aside>
        </div>

        {similar.length > 0 && (
          <div className="mt-12">
            <div className="flex items-end justify-between mb-5">
              <h2 className="text-2xl font-extrabold text-navy">
                Tin tương tự trong "{CATEGORIES[post.itemCategory] || post.itemCategory}"
              </h2>
              <Link
                href={`/posts/?cat=${post.itemCategory}`}
                className="text-primary font-semibold hover:underline text-sm"
              >
                Xem tất cả →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {similar.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </div>
        )}
      </article>

      <Footer />
    </>
  );
}
