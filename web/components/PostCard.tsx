import Link from "next/link";
import { Post, formatPrice, formatLocation, CATEGORIES } from "@/lib/api";
import { FavoriteButton } from "./FavoriteButton";

// Sparkles VIP — 6 ngôi sao với phase shift khác nhau, port từ mobile
// app/lib/widgets/post_card.dart:_SparklesOverlay
const SPARKLES = [
  { top: "12%", left: "18%", size: 12, delay: "0s" },
  { top: "55%", left: "72%", size: 11, delay: "-1s" },
  { top: "30%", left: "82%", size: 8, delay: "-2s" },
  { top: "75%", left: "28%", size: 10, delay: "-3s" },
  { top: "20%", left: "60%", size: 9, delay: "-4s" },
  { top: "65%", left: "50%", size: 13, delay: "-5s" },
];

function timeAgoShort(iso: string): string {
  const d = new Date(iso);
  const min = Math.round((Date.now() - d.getTime()) / 60000);
  if (min < 1) return "vừa xong";
  if (min < 60) return `${min}p`;
  if (min < 1440) return `${Math.floor(min / 60)}h`;
  const days = Math.floor(min / 1440);
  if (days < 30) return `${days}d`;
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

export function PostCard({ post }: { post: Post }) {
  const tier = post.boostTier || 0;
  const isVip = tier === 3;
  const isPlus = tier === 2;
  const isFree = post.price === 0 || post.listingType === "give";
  const isSold = post.status === "done";
  const isReserved = post.status === "reserved";
  const imageCount = post.images?.length ?? 0;

  // Card wrapper class theo tier — port từ mobile cardDeco
  const wrapClass = isVip
    ? "vip-card group block flex flex-col overflow-hidden"
    : isPlus
    ? "plus-card group block flex flex-col overflow-hidden"
    : "bg-white rounded-md border border-ink-200/70 hover:border-primary/60 hover:shadow-card transition duration-250 ease-warm group block flex flex-col overflow-hidden";

  return (
    <Link href={`/posts/${post.id}/`} className={wrapClass}>
      <div className="aspect-square relative bg-ink-100 overflow-hidden rounded-t-[10px]">
        {post.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-400 ease-warm"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-ink-400 text-4xl">
            📦
          </div>
        )}

        {/* Sold overlay: che ảnh khi đã bán/đã tặng */}
        {isSold && (
          <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
            <span className="bg-ink-700 text-white text-xs font-bold px-3 py-1.5 rounded-full">
              Đã bán / Đã tặng
            </span>
          </div>
        )}

        {/* Shimmer light sweep — chỉ VIP */}
        {isVip && !isSold && <div className="vip-shimmer" />}

        {/* Sparkles — chỉ VIP */}
        {isVip && !isSold && (
          <>
            {SPARKLES.map((s, i) => (
              <svg
                key={i}
                className="vip-sparkle"
                width={s.size}
                height={s.size}
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                style={{ top: s.top, left: s.left, animationDelay: s.delay }}
              >
                <path d="M12 2L14.39 8.42L21 9.27L16 13.97L17.18 20.74L12 17.27L6.82 20.74L8 13.97L3 9.27L9.61 8.42z" />
              </svg>
            ))}
          </>
        )}

        {/* Free badge — góc TRÊN TRÁI (theo mobile) */}
        {isFree && !isSold && (
          <span
            className="absolute top-0 left-0 inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-white"
            style={{
              background: "#10B981",
              borderRadius: "10px 0 8px 0", // top-left rounded để khớp ảnh, bottom-right
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35L12 4.02 11.5 3.34C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/>
            </svg>
            Miễn phí
          </span>
        )}

        {/* Boost badge — góc TRÊN PHẢI (theo mobile), ẩn khi sold/reserved */}
        {tier >= 2 && !isSold && !isReserved && (
          <div className="absolute top-0 right-0 z-10">
            {isVip ? (
              <span
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold"
                style={{
                  background: "linear-gradient(135deg, #2A2418 0%, #1A1A1A 100%)",
                  color: "#F4D36A",
                  letterSpacing: "0.5px",
                  borderRadius: "0 10px 0 8px",
                  borderLeft: "0.5px solid #C9A84A",
                  borderBottom: "0.5px solid #C9A84A",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M9.68 13.69L13 11.16l3.31 2.53-1.26-4.1L18.36 7l-4.09-.05L13 3l-1.27 3.95L7.64 7l3.31 2.59-1.27 4.1zM20 12l-1-9H9L7 7v14l6-3 6 3V12h1z"/>
                </svg>
                VIP
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold"
                style={{
                  background: "#FEF9E7",
                  color: "#854F0B",
                  borderRadius: "0 10px 0 8px",
                  borderLeft: "0.5px solid #C9A84A",
                  borderBottom: "0.5px solid #C9A84A",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                </svg>
                Plus
              </span>
            )}
          </div>
        )}

        {/* Reserved badge — chiếm chỗ boost badge (top-right) */}
        {isReserved && !isSold && (
          <span className="absolute top-1.5 right-1.5 z-10 inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold text-white bg-amber-500 rounded-md shadow-soft">
            Đang giữ
          </span>
        )}

        {/* Image badges (time ago + count) — góc DƯỚI TRÁI */}
        <div className="absolute bottom-1.5 left-1.5 flex gap-1 z-10">
          <span className="px-1.5 py-0.5 text-[10px] font-medium text-white bg-black/55 rounded-md">
            {timeAgoShort(post.createdAt)}
          </span>
          {imageCount > 1 && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium text-white bg-black/55 rounded-md">
              {imageCount} 🖼
            </span>
          )}
        </div>

        {/* Favorite button — góc DƯỚI PHẢI (theo mobile) */}
        <div className="absolute bottom-1 right-1 z-10">
          <FavoriteButton postId={post.id} size="sm" />
        </div>
      </div>

      <div className="p-3 flex-1 flex flex-col">
        <h3 className="font-semibold text-sm line-clamp-2 mb-1.5 text-navy group-hover:text-primary transition-colors duration-150 ease-warm">
          {post.title}
        </h3>
        <div
          className={`font-bold text-base mb-2 ${
            isFree ? "text-primary-600" : "text-red-600"
          }`}
        >
          {isFree ? "Miễn phí" : formatPrice(post.price)}
        </div>
        <div className="mt-auto text-xs text-ink-500 flex items-center justify-between gap-2">
          <span className="truncate">📍 {formatLocation(post)}</span>
          <span className="shrink-0 text-ink-400">{CATEGORIES[post.itemCategory] || ""}</span>
        </div>
      </div>
    </Link>
  );
}
