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
import { PostMap } from "@/components/PostMap";
import { ContactSellerButton } from "@/components/ContactSellerButton";
import { OwnerActions } from "@/components/OwnerActions";
import { PostImageGallery } from "@/components/PostImageGallery";

export const revalidate = 3600;

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
  // OG banner pre-generated bởi scripts/generate-og-images.mjs sau next build.
  // Fallback raw imageUrl nếu OG chưa generate (lần đầu post mới đăng,
  // chưa qua cron rebuild 1h).
  const ogBanner = `https://traotay.com.vn/og/${post.id}.png`;
  const ogImages = [
    { url: ogBanner, width: 1200, height: 630, alt: post.title },
    ...(post.imageUrl ? [{ url: post.imageUrl, alt: post.title }] : []),
  ];

  return {
    title: `${post.title} — ${formatPrice(post.price)} · ${post.province}`,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: desc,
      url,
      images: ogImages,
      type: "article",
      locale: "vi_VN",
      siteName: "Trao Tay",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: desc,
      images: [ogBanner],
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
  const isPlus = post.boostTier === 2;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: post.title,
    description: post.description,
    image: post.images.length > 0 ? post.images : [post.imageUrl].filter(Boolean),
    dateModified: post.bumpedAt ?? post.createdAt,
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
        url: post.author?.id ? `https://traotay.com.vn/users/${post.author.id}/` : undefined,
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

      <article className="max-w-5xl mx-auto px-4 py-6 md:py-8">
        <nav className="text-sm text-ink-500 mb-5 flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-primary transition-colors duration-150">Trang chủ</Link>
          <span className="text-ink-300">/</span>
          <Link href="/posts/" className="hover:text-primary transition-colors duration-150">Bài đăng</Link>
          <span className="text-ink-300">/</span>
          <span className="text-ink-700 truncate max-w-[200px] md:max-w-none">{post.title}</span>
        </nav>

        <div className="grid md:grid-cols-[1.6fr_1fr] gap-6 md:gap-8">
          {/* ─── Left: images + description ───────────────────────── */}
          <div>
            <PostImageGallery
              images={post.images ?? []}
              imageUrl={post.imageUrl}
              title={post.title}
            />

            <div className="bg-white border border-ink-200/70 rounded-md shadow-soft p-5 md:p-6 mb-5">
              <h2 className="font-bold text-ink-900 mb-3 text-lg tracking-tight">Mô tả</h2>
              <p className="text-ink-700 whitespace-pre-wrap leading-relaxed text-[15px]">
                {post.description}
              </p>
            </div>

            {(post.latitude !== 0 || post.longitude !== 0) && (
              <div className="bg-white border border-ink-200/70 rounded-md shadow-soft p-5 md:p-6">
                <h2 className="font-bold text-ink-900 mb-3 text-lg tracking-tight flex items-center gap-2">
                  <span className="text-primary-600">📍</span> Vị trí trên bản đồ
                </h2>
                <PostMap
                  latitude={post.latitude}
                  longitude={post.longitude}
                  title={post.title}
                />
                <p className="text-xs text-ink-500 mt-3">
                  Vị trí gần đúng do người đăng cung cấp. Click marker để mở Google Maps.
                </p>
              </div>
            )}
          </div>

          {/* ─── Right: title, price, info ────────────────────────── */}
          <aside className="md:sticky md:top-20 md:self-start">
            {post.author?.id && (
              <OwnerActions
                postId={post.id}
                authorId={post.author.id}
                status={post.status}
                postTitle={post.title}
              />
            )}

            <div className="bg-white border border-ink-200/70 rounded-md shadow-card p-5 md:p-6">
              {(isVip || isPlus) && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {isVip && (
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5"
                      style={{
                        background: "linear-gradient(135deg, #2A2418 0%, #1A1A1A 100%)",
                        color: "#F4D36A",
                        letterSpacing: "0.5px",
                        borderRadius: "8px",
                        border: "0.5px solid #C9A84A",
                        boxShadow: "0 2px 8px rgba(201, 168, 74, 0.3)",
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M9.68 13.69L13 11.16l3.31 2.53-1.26-4.1L18.36 7l-4.09-.05L13 3l-1.27 3.95L7.64 7l3.31 2.59-1.27 4.1zM20 12l-1-9H9L7 7v14l6-3 6 3V12h1z"/>
                      </svg>
                      Bài VIP
                    </span>
                  )}
                  {isPlus && !isVip && (
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5"
                      style={{
                        background: "#FEF9E7",
                        color: "#854F0B",
                        borderRadius: "8px",
                        border: "0.5px solid #C9A84A",
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                      </svg>
                      Bài Plus
                    </span>
                  )}
                </div>
              )}

              <h1 className="text-2xl md:text-[26px] font-extrabold text-ink-900 mb-3 leading-tight tracking-tight text-balance">
                {post.title}
              </h1>

              {isFree ? (
                <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-800 px-3 py-1.5 rounded-md mb-5">
                  <span className="text-xl">🎁</span>
                  <span className="text-2xl font-extrabold">Miễn phí</span>
                </div>
              ) : (
                <div className="text-3xl md:text-[32px] font-extrabold text-primary-600 mb-5 tracking-tight">
                  {formatPrice(post.price)}
                </div>
              )}

              <dl className="text-sm space-y-2.5 mb-5 border-t border-ink-200/50 pt-4">
                <Row label="Danh mục" value={CATEGORIES[post.itemCategory] || post.itemCategory} />
                <Row label="Khu vực" value={formatLocation(post)} />
                {post.area && <Row label="Diện tích" value={`${post.area} m²`} />}
                {post.bedrooms && <Row label="Phòng ngủ" value={String(post.bedrooms)} />}
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-500 shrink-0">Người đăng</dt>
                  <dd className="text-right font-medium text-ink-800">
                    {post.author?.id ? (
                      <Link
                        href={`/users/${post.author.id}/`}
                        className="text-primary-600 hover:text-primary-700 hover:underline transition-colors duration-150"
                      >
                        {post.author.name || "Ẩn danh"}
                      </Link>
                    ) : (
                      post.author?.name || "Ẩn danh"
                    )}
                  </dd>
                </div>
                <Row label="Ngày đăng" value={formatDate(post.createdAt)} mute />
                <Row label="Lượt xem" value={String(post.viewCount)} mute />
              </dl>

              <div className="flex gap-2 mb-2.5">
                {post.author?.id ? (
                  <ContactSellerButton
                    postId={post.id}
                    sellerId={post.author.id}
                    postTitle={post.title}
                  />
                ) : (
                  <div className="flex-1 bg-ink-100 text-ink-500 text-center font-bold py-3.5 rounded-md">
                    Không thể nhắn (bài ẩn danh)
                  </div>
                )}
                <FavoriteButton postId={post.id} size="lg" className="!w-14 !h-14 !rounded-md shadow-soft hover:shadow-card" />
              </div>
              <p className="text-xs text-ink-500 text-center">
                Hoặc{" "}
                <a
                  href="/tai-app/"
                  className="text-primary-600 hover:text-primary-700 hover:underline font-medium"
                >
                  tải app
                </a>{" "}
                để chat realtime + thông báo
              </p>
            </div>
          </aside>
        </div>

        {similar.length > 0 && (
          <div className="mt-12 md:mt-16">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-2xl md:text-[26px] font-extrabold text-ink-900 tracking-tight">
                  Tin tương tự
                </h2>
                <p className="text-sm text-ink-500 mt-1">
                  Trong "{CATEGORIES[post.itemCategory] || post.itemCategory}"
                </p>
              </div>
              <Link
                href={`/posts/?cat=${post.itemCategory}`}
                className="text-primary-600 hover:text-primary-700 font-semibold whitespace-nowrap text-sm transition-colors"
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

function Row({ label, value, mute }: { label: string; value: string; mute?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-500 shrink-0">{label}</dt>
      <dd className={`text-right ${mute ? "text-ink-600" : "font-medium text-ink-800"}`}>
        {value}
      </dd>
    </div>
  );
}
