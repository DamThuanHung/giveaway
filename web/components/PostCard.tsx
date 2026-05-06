import Link from "next/link";
import { Post, formatPrice, formatLocation, CATEGORIES } from "@/lib/api";
import { FavoriteButton } from "./FavoriteButton";

export function PostCard({ post }: { post: Post }) {
  const isVip = post.boostTier === 3;
  const isPlus = post.boostTier === 2;
  const isFree = post.price === 0;

  return (
    <Link
      href={`/posts/${post.id}/`}
      className="group bg-white rounded-md border border-ink-200/70 hover:border-primary/60 hover:shadow-card transition duration-250 ease-warm overflow-hidden flex flex-col"
    >
      <div className="aspect-square relative bg-ink-100 overflow-hidden">
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

        <div className="absolute top-0 left-0 flex flex-col gap-1 items-start">
          {isVip && (
            <span
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold"
              style={{
                background: "linear-gradient(135deg, #2A2418 0%, #1A1A1A 100%)",
                color: "#F4D36A",
                letterSpacing: "0.5px",
                borderRadius: "0 10px 0 8px",
                borderLeft: "0.5px solid #C9A84A",
                borderBottom: "0.5px solid #C9A84A",
                boxShadow: "0 2px 6px rgba(201, 168, 74, 0.35)",
              }}
            >
              {/* Material icon: workspace_premium (huy chương) */}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M9.68 13.69L13 11.16l3.31 2.53-1.26-4.1L18.36 7l-4.09-.05L13 3l-1.27 3.95L7.64 7l3.31 2.59-1.27 4.1zM20 12l-1-9H9L7 7v14l6-3 6 3V12h1z"/>
              </svg>
              VIP
            </span>
          )}
          {isPlus && !isVip && (
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
              {/* Material icon: star_rounded */}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
              </svg>
              Plus
            </span>
          )}
          {isFree && (
            <span
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-white shadow-soft"
              style={{
                background: "#10B981",
                borderRadius: "0 10px 0 8px",
              }}
            >
              🎁 Miễn phí
            </span>
          )}
        </div>

        <div className="absolute top-2 right-2">
          <FavoriteButton postId={post.id} size="sm" />
        </div>
      </div>

      <div className="p-3 flex-1 flex flex-col">
        <h3 className="font-semibold text-sm line-clamp-2 mb-1.5 text-navy group-hover:text-primary transition-colors duration-150 ease-warm">
          {post.title}
        </h3>
        <div className="text-primary font-bold text-base mb-2">
          {formatPrice(post.price)}
        </div>
        <div className="mt-auto text-xs text-ink-500 flex items-center justify-between gap-2">
          <span className="truncate">📍 {formatLocation(post)}</span>
          <span className="shrink-0 text-ink-400">{CATEGORIES[post.itemCategory] || ""}</span>
        </div>
      </div>
    </Link>
  );
}
