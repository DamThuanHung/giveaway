/**
 * Trang theo khu vực + danh mục (/khu-vuc/<tinh>/ và /khu-vuc/<tinh>/<danh-muc>/) cho SEO địa phương.
 *
 * Dữ liệu `province` do người dùng nhập tay nên không thống nhất (DB prod 2026-11-11: "Bắc Ninh",
 * "Bắc ninh", "Băc ninh"...). Vì vậy gom nhóm theo SLUG đã bỏ dấu/hoa-thường, không so chuỗi thô.
 * Chỉ tạo trang khi nhóm có >= MIN_POSTS_PER_AREA bài, tránh trang mỏng bị Google đánh giá thấp.
 */
import { fetchPosts, Post, TOP_PROVINCES } from "./api";

export const MIN_POSTS_PER_AREA = 5;

/** "Bắc Ninh" → "bac-ninh" (bỏ dấu, đ→d, chữ thường, ký tự lạ → "-"). */
export function toSlug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const PROVINCE_PREFIX = /^(thanh-pho|tp|tinh)-/;

function provinceSlug(raw: string): string {
  return toSlug(raw).replace(PROVINCE_PREFIX, "");
}

/** slug → tên chuẩn, dựng từ danh sách 63 tỉnh/thành đang dùng ở form đăng bài. */
export const PROVINCE_BY_SLUG: Record<string, string> = Object.fromEntries(
  TOP_PROVINCES.map((name) => [provinceSlug(name), name]),
);

/** Trả về slug tỉnh chuẩn, hoặc null nếu giá trị nhập không phải tên tỉnh (vd "Phường Từ Sơn", rỗng). */
export function provinceKey(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const slug = provinceSlug(raw);
  return PROVINCE_BY_SLUG[slug] ? slug : null;
}

/** itemCategory → slug tiếng Việt cho URL + cách gọi cho SEO. Chỉ các nhóm đồ vật phổ thông. */
export const AREA_CATEGORIES: Record<string, { slug: string; name: string; seo: string }> = {
  clothing: { slug: "quan-ao", name: "Thời trang", seo: "Quần áo & thời trang" },
  electronics: { slug: "do-dien-tu", name: "Điện tử", seo: "Đồ điện tử" },
  furniture: { slug: "noi-that", name: "Nội thất", seo: "Nội thất" },
  kitchen: { slug: "do-gia-dung", name: "Gia dụng", seo: "Đồ gia dụng" },
  books: { slug: "sach", name: "Sách", seo: "Sách" },
  toys: { slug: "do-choi", name: "Đồ chơi", seo: "Đồ chơi" },
  sports: { slug: "the-thao", name: "Thể thao", seo: "Đồ thể thao" },
  vehicles: { slug: "xe-co", name: "Xe cộ", seo: "Xe cộ" },
  beauty: { slug: "lam-dep", name: "Làm đẹp", seo: "Đồ làm đẹp" },
  pets: { slug: "thu-cung", name: "Thú cưng", seo: "Đồ cho thú cưng" },
  tools: { slug: "do-nghe", name: "Đồ nghề", seo: "Đồ nghề" },
  baby: { slug: "me-va-be", name: "Mẹ & Bé", seo: "Đồ mẹ và bé" },
  music: { slug: "nhac-cu", name: "Nhạc cụ", seo: "Nhạc cụ" },
};

export const CATEGORY_KEY_BY_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(AREA_CATEGORIES).map(([key, v]) => [v.slug, key]),
);

/** Lấy mọi bài đang hiển thị (cap 2000 như fetchAllPostIds). */
export async function fetchAllPosts(): Promise<Post[]> {
  const all: Post[] = [];
  let page = 1;
  const LIMIT = 100;
  const MAX_POSTS = 2000;
  while (all.length < MAX_POSTS) {
    const res = await fetchPosts({ page, limit: LIMIT });
    if (res.data.length === 0) break;
    all.push(...res.data);
    if (page >= res.meta.totalPages) break;
    page++;
  }
  return all.slice(0, MAX_POSTS);
}

export type ProvinceArea = {
  slug: string;
  name: string;
  posts: Post[];
  byCategory: Record<string, Post[]>; // key = itemCategory (chỉ nhóm có trong AREA_CATEGORIES)
};

export type AreaIndex = Record<string, ProvinceArea>;

const byNewest = (a: Post, b: Post) =>
  new Date(b.bumpedAt ?? b.createdAt).getTime() - new Date(a.bumpedAt ?? a.createdAt).getTime();

/** Gom bài theo tỉnh (đã chuẩn hóa) và danh mục. Gồm cả nhóm chưa đủ ngưỡng — lọc ở nơi dùng. */
export async function buildAreaIndex(): Promise<AreaIndex> {
  const posts = await fetchAllPosts();
  const index: AreaIndex = {};
  for (const p of posts) {
    if (p.status !== "available") continue;
    const slug = provinceKey(p.province);
    if (!slug) continue;
    const area = (index[slug] ??= { slug, name: PROVINCE_BY_SLUG[slug], posts: [], byCategory: {} });
    area.posts.push(p);
    if (AREA_CATEGORIES[p.itemCategory]) (area.byCategory[p.itemCategory] ??= []).push(p);
  }
  for (const area of Object.values(index)) {
    area.posts.sort(byNewest);
    for (const list of Object.values(area.byCategory)) list.sort(byNewest);
  }
  return index;
}

/** Như buildAreaIndex nhưng API lỗi thì trả rỗng — dùng cho metadata/static params để không làm hỏng build. */
export async function loadAreaIndex(): Promise<AreaIndex> {
  return buildAreaIndex().catch(() => ({}));
}

/** Tỉnh đủ điều kiện có trang. */
export function eligibleProvinces(index: AreaIndex): ProvinceArea[] {
  return Object.values(index).filter((a) => a.posts.length >= MIN_POSTS_PER_AREA);
}

/** Danh mục (trong 1 tỉnh) đủ điều kiện có trang, nhiều bài nhất trước. */
export function eligibleCategories(area: ProvinceArea): { key: string; count: number }[] {
  return Object.entries(area.byCategory)
    .filter(([, list]) => list.length >= MIN_POSTS_PER_AREA)
    .map(([key, list]) => ({ key, count: list.length }))
    .sort((a, b) => b.count - a.count);
}

export function newestDate(posts: Post[]): Date {
  return new Date(Math.max(...posts.map((p) => new Date(p.bumpedAt ?? p.createdAt).getTime())));
}
