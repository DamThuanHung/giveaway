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
  latitude: number;
  longitude: number;
  author: { id: string; name: string | null; avatar: string | null };
};

export type PostsResponse = {
  data: Post[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export type PostsQuery = {
  page?: number;
  limit?: number;
  search?: string;
  itemCategory?: string;
  province?: string;
  listingType?: string; // sell | give
  postType?: string; // item | realestate | service
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "newest" | "price_asc" | "price_desc";
};

export function buildPostsQuery(q: PostsQuery): URLSearchParams {
  const sp = new URLSearchParams();
  sp.set("page", String(q.page ?? 1));
  sp.set("limit", String(Math.min(q.limit ?? 24, 50)));
  if (q.search) sp.set("search", q.search);
  if (q.itemCategory) sp.set("itemCategory", q.itemCategory);
  if (q.province) sp.set("province", q.province);
  if (q.listingType) sp.set("listingType", q.listingType);
  if (q.postType) sp.set("postType", q.postType);
  if (q.minPrice != null) sp.set("minPrice", String(q.minPrice));
  if (q.maxPrice != null) sp.set("maxPrice", String(q.maxPrice));
  if (q.sortBy) sp.set("sortBy", q.sortBy);
  return sp;
}

/// Fetch posts list. Hỗ trợ search + filter + sort qua backend.
/// Build time: pre-render trang chủ + /posts. Runtime client: search/filter động.
export async function fetchPosts(query: PostsQuery = {}): Promise<PostsResponse> {
  const sp = buildPostsQuery(query);
  const res = await fetch(`${API_BASE}/post?${sp}`, { next: { revalidate: 60 } });
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
/// Cap 2000 mới nhất để cover gần như mọi bài active. Build vẫn <2 phút.
/// Cron auto-rebuild mỗi giờ phủ user/post mới.
export async function fetchAllPostIds(): Promise<{ id: string; updatedAt: string; bumpedAt?: string | null }[]> {
  const allIds: { id: string; updatedAt: string; bumpedAt?: string | null }[] = [];
  let page = 1;
  const LIMIT = 100;
  const MAX_POSTS = 2000;
  while (allIds.length < MAX_POSTS) {
    const res = await fetchPosts({ page, limit: LIMIT });
    if (res.data.length === 0) break;
    allIds.push(...res.data.map((p) => ({ id: p.id, updatedAt: p.createdAt, bumpedAt: p.bumpedAt })));
    if (page >= res.meta.totalPages) break;
    page++;
  }
  return allIds.slice(0, MAX_POSTS);
}

/// Fetch unique author IDs từ posts để pre-render /users/[id]/.
/// Cap 2000 user — cover tất cả author đã đăng bài trong DB hiện tại + buffer.
export async function fetchAllAuthorIds(): Promise<{ id: string }[]> {
  const seen = new Set<string>();
  let page = 1;
  const LIMIT = 100;
  const MAX_AUTHORS = 2000;
  while (seen.size < MAX_AUTHORS) {
    const res = await fetchPosts({ page, limit: LIMIT });
    if (res.data.length === 0) break;
    for (const p of res.data) {
      if (p.author?.id) seen.add(p.author.id);
    }
    if (page >= res.meta.totalPages) break;
    page++;
  }
  return Array.from(seen).slice(0, MAX_AUTHORS).map((id) => ({ id }));
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

// User profile API
export type PublicUser = {
  id: string;
  name: string | null;
  avatar: string | null;
  role: string;
  createdAt: string;
  isPhoneVerified: boolean;
  _count: { posts: number; postsCompletedWith: number; reviewsReceived: number };
  completedTransactions: number;
};

export async function fetchUserById(id: string): Promise<PublicUser | null> {
  const res = await fetch(`${API_BASE}/user/${id}`, { next: { revalidate: 60 } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchUserPosts(userId: string): Promise<Post[]> {
  const res = await fetch(`${API_BASE}/post/user/${userId}`, { next: { revalidate: 60 } });
  if (!res.ok) return [];
  const data = await res.json();
  // /post/user/:id trả mảng trực tiếp, không có meta
  return Array.isArray(data) ? data : (data.data ?? []);
}

export type Review = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: { id: string; name: string | null; avatar: string | null };
};

export async function fetchUserReviews(userId: string): Promise<Review[]> {
  const res = await fetch(`${API_BASE}/review/user/${userId}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : (data.data ?? []);
}

// 10 tỉnh/thành lớn nhất + một số đặc trưng — dùng cho filter dropdown.
// Backend filter province match exact string nên phải copy đúng từ data thật.
export const TOP_PROVINCES = [
  "Hà Nội",
  "TP. Hồ Chí Minh",
  "Đà Nẵng",
  "Hải Phòng",
  "Cần Thơ",
  "Bình Dương",
  "Đồng Nai",
  "Bắc Ninh",
  "Quảng Ninh",
  "Khánh Hòa",
];

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
