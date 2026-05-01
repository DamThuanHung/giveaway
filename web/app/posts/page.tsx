import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PostsExplorer } from "@/components/PostsExplorer";
import { fetchPosts } from "@/lib/api";

export const metadata: Metadata = {
  title: "Tin đăng — Mua bán & trao tặng đồ cũ",
  description:
    "Tất cả tin đăng đồ cũ, đồ tặng miễn phí trên Trao Tay. Tìm theo khu vực, danh mục, giá. Cập nhật mới mỗi ngày.",
  alternates: { canonical: "https://traotay.com.vn/posts/" },
};

export default async function PostsPage() {
  // Pre-render với 24 posts mới nhất default. Client component sẽ fetch lại
  // khi user filter/search/sort qua URL params.
  const initial = await fetchPosts({ page: 1, limit: 24 }).catch(() => null);

  return (
    <>
      <Header />

      <section className="bg-gradient-to-br from-primary-light to-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-navy mb-2">
            Tin đăng đồ cũ trên Trao Tay
          </h1>
          <p className="text-gray-600">
            {initial?.meta.total
              ? `${initial.meta.total.toLocaleString("vi-VN")} bài đăng từ cộng đồng — cập nhật mỗi giờ`
              : "Đang cập nhật tin đăng..."}
          </p>
        </div>
      </section>

      <section className="py-8 max-w-7xl mx-auto px-4">
        <Suspense fallback={<div className="py-20 text-center text-gray-500">Đang tải...</div>}>
          <PostsExplorer initialData={initial} initialQuery={{ page: 1, limit: 24, sortBy: "newest" }} />
        </Suspense>
      </section>

      <Footer />
    </>
  );
}
