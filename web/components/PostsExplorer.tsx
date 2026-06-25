"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PostCard } from "@/components/PostCard";
import { PostCardSkeleton } from "@/components/PostCardSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
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

const PRICE_RANGES: { label: string; min?: number; max?: number }[] = [
  { label: "< 100k", max: 100_000 },
  { label: "100k–500k", min: 100_000, max: 500_000 },
  { label: "500k–2tr", min: 500_000, max: 2_000_000 },
  { label: "2–10tr", min: 2_000_000, max: 10_000_000 },
  { label: "> 10tr", min: 10_000_000 },
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
  const [fetchError, setFetchError] = useState(false);
  const [, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(initialQuery.search ?? "");
  const [showFilters, setShowFilters] = useState(false);

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

  const refetch = () => {
    setFetchError(false);
    setLoading(true);
    fetchPosts(query)
      .then((res) => {
        setPosts(res.data);
        setMeta(res.meta);
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    setFetchError(false);
    setLoading(true);
    fetchPosts(query)
      .then((res) => {
        if (cancelled) return;
        setPosts(res.data);
        setMeta(res.meta);
      })
      .catch(() => !cancelled && setFetchError(true))
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

  // "Miễn phí" là listingType=give, không phải price<=0 — bài bán để giá
  // trống (thương lượng) cũng có price=0 nhưng không phải hàng cho tặng.
  // Xóa min/max cũ vì give luôn có price=0, để lại minPrice>0 sẽ làm rỗng kết quả.
  function applyFreeFilter() {
    setMinInput("");
    setMaxInput("");
    updateQuery({ type: "give", min: undefined, max: undefined });
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

  // ─── Sidebar content (1 panel với 4 section, divider mờ thay border riêng) ───
  const sidebar = (
    <div className="md:sticky md:top-20 space-y-3">
      <div className="bg-white border border-ink-200/70 rounded-md shadow-soft overflow-hidden">
        {/* Hình thức */}
        <div className="p-4">
          <h3 className="font-bold text-ink-900 text-sm mb-3 flex items-center gap-2">
            <span className="text-primary-600">●</span> Hình thức
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {LISTING_TYPES.map(({ v, l }) => (
              <button
                key={v || "all"}
                onClick={() => updateQuery({ type: v || undefined })}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition duration-150 ease-warm ${
                  (query.listingType || "") === v
                    ? "bg-primary text-white shadow-soft"
                    : "bg-ink-100 hover:bg-ink-200 text-ink-700"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-ink-200/50" />

        {/* Khoảng giá */}
        <div className="p-4">
          <h3 className="font-bold text-ink-900 text-sm mb-3 flex items-center gap-2">
            <span className="text-primary-600">●</span> Khoảng giá
          </h3>
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            <button
              onClick={() => applyPriceRange(undefined, undefined)}
              className={`col-span-2 px-3 py-1.5 rounded-md text-xs font-medium transition duration-150 ease-warm ${
                query.minPrice == null && query.maxPrice == null && query.listingType !== "give"
                  ? "bg-primary text-white shadow-soft"
                  : "bg-ink-100 hover:bg-ink-200 text-ink-700"
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={applyFreeFilter}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition duration-150 ease-warm ${
                query.listingType === "give"
                  ? "bg-primary text-white shadow-soft"
                  : "bg-ink-100 hover:bg-ink-200 text-ink-700"
              }`}
            >
              🎁 Miễn phí
            </button>
            {PRICE_RANGES.map((r) => (
              <button
                key={r.label}
                onClick={() => applyPriceRange(r.min, r.max)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition duration-150 ease-warm ${
                  rangeMatches(r)
                    ? "bg-primary text-white shadow-soft"
                    : "bg-ink-100 hover:bg-ink-200 text-ink-700"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <details className="group">
            <summary className="cursor-pointer text-xs text-ink-500 hover:text-primary-600 select-none transition-colors flex items-center gap-1">
              <span className="group-open:rotate-90 transition-transform duration-150">▸</span>
              Tùy chỉnh khoảng giá (VNĐ)
            </summary>
            <div className="mt-2.5 flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={minInput}
                onChange={(e) => setMinInput(e.target.value.replace(/\D/g, ""))}
                placeholder="Tối thiểu"
                className="w-full bg-cream-100 border border-ink-200 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary-200 transition"
              />
              <span className="text-ink-400 text-xs shrink-0">→</span>
              <input
                type="text"
                inputMode="numeric"
                value={maxInput}
                onChange={(e) => setMaxInput(e.target.value.replace(/\D/g, ""))}
                placeholder="Tối đa"
                className="w-full bg-cream-100 border border-ink-200 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary-200 transition"
              />
            </div>
            <button
              onClick={applyCustomPrice}
              className="mt-2 w-full bg-primary-100 hover:bg-primary-200 text-primary-800 font-semibold py-1.5 rounded-md text-xs transition duration-150 ease-warm"
            >
              Áp dụng
            </button>
          </details>
        </div>

        <div className="border-t border-ink-200/50" />

        {/* Tỉnh/Thành */}
        <div className="p-4">
          <h3 className="font-bold text-ink-900 text-sm mb-3 flex items-center gap-2">
            <span className="text-primary-600">●</span> Tỉnh / Thành
          </h3>
          <select
            value={query.province ?? ""}
            onChange={(e) => updateQuery({ province: e.target.value || undefined })}
            className="w-full bg-cream-100 border border-ink-200 hover:border-ink-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary-200 transition duration-250 ease-warm"
          >
            <option value="">Tất cả</option>
            {TOP_PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="border-t border-ink-200/50" />

        {/* Danh mục — collapsible */}
        <div className="p-4">
          <h3 className="font-bold text-ink-900 text-sm mb-3 flex items-center gap-2">
            <span className="text-primary-600">●</span> Danh mục
          </h3>
          <ul className="space-y-0.5 max-h-72 overflow-y-auto pr-1 scrollbar-warm">
            <li>
              <button
                onClick={() => updateQuery({ cat: undefined })}
                className={`block w-full text-left px-2.5 py-1.5 rounded text-sm transition duration-150 ease-warm ${
                  !query.itemCategory
                    ? "bg-primary-100 text-primary-800 font-semibold"
                    : "hover:bg-ink-100 text-ink-700"
                }`}
              >
                Tất cả danh mục
              </button>
            </li>
            {Object.entries(CATEGORIES).map(([k, l]) => (
              <li key={k}>
                <button
                  onClick={() => updateQuery({ cat: k })}
                  className={`block w-full text-left px-2.5 py-1.5 rounded text-sm transition duration-150 ease-warm ${
                    query.itemCategory === k
                      ? "bg-primary-100 text-primary-800 font-semibold"
                      : "hover:bg-ink-100 text-ink-700"
                  }`}
                >
                  {l}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {hasFilters && (
        <button
          onClick={clearAll}
          className="w-full bg-ink-100 hover:bg-ink-200 text-ink-700 font-medium py-2 rounded-md transition duration-150 ease-warm text-sm"
        >
          Xóa bộ lọc
        </button>
      )}
    </div>
  );

  return (
    <div className="grid md:grid-cols-[260px_1fr] gap-6">
      {/* Filter sidebar — desktop static, mobile drawer */}
      <aside
        className={`${showFilters ? "fixed inset-0 z-50 bg-cream p-5 overflow-y-auto" : "hidden"} md:relative md:inset-auto md:z-auto md:p-0 md:bg-transparent md:block`}
      >
        <div className="flex items-center justify-between mb-4 md:hidden">
          <h2 className="text-lg font-bold text-ink-900">Bộ lọc</h2>
          <button
            onClick={() => setShowFilters(false)}
            aria-label="Đóng bộ lọc"
            className="w-9 h-9 flex items-center justify-center rounded-md text-ink-500 hover:bg-ink-100 hover:text-ink-800 text-2xl leading-none transition"
          >×</button>
        </div>
        {sidebar}
      </aside>

      <div>
        {/* Search + Sort + Mobile filter trigger */}
        <div className="bg-white border border-ink-200/70 rounded-md shadow-soft p-3 mb-4 flex flex-wrap gap-2 items-center">
          <form onSubmit={onSubmitSearch} className="flex-1 flex gap-2 min-w-[240px]">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo tên sản phẩm..."
              className="flex-1 bg-cream-100 border border-ink-200 hover:border-ink-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary-200 transition duration-250 ease-warm"
            />
            <button
              type="submit"
              className="bg-primary hover:bg-primary-dark active:scale-[0.97] text-white px-4 py-2 rounded-md font-semibold text-sm whitespace-nowrap shadow-soft hover:shadow-card transition duration-250 ease-warm"
            >
              Tìm
            </button>
          </form>

          <select
            value={query.sortBy ?? "newest"}
            onChange={(e) => updateQuery({ sort: e.target.value === "newest" ? undefined : e.target.value })}
            className="bg-cream-100 border border-ink-200 hover:border-ink-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary-200 transition duration-250 ease-warm"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.v} value={s.v}>{s.l}</option>
            ))}
          </select>

          <button
            onClick={() => setShowFilters(true)}
            className="md:hidden bg-cream-100 border border-ink-200 hover:border-primary text-ink-700 hover:text-primary rounded-md px-3 py-2 text-sm font-medium transition duration-150 ease-warm"
          >
            🎛 Bộ lọc
          </button>
        </div>

        {/* Active filters chips */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2 mb-4 text-sm animate-fade-in">
            {query.search && (
              <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
                Tìm: "{query.search}"
                <button onClick={() => { setSearchInput(""); updateQuery({ q: undefined }); }} className="hover:text-primary-900 leading-none text-base">×</button>
              </span>
            )}
            {query.itemCategory && (
              <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
                {CATEGORIES[query.itemCategory]}
                <button onClick={() => updateQuery({ cat: undefined })} className="hover:text-primary-900 leading-none text-base">×</button>
              </span>
            )}
            {query.province && (
              <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
                📍 {query.province}
                <button onClick={() => updateQuery({ province: undefined })} className="hover:text-primary-900 leading-none text-base">×</button>
              </span>
            )}
            {query.listingType && (
              <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
                {query.listingType === "give" ? "🎁 Cho tặng" : "💰 Đang bán"}
                <button onClick={() => updateQuery({ type: undefined })} className="hover:text-primary-900 leading-none text-base">×</button>
              </span>
            )}
            {(query.minPrice != null || query.maxPrice != null) && (
              <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
                💰{" "}
                {query.minPrice != null && query.maxPrice != null
                  ? `${formatPriceShort(query.minPrice)} – ${formatPriceShort(query.maxPrice)}`
                  : query.minPrice != null
                  ? `≥ ${formatPriceShort(query.minPrice)}`
                  : `≤ ${formatPriceShort(query.maxPrice!)}`}
                <button onClick={() => applyPriceRange(undefined, undefined)} className="hover:text-primary-900 leading-none text-base">×</button>
              </span>
            )}
          </div>
        )}

        {/* Result count */}
        <div className="text-sm text-ink-500 mb-4">
          {loading ? (
            "Đang tải..."
          ) : meta.total === 0 ? (
            "Không tìm thấy bài đăng phù hợp"
          ) : (
            <>Tìm thấy <strong className="text-ink-800">{meta.total.toLocaleString("vi-VN")}</strong> bài đăng</>
          )}
        </div>

        {/* CTA floating button — đăng bài, fixed bottom-center */}
        {!loading && !fetchError && (
          <a
            href="/posts/new"
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-8 py-4 rounded-full text-white font-bold text-base whitespace-nowrap animate-bounce-soft"
            style={{
              background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
              boxShadow: "0 0 0 0 rgba(16,185,129,0.5), 0 8px 24px rgba(16,185,129,0.4)",
              animation: "pulse-glow 2s ease-in-out infinite",
            }}
          >
            <span className="text-lg">✨</span>
            Đăng bài ngay — miễn phí
          </a>
        )}
        <style>{`
          @keyframes pulse-glow {
            0%, 100% {
              box-shadow: 0 0 0 0 rgba(16,185,129,0.5), 0 8px 24px rgba(16,185,129,0.4);
              transform: translateX(-50%) scale(1);
            }
            50% {
              box-shadow: 0 0 0 10px rgba(16,185,129,0), 0 8px 32px rgba(16,185,129,0.5);
              transform: translateX(-50%) scale(1.04);
            }
          }
        `}</style>

        {/* Posts grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <PostCardSkeleton key={i} />)}
          </div>
        ) : fetchError ? (
          <ErrorState
            title="Không tải được danh sách bài đăng"
            description="Có thể do mạng yếu hoặc server tạm gián đoạn. Thử lại nhé."
            onRetry={refetch}
          />
        ) : posts.length === 0 ? (
          <EmptyState
            emoji="🔍"
            title={hasFilters ? "Chưa có kết quả phù hợp" : "Chưa có bài đăng nào"}
            description={
              hasFilters
                ? "Thử bộ lọc khác hoặc từ khóa khác."
                : "Hãy là người đầu tiên đăng bài trong khu vực này."
            }
            action={
              hasFilters ? (
                <button
                  onClick={clearAll}
                  className="bg-primary hover:bg-primary-dark active:scale-[0.97] text-white px-5 py-2 rounded-md text-sm font-semibold shadow-soft hover:shadow-card transition duration-250 ease-warm"
                >
                  Xóa bộ lọc
                </button>
              ) : undefined
            }
            cta={hasFilters ? undefined : { href: "/posts/new/", label: "Đăng bài ngay" }}
          />
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
                  className="bg-white hover:bg-primary hover:text-white border border-ink-200 hover:border-primary text-ink-700 font-semibold px-8 py-3 rounded-md shadow-soft hover:shadow-card transition duration-250 ease-warm disabled:opacity-50"
                >
                  {loadingMore ? "Đang tải..." : `Xem thêm (còn ${meta.total - posts.length} bài)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
