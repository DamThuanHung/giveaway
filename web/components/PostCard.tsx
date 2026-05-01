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
      className="group bg-white rounded-xl border border-gray-200 hover:border-primary hover:shadow-md transition overflow-hidden flex flex-col"
    >
      <div className="aspect-square relative bg-gray-100">
        {post.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
            📦
          </div>
        )}
        {(isVip || isPlus) && (
          <span className={`absolute top-2 left-2 px-2 py-1 rounded-md text-xs font-bold text-white ${isVip ? "bg-gradient-to-r from-amber-500 to-amber-600" : "bg-blue-500"}`}>
            {isVip ? "⭐ VIP" : "PLUS"}
          </span>
        )}
        {isFree && (
          <span className="absolute top-2 left-2 px-2 py-1 rounded-md text-xs font-bold bg-primary text-white" style={{ marginTop: isVip || isPlus ? "30px" : "0" }}>
            🎁 Tặng
          </span>
        )}
        <div className="absolute top-2 right-2">
          <FavoriteButton postId={post.id} size="sm" />
        </div>
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="font-semibold text-sm line-clamp-2 mb-1 text-navy group-hover:text-primary">
          {post.title}
        </h3>
        <div className="text-primary font-bold text-base mb-2">
          {formatPrice(post.price)}
        </div>
        <div className="mt-auto text-xs text-gray-500 flex items-center justify-between gap-2">
          <span className="truncate">📍 {formatLocation(post)}</span>
          <span className="shrink-0">{CATEGORIES[post.itemCategory] || ""}</span>
        </div>
      </div>
    </Link>
  );
}
