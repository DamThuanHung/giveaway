import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PostCard } from "@/components/PostCard";
import type { Post } from "@/lib/api";
import { AREA_CATEGORIES } from "@/lib/areas";

const BASE = "https://traotay.com.vn";

type Props = {
  provinceSlug: string;
  provinceName: string;
  /** Có khi đang ở trang danh mục trong tỉnh. */
  category?: { slug: string; seo: string };
  posts: Post[];
  /** Các danh mục trong tỉnh đủ ngưỡng, để làm liên kết nội bộ. */
  siblingCategories: { key: string; count: number }[];
};

const MAX_CARDS = 48;

export function AreaPage({ provinceSlug, provinceName, category, posts, siblingCategories }: Props) {
  const heading = category ? `${category.seo} cũ tại ${provinceName}` : `Đồ cũ & đồ tặng tại ${provinceName}`;
  const provinceUrl = `${BASE}/khu-vuc/${provinceSlug}/`;
  const pageUrl = category ? `${provinceUrl}${category.slug}/` : provinceUrl;
  const shown = posts.slice(0, MAX_CARDS);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Trang chủ", item: `${BASE}/` },
      { "@type": "ListItem", position: 2, name: provinceName, item: provinceUrl },
      ...(category ? [{ "@type": "ListItem", position: 3, name: category.seo, item: pageUrl }] : []),
    ],
  };
  const listLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: heading,
    url: pageUrl,
    numberOfItems: posts.length,
    itemListElement: shown.slice(0, 20).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${BASE}/posts/${p.id}/`,
      name: p.title,
    })),
  };

  return (
    <>
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listLd) }} />

      <section className="bg-gradient-to-br from-primary-light to-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-10">
          <nav className="text-sm text-ink-500 mb-4 flex items-center gap-1.5 flex-wrap">
            <Link href="/" className="hover:text-primary transition-colors duration-150">Trang chủ</Link>
            <span className="text-ink-300">/</span>
            {category ? (
              <>
                <Link href={`/khu-vuc/${provinceSlug}/`} className="hover:text-primary transition-colors duration-150">
                  {provinceName}
                </Link>
                <span className="text-ink-300">/</span>
                <span className="text-ink-700">{category.seo}</span>
              </>
            ) : (
              <span className="text-ink-700">{provinceName}</span>
            )}
          </nav>
          <h1 className="text-3xl md:text-4xl font-extrabold text-navy mb-2">{heading}</h1>
          <p className="text-gray-600 max-w-3xl">
            Hiện có {posts.length.toLocaleString("vi-VN")} bài đăng
            {category ? ` ${category.seo.toLowerCase()}` : " đồ cũ và đồ tặng"} tại {provinceName} trên Trao Tay,
            cập nhật mỗi giờ. Người đăng ở gần bạn: chat trực tiếp, hẹn xem hàng và nhận đồ ngay trong khu vực.
          </p>
        </div>
      </section>

      <section className="py-8 max-w-7xl mx-auto px-4">
        {siblingCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {category && (
              <Link
                href={`/khu-vuc/${provinceSlug}/`}
                className="px-3 py-1.5 rounded-full border border-ink-200 text-sm text-ink-700 hover:border-primary hover:text-primary transition-colors"
              >
                Tất cả tại {provinceName}
              </Link>
            )}
            {siblingCategories
              .filter((c) => AREA_CATEGORIES[c.key].slug !== category?.slug)
              .map((c) => (
                <Link
                  key={c.key}
                  href={`/khu-vuc/${provinceSlug}/${AREA_CATEGORIES[c.key].slug}/`}
                  className="px-3 py-1.5 rounded-full border border-ink-200 text-sm text-ink-700 hover:border-primary hover:text-primary transition-colors"
                >
                  {AREA_CATEGORIES[c.key].name} ({c.count})
                </Link>
              ))}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
          {shown.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>

        {posts.length > shown.length && (
          <p className="mt-6 text-sm text-ink-500">
            Đang hiển thị {shown.length}/{posts.length} bài mới nhất.{" "}
            <Link href="/posts/" className="text-primary-600 hover:text-primary-700 font-semibold">
              Xem tất cả bài đăng →
            </Link>
          </p>
        )}
      </section>

      <Footer />
    </>
  );
}
