"use client";

import { useEffect, useState } from "react";
import { Post, fetchPosts } from "@/lib/api";
import { PostCard } from "./PostCard";
import { PostCardSkeleton } from "./PostCardSkeleton";

type Props = {
  initial: Post[];
  limit?: number;
};

/// Refresh featured posts realtime — initial data từ server-render (SEO+first paint),
/// sau đó client mount fetch fresh để bài admin xóa biến mất ngay (không đợi cron rebuild).
export function FreshFeaturedPosts({ initial, limit = 8 }: Props) {
  const [posts, setPosts] = useState<Post[]>(initial);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPosts({ page: 1, limit })
      .then((res) => {
        if (cancelled) return;
        setPosts(res.data);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [limit]);

  if (posts.length === 0 && loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: limit }).map((_, i) => (
          <PostCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {posts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
    </div>
  );
}
