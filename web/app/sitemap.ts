import type { MetadataRoute } from "next";
import { fetchAllPostIds, fetchAllAuthorIds } from "@/lib/api";

const BASE = "https://traotay.com.vn";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, users] = await Promise.all([
    fetchAllPostIds().catch(() => []),
    fetchAllAuthorIds().catch(() => []),
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

  return [...staticEntries, ...postEntries, ...userEntries];
}
