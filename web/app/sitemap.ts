import type { MetadataRoute } from "next";
import { fetchAllPostIds, fetchAllAuthorIds } from "@/lib/api";
import { CHAPTERS } from "./dac-dinh/data";
import { AREA_CATEGORIES, eligibleCategories, eligibleProvinces, loadAreaIndex, newestDate } from "@/lib/areas";

const BASE = "https://traotay.com.vn";

// Không có dòng này thì sitemap chỉ được dựng LÚC BUILD → bài mới không vào sitemap cho tới lần
// build kế (phát hiện 2026-11-11: VPS không có cron rebuild). Làm mới mỗi giờ như các trang bài.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, users, areaIndex] = await Promise.all([
    fetchAllPostIds().catch(() => []),
    fetchAllAuthorIds().catch(() => []),
    loadAreaIndex(),
  ]);

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${BASE}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE}/posts/`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${BASE}/dac-dinh/on-tap/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/privacy.html`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE}/terms.html`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE}/delete-account.html`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  const postEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${BASE}/posts/${p.id}/`,
    lastModified: new Date(p.bumpedAt ?? p.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const userEntries: MetadataRoute.Sitemap = users.map((u) => ({
    url: `${BASE}/users/${u.id}/`,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  const dacDinhEntries: MetadataRoute.Sitemap = CHAPTERS.map((c) => ({
    url: `${BASE}/dac-dinh/on-tap/${c.id}/`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Trang khu vực + danh mục: chỉ nhóm đủ ngưỡng bài (xem lib/areas.ts), tự mở rộng theo dữ liệu.
  const areaEntries: MetadataRoute.Sitemap = eligibleProvinces(areaIndex).flatMap((a) => [
    {
      url: `${BASE}/khu-vuc/${a.slug}/`,
      lastModified: newestDate(a.posts),
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    ...eligibleCategories(a).map((c) => ({
      url: `${BASE}/khu-vuc/${a.slug}/${AREA_CATEGORIES[c.key].slug}/`,
      lastModified: newestDate(a.byCategory[c.key]),
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ]);

  return [...staticEntries, ...areaEntries, ...postEntries, ...userEntries, ...dacDinhEntries];
}
