"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PostCard } from "@/components/PostCard";
import { PostCardSkeleton } from "@/components/PostCardSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { useAuth } from "@/components/AuthProvider";
import { authFetch } from "@/lib/auth";
import { Post } from "@/lib/api";

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [fetchError, setFetchError] = useState(false);

  const refetch = () => {
    if (!user) return;
    setFetchError(false);
    setPosts(null);
    authFetch(`/favorite/${user.id}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        const list: Post[] = (Array.isArray(data) ? data : data.data ?? [])
          .map((f: any) => f.post ?? f)
          .filter(Boolean);
        setPosts(list);
      })
      .catch(() => setFetchError(true));
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login/?next=/favorites/");
      return;
    }

    let cancelled = false;
    setFetchError(false);
    authFetch(`/favorite/${user.id}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (cancelled) return;
        const list: Post[] = (Array.isArray(data) ? data : data.data ?? [])
          .map((f: any) => f.post ?? f)
          .filter(Boolean);
        setPosts(list);
      })
      .catch(() => !cancelled && setFetchError(true));
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router]);

  return (
    <>
      <Header />

      <section className="bg-gradient-warm border-b border-ink-200/50">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-ink-900 tracking-tight mb-2">
            ❤️ Bài đã lưu
          </h1>
          <p className="text-ink-600">
            {posts ? `${posts.length} bài bạn đã thêm vào yêu thích` : "Đang tải..."}
          </p>
        </div>
      </section>

      <section className="py-8 max-w-7xl mx-auto px-4">
        {fetchError ? (
          <ErrorState
            title="Không tải được bài đã lưu"
            description="Mạng yếu hoặc server tạm gián đoạn. Thử lại nhé."
            onRetry={refetch}
          />
        ) : authLoading || posts === null ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <PostCardSkeleton key={i} />)}
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            emoji="💔"
            title="Chưa lưu bài nào"
            description="Bấm icon trái tim ❤️ ở bài đăng để lưu lại cho lần sau xem."
            cta={{ href: "/posts/", label: "Khám phá bài đăng" }}
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {posts.map((p) => <PostCard key={p.id} post={p} />)}
          </div>
        )}
      </section>

      <Footer />
    </>
  );
}
