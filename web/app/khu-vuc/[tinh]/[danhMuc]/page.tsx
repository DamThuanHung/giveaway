import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AreaPage } from "@/components/AreaPage";
import {
  AREA_CATEGORIES,
  CATEGORY_KEY_BY_SLUG,
  eligibleCategories,
  eligibleProvinces,
  loadAreaIndex,
  MIN_POSTS_PER_AREA,
} from "@/lib/areas";

export const revalidate = 3600;

export async function generateStaticParams() {
  return eligibleProvinces(await loadAreaIndex()).flatMap((a) =>
    eligibleCategories(a).map((c) => ({ tinh: a.slug, danhMuc: AREA_CATEGORIES[c.key].slug })),
  );
}

async function load(tinh: string, danhMuc: string) {
  const key = CATEGORY_KEY_BY_SLUG[danhMuc];
  if (!key) return null;
  const area = (await loadAreaIndex())[tinh];
  const posts = area?.byCategory[key] ?? [];
  if (!area || posts.length < MIN_POSTS_PER_AREA) return null;
  return { area, key, posts, cat: AREA_CATEGORIES[key] };
}

export async function generateMetadata({
  params,
}: {
  params: { tinh: string; danhMuc: string };
}): Promise<Metadata> {
  const d = await load(params.tinh, params.danhMuc);
  if (!d) return { title: "Không tìm thấy trang" };
  const url = `https://traotay.com.vn/khu-vuc/${d.area.slug}/${d.cat.slug}/`;
  return {
    title: `${d.cat.seo} cũ tại ${d.area.name} — ${d.posts.length} bài đăng`,
    description: `Xem ${d.posts.length} bài đăng ${d.cat.seo.toLowerCase()} cũ tại ${d.area.name} trên Trao Tay. Chat trực tiếp với người đăng, hẹn xem hàng gần bạn.`,
    alternates: { canonical: url },
    openGraph: { url, type: "website", locale: "vi_VN", siteName: "Trao Tay" },
  };
}

export default async function ProvinceCategoryPage({
  params,
}: {
  params: { tinh: string; danhMuc: string };
}) {
  const d = await load(params.tinh, params.danhMuc);
  if (!d) notFound();
  return (
    <AreaPage
      provinceSlug={d.area.slug}
      provinceName={d.area.name}
      category={{ slug: d.cat.slug, seo: d.cat.seo }}
      posts={d.posts}
      siblingCategories={eligibleCategories(d.area)}
    />
  );
}
