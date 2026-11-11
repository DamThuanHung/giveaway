import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AreaPage } from "@/components/AreaPage";
import {
  buildAreaIndex,
  eligibleCategories,
  eligibleProvinces,
  loadAreaIndex,
  MIN_POSTS_PER_AREA,
} from "@/lib/areas";

export const revalidate = 3600;

export async function generateStaticParams() {
  return eligibleProvinces(await loadAreaIndex()).map((a) => ({ tinh: a.slug }));
}

export async function generateMetadata({ params }: { params: { tinh: string } }): Promise<Metadata> {
  const area = (await loadAreaIndex())[params.tinh];
  if (!area || area.posts.length < MIN_POSTS_PER_AREA) return { title: "Không tìm thấy khu vực" };
  const url = `https://traotay.com.vn/khu-vuc/${area.slug}/`;
  return {
    title: `Đồ cũ & đồ tặng tại ${area.name} — ${area.posts.length} bài đăng`,
    description: `Xem ${area.posts.length} bài đăng đồ cũ và đồ tặng miễn phí tại ${area.name} trên Trao Tay. Chat trực tiếp với người đăng, hẹn xem hàng gần bạn.`,
    alternates: { canonical: url },
    openGraph: { url, type: "website", locale: "vi_VN", siteName: "Trao Tay" },
  };
}

export default async function ProvincePage({ params }: { params: { tinh: string } }) {
  const area = (await buildAreaIndex())[params.tinh];
  // Chưa đủ ngưỡng bài → không có trang (tránh trang mỏng).
  if (!area || area.posts.length < MIN_POSTS_PER_AREA) notFound();
  return (
    <AreaPage
      provinceSlug={area.slug}
      provinceName={area.name}
      posts={area.posts}
      siblingCategories={eligibleCategories(area)}
    />
  );
}
