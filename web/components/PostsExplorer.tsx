"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PostCard } from "@/components/PostCard";
import { PostCardSkeleton } from "@/components/PostCardSkeleton";
import {
  Post,
  PostsResponse,
  fetchPosts,
  CATEGORIES,
  TOP_PROVINCES,
  PostsQuery,
} from "@/lib/api";

type Props = {
  initialData: PostsResponse | null;
  initialQuery: PostsQuery;
};

const SORT_OPTIONS = [
  { v: "newest", l: "Mới nhất" },
  { v: "price_asc", l: "Giá thấp → cao" },
  { v: "price_desc", l: "Giá cao → thấp" },
] as const;

const LISTING_TYPES = [
  { v: "", l: "Tất cả" },
  { v: "sell", l: "Đang bán" },
  { v: "give", l: "Cho tặng" },
];

// Khoảng giá phổ biến cho thị trường đồ cũ VN — chip nhanh cho 90% use case.
const PRICE_RANGES: { label: string; min?: number; max?: number }[] = [
  { label: "🎁 Miễn phí", max: 0 },
  { label: "< 100k", max: 100_000 },
  { label: "100k – 500k", min: 100_000, max: 500_000 },
  { label: "500k – 2 triệu", min: 500_000, max: 2_000_000 },
  { label: "2 – 10 triệu", min: 2_000_000, max: 10_000_000 },
  { label: "> 10 triệu", min: 10_000_000 },
];

