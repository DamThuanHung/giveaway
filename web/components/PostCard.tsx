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

        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
          {isVip && (
            <span className="px-2 py-0.5 rounded-sm text-[11px] font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 shadow-soft">
              ⭐ VIP
            </span>
          )}
          {isPlus && !isVip && (
            <span className="px-2 py-0.5 rounded-sm text-[11px] font-bold text-white bg-blue-500 shadow-soft">
              PLUS
            </span>
          )}
          {isFree && (
            <span className="px-2 py-0.5 rounded-sm text-[11px] font-bold text-white bg-primary shadow-soft">
              🎁 Tặng
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
