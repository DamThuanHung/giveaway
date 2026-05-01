import type { MetadataRoute } from "next";
import { fetchAllPostIds } from "@/lib/api";

const BASE = "https://traotay.com.vn";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await fetchAllPostIds().catch(() => []);

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
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...postEntries];
}