function formatPriceShort(n: number): string {
  if (n === 0) return "0đ";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}tr`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return `${n}đ`;
}

function parsePriceInput(s: string): number | undefined {
  const digits = s.replace(/\D/g, "");
  if (!digits) return undefined;
  return parseInt(digits, 10);
}

export function PostsExplorer({ initialData, initialQuery }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [posts, setPosts] = useState<Post[]>(initialData?.data ?? []);
  const [meta, setMeta] = useState(initialData?.meta ?? { page: 1, limit: 24, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(initialQuery.search ?? "");
  const [showFilters, setShowFilters] = useState(false);

  // Đọc current query từ URL params
  const minParam = searchParams.get("min");
  const maxParam = searchParams.get("max");
  const query: PostsQuery = {
    page: 1,
    limit: 24,
    search: searchParams.get("q") || undefined,
    itemCategory: searchParams.get("cat") || undefined,
    province: searchParams.get("province") || undefined,
    listingType: searchParams.get("type") || undefined,
    sortBy: (searchParams.get("sort") as any) || "newest",
    minPrice: minParam != null ? Number(minParam) : undefined,
    maxPrice: maxParam != null ? Number(maxParam) : undefined,
  };

  const [minInput, setMinInput] = useState<string>(minParam ?? "");
  const [maxInput, setMaxInput] = useState<string>(maxParam ?? "");

  // Khi URL thay đổi → fetch lại
  useEffect(() => {
    let cancelled = false;
    const isInitialMatch =
      query.search === initialQuery.search &&
      query.itemCategory === initialQuery.itemCategory &&
      query.province === initialQuery.province &&
      query.listingType === initialQuery.listingType &&
      query.sortBy === initialQuery.sortBy &&
      query.minPrice === initialQuery.minPrice &&
      query.maxPrice === initialQuery.maxPrice;

    if (isInitialMatch && initialData) {
      setPosts(initialData.data);
      setMeta(initialData.meta);
      return;
    }

    setLoading(true);
    fetchPosts(query)
      .then((res) => {
        if (cancelled) return;
        setPosts(res.data);
        setMeta(res.meta);
      })
      .catch(() => !cancelled && setPosts([]))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  function updateQuery(patch: Record<string, string | undefined>) {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (!v) sp.delete(k);
      else sp.set(k, v);
    }
    startTransition(() => {
      router.push(`/posts/?${sp.toString()}`, { scroll: false });
    });
  }

  function onSubmitSearch(e: React.FormEvent) {
    e.preventDefault();
    updateQuery({ q: searchInput.trim() || undefined });
  }

  function clearAll() {
    setSearchInput("");
    setMinInput("");
    setMaxInput("");
    router.push("/posts/", { scroll: false });
  }

  function applyPriceRange(min?: number, max?: number) {
    setMinInput(min != null ? String(min) : "");
    setMaxInput(max != null ? String(max) : "");
    updateQuery({
      min: min != null ? String(min) : undefined,
      max: max != null ? String(max) : undefined,
    });
  }

  function applyCustomPrice() {
    const min = parsePriceInput(minInput);
    const max = parsePriceInput(maxInput);
    if (min != null && max != null && min > max) {
      alert("Giá tối thiểu phải nhỏ hơn giá tối đa");
      return;
    }
    applyPriceRange(min, max);
  }

  function rangeMatches(r: { min?: number; max?: number }): boolean {
    return r.min === query.minPrice && r.max === query.maxPrice;
  }

  async function loadMore() {
    if (loadingMore || meta.page >= meta.totalPages) return;
    setLoadingMore(true);
    try {
      const res = await fetchPosts({ ...query, page: meta.page + 1 });
      setPosts((prev) => [...prev, ...res.data]);
      setMeta(res.meta);
    } finally {
      setLoadingMore(false);
    }
  }

  const hasFilters =
    query.search ||
    query.itemCategory ||
    query.province ||
    query.listingType ||
    query.minPrice != null ||
    query.maxPrice != null;

  return (
    <div className="grid md:grid-cols-[260px_1fr] gap-6">
      {/* Filter sidebar — mobile drawer hoặc desktop sidebar */}
      <aside
        className={`${showFilters ? "fixed inset-0 z-50 bg-white p-5 overflow-y-auto" : "hidden"} md:relative md:inset-auto md:z-auto md:p-0 md:bg-transparent md:block`}
      >
        <div className="md:sticky md:top-20">
          <div className="flex items-center justify-between mb-4 md:hidden">
            <h2 className="text-lg font-bold text-navy">Bộ lọc</h2>
            <button onClick={() => setShowFilters(false)} className="text-gray-500 text-2xl">×</button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
            <h3 className="font-bold text-navy text-sm mb-3">Hình thức</h3>
            <div className="space-y-1.5">
              {LISTING_TYPES.map(({ v, l }) => (
                <button
                  key={v || "all"}
                  onClick={() => updateQuery({ type: v || undefined })}
                  className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition ${(query.listingType || "") === v ? "bg-primary text-white font-semibold" : "hover:bg-gray-50 text-gray-700"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
            <h3 className="font-bold text-navy text-sm mb-3">Danh mục</h3>
            <ul className="space-y-1 max-h-72 overflow-y-auto pr-1">
              <li>
                <button
                  onClick={() => updateQuery({ cat: undefined })}
                  className={`block w-full text-left px-2 py-1.5 rounded text-sm transition ${!query.itemCategory ? "bg-primary-light text-primary-dark font-semibold" : "hover:bg-gray-50 text-gray-700"}`}
                >
                  Tất cả danh mục
                </button>
              </li>
              {Object.entries(CATEGORIES).map(([k, l]) => (
                <li key={k}>
                  <button
                    onClick={() => updateQuery({ cat: k })}
                    className={`block w-full text-left px-2 py-1.5 rounded text-sm transition ${query.itemCategory === k ? "bg-primary-light text-primary-dark font-semibold" : "hover:bg-gray-50 text-gray-700"}`}
                  >
                    {l}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
            <h3 className="font-bold text-navy text-sm mb-3">Khoảng giá</h3>
            <div className="space-y-1.5 mb-3">
              <button
                onClick={() => applyPriceRange(undefined, undefined)}
                className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm transition ${query.minPrice == null && query.maxPrice == null ? "bg-primary text-white font-semibold" : "hover:bg-gray-50 text-gray-700"}`}
              >
                Tất cả
              </button>
              {PRICE_RANGES.map((r) => (
                <button
                  key={r.label}
                  onClick={() => applyPriceRange(r.min, r.max)}
                  className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm transition ${rangeMatches(r) ? "bg-primary text-white font-semibold" : "hover:bg-gray-50 text-gray-700"}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs text-gray-500 mb-2">Hoặc tùy chỉnh (VNĐ):</p>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={minInput}
                  onChange={(e) => setMinInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="Tối thiểu"
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:border-primary"
                />
                <span className="text-gray-400 text-xs">→</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={maxInput}
                  onChange={(e) => setMaxInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="Tối đa"
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:border-primary"
                />
              </div>
              <button
                onClick={applyCustomPrice}
                className="w-full bg-primary-light hover:bg-emerald-100 text-primary-dark font-semibold py-1.5 rounded-md text-xs"
              >
                Áp dụng
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
            <h3 className="font-bold text-navy text-sm mb-3">Tỉnh/Thành</h3>
            <select
              value={query.province ?? ""}
              onChange={(e) => updateQuery({ province: e.target.value || undefined })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
            >
              <option value="">Tất cả</option>
              {TOP_PROVINCES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {hasFilters && (
            <button
              onClick={clearAll}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg transition text-sm"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </aside>

      <div>
        {/* Search + Sort + Mobile filter trigger */}
        <div className="bg-white border border-gray-200 rounded-xl p-3 mb-4 flex flex-wrap gap-2 items-center">
          <form onSubmit={onSubmitSearch} className="flex-1 flex gap-2 min-w-[240px]">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo tên sản phẩm..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
            <button
              type="submit"
              className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap"
            >
              Tìm
            </button>
          </form>

          <select
            value={query.sortBy ?? "newest"}
            onChange={(e) => updateQuery({ sort: e.target.value === "newest" ? undefined : e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.v} value={s.v}>{s.l}</option>
            ))}
          </select>

          <button
            onClick={() => setShowFilters(true)}
            className="md:hidden border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium"
          >
            🎛 Bộ lọc
          </button>
        </div>

        {/* Active filters chips */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2 mb-4 text-sm">
            {query.search && (
              <span className="bg-primary-light text-primary-dark px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
                Tìm: "{query.search}"
                <button onClick={() => { setSearchInput(""); updateQuery({ q: undefined }); }} className="hover:text-primary">×</button>
              </span>
            )}
            {query.itemCategory && (
              <span className="bg-primary-light text-primary-dark px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
                {CATEGORIES[query.itemCategory]}
                <button onClick={() => updateQuery({ cat: undefined })} className="hover:text-primary">×</button>
              </span>
            )}
            {query.province && (
              <span className="bg-primary-light text-primary-dark px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
                📍 {query.province}
                <button onClick={() => updateQuery({ province: undefined })} className="hover:text-primary">×</button>
              </span>
            )}
            {query.listingType && (
              <span className="bg-primary-light text-primary-dark px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
                {query.listingType === "give" ? "🎁 Cho tặng" : "💰 Đang bán"}
                <button onClick={() => updateQuery({ type: undefined })} className="hover:text-primary">×</button>
              </span>
            )}
            {(query.minPrice != null || query.maxPrice != null) && (
              <span className="bg-primary-light text-primary-dark px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
                💰{" "}
                {query.minPrice != null && query.maxPrice != null
                  ? `${formatPriceShort(query.minPrice)} – ${formatPriceShort(query.maxPrice)}`
                  : query.minPrice != null
                  ? `≥ ${formatPriceShort(query.minPrice)}`
                  : `≤ ${formatPriceShort(query.maxPrice!)}`}
                <button onClick={() => applyPriceRange(undefined, undefined)} className="hover:text-primary">×</button>
              </span>
            )}
          </div>
        )}

        {/* Result count */}
        <div className="text-sm text-gray-600 mb-4">
          {loading ? (
            "Đang tải..."
          ) : meta.total === 0 ? (
            "Không tìm thấy bài đăng phù hợp"
          ) : (
            <>Tìm thấy <strong>{meta.total.toLocaleString("vi-VN")}</strong> bài đăng</>
          )}
        </div>

        {/* Posts grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <PostCardSkeleton key={i} />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-700 font-semibold mb-1">Chưa có kết quả</p>
            <p className="text-gray-500 text-sm">Thử bộ lọc khác hoặc từ khóa khác</p>
            {hasFilters && (
              <button
                onClick={clearAll}
                className="mt-4 bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-lg text-sm font-semibold"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {posts.map((p) => <PostCard key={p.id} post={p} />)}
            </div>

            {/* Pagination */}
            {meta.page < meta.totalPages && (
              <div className="text-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="bg-white hover:bg-primary hover:text-white border border-gray-300 hover:border-primary text-gray-700 font-semibold px-8 py-3 rounded-xl transition disabled:opacity-50"
                >
                  {loadingMore ? "Đang tải..." : `Xem thêm (${meta.total - posts.length} bài còn)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
