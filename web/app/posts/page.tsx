import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PostCard } from "@/components/PostCard";
import { fetchPosts, CATEGORIES } from "@/lib/api";

export const metadata: Metadata = {
  title: "Tin đăng — Mua bán & trao tặng đồ cũ",
  description:
    "Tất cả tin đăng đồ cũ, đồ tặng miễn phí trên Trao Tay. Tìm theo khu vực, danh mục, giá. Cập nhật mới mỗi ngày.",
  alternates: { canonical: "https://traotay.com.vn/posts/" },
};

export default async function PostsPage() {
  // Lấy 100 posts mới nhất hiển thị. Pagination thật sẽ làm Phase 2.
  const data = await fetchPosts({ page: 1, limit: 100 }).catch(() => null);
  const posts = data?.data ?? [];
  const total = data?.meta.total ?? 0;

  // Đếm số post per category để hiển thị filter
  const catCounts: Record<string, number> = {};
  for (const p of posts) {
    catCounts[p.itemCategory] = (catCounts[p.itemCategory] || 0) + 1;
  }
  const sortedCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <Header />

      <section className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-navy mb-2">
            Tin đăng đồ cũ trên Trao Tay
          </h1>
          <p className="text-gray-600">
            {total > 0
              ? `${total} tin đăng từ cộng đồng người dùng — cập nhật mỗi giờ`
              : "Đang cập nhật tin đăng..."}
          </p>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-[240px_1fr] gap-6">
          {/* Sidebar danh mục */}
          <aside className="hidden md:block">
            <div className="bg-white border border-gray-200 rounded-xl p-4 sticky top-20">
              <h2 className="font-bold text-navy mb-3 text-sm">Danh mục</h2>
              <ul className="space-y-1 text-sm">
                {sortedCats.map(([key, count]) => (
                  <li key={key} className="flex justify-between hover:bg-gray-50 px-2 py-1.5 rounded cursor-pointer">
                    <span>{CATEGORIES[key] || key}</span>
                    <span className="text-gray-400">{count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Grid posts */}
          <div>
            {posts.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                <div className="text-5xl mb-4">📭</div>
                <p className="text-gray-600">Chưa có tin đăng nào. Quay lại sau nhé.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {posts.map((p) => (
                  <PostCard key={p.id} post={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
