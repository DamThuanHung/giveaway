/**
 * Backend API client cho Next.js static export.
 * Fetch tại build time qua Server Components — output: 'export' tự pre-render
 * mọi page khi `next build`.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.traotay.com.vn";

export type Post = {
  id: string;
  title: string;
  description: string;
  price: number;
  province: string;
  district: string;
  ward: string;
  addressDetail: string;
  status: string;
  itemCategory: string;
  listingType: string;
  postType: string;
  imageLabel: string;
  images: string[];
  imageUrl?: string;
  createdAt: string;
  bumpedAt?: string | null;
  boostTier: number;
  viewCount: number;
  area?: number | null;
  bedrooms?: number | null;
  priceUnit?: string | null;
  author: { id: string; name: string | null; avatar: string | null };
};

export type PostsResponse = {
  data: Post[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

/// Fetch posts list. Cho static export: gọi tại build time.
/// Cap 200 posts/page để tránh build quá lâu — đủ cho trang chủ + SEO.
export async function fetchPosts(
  params: {
    page?: number;
    limit?: number;
    category?: string;
    province?: string;
    listingType?: string;
  } = {}
): Promise<PostsResponse> {
  const sp = new URLSearchParams();
  sp.set("page", String(params.page ?? 1));
  sp.set("limit", String(Math.min(params.limit ?? 50, 200)));
  if (params.category) sp.set("category", params.category);
  if (params.province) sp.set("province", params.province);
  if (params.listingType) sp.set("listingType", params.listingType);

  const res = await fetch(`${API_BASE}/post?${sp}`, {
    next: { revalidate: 60 }, // ISR-like: cache 60s khi dev mode
  });
  if (!res.ok) throw new Error(`Failed to fetch posts: HTTP ${res.status}`);
  return res.json();
}

export async function fetchPostById(id: string): Promise<Post | null> {
  const res = await fetch(`${API_BASE}/post/${id}`, {
    next: { revalidate: 60 },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch post ${id}: HTTP ${res.status}`);
  return res.json();
}

/// Fetch all posts cho generateStaticParams — pre-render mọi /posts/[id]/.
/// Cap 500 mới nhất để build không quá lâu khi scale.
export async function fetchAllPostIds(): Promise<{ id: string }[]> {
  const allIds: { id: string }[] = [];
  let page = 1;
  const LIMIT = 100;
  const MAX_POSTS = 500;
  while (allIds.length < MAX_POSTS) {
    const res = await fetchPosts({ page, limit: LIMIT });
    if (res.data.length === 0) break;
    allIds.push(...res.data.map((p) => ({ id: p.id })));
    if (page >= res.meta.totalPages) break;
    page++;
  }
  return allIds.slice(0, MAX_POSTS);
}

export function formatPrice(amount: number): string {
  if (amount === 0) return "Miễn phí";
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} tỷ`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} triệu`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}.000đ`;
  return `${amount.toLocaleString("vi-VN")}đ`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatLocation(p: Post): string {
  return [p.ward, p.province].filter(Boolean).join(", ");
}

export const CATEGORIES: Record<string, string> = {
  electronics: "Điện tử",
  furniture: "Nội thất",
  clothing: "Thời trang",
  kitchen: "Gia dụng",
  books: "Sách",
  toys: "Đồ chơi",
  sports: "Thể thao",
  vehicles: "Xe cộ",
  beauty: "Làm đẹp",
  pets: "Thú cưng",
  tools: "Đồ nghề",
  food: "Thực phẩm",
  baby: "Mẹ & Bé",
  music: "Nhạc cụ",
  realestate: "Bất động sản",
  service: "Rao dịch vụ",
  jobs: "Việc làm",
  other: "Khác",
};
