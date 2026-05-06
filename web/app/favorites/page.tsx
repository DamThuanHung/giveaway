"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PostCard } from "@/components/PostCard";
import { PostCardSkeleton } from "@/components/PostCardSkeleton";
import { useAuth } from "@/components/AuthProvider";
import { authFetch } from "@/lib/auth";
import { Post } from "@/lib/api";

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[] | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login/?next=/favorites/");
      return;
    }

    let cancelled = false;
    authFetch(`/favorite/${user.id}`)
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        if (cancelled) return;
        const list: Post[] = (Array.isArray(data) ? data : data.data ?? [])
          .map((f: any) => f.post ?? f)
          .filter(Boolean);
        setPosts(list);
      })
      .catch(() => !cancelled && setPosts([]));
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
        {authLoading || posts === null ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <PostCardSkeleton key={i} />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white border border-ink-200/70 rounded-md shadow-soft p-12 text-center max-w-xl mx-auto">
            <div className="text-6xl mb-4">💔</div>
            <h2 className="text-xl font-bold text-ink-900 mb-2">Chưa lưu bài nào</h2>
            <p className="text-ink-600 mb-6">
              Bấm icon trái tim ❤️ ở bài đăng để lưu lại cho lần sau xem.
            </p>
            <Link
              href="/posts/"
              className="inline-block bg-primary hover:bg-primary-dark text-white font-bold px-6 py-3 rounded-md shadow-soft hover:shadow-card transition duration-150 ease-warm"
            >
              Khám phá tin đăng
            </Link>
          </div>
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
