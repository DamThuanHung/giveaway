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

export default function MePage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[] | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login/?next=/me/");
      return;
    }
    authFetch("/post/my")
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        const list: Post[] = Array.isArray(data) ? data : data.data ?? [];
        setPosts(list);
      })
      .catch(() => setPosts([]));
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <>
        <Header />
        <div className="text-center py-20 text-gray-500">Đang tải...</div>
        <Footer />
      </>
    );
  }

  const initial = (user.name || user.email || "U").trim()[0].toUpperCase();
  const displayName = user.name || user.email?.split("@")[0] || "Bạn";

  return (
    <>
      <Header />

      <section className="bg-gradient-to-br from-primary-light to-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center gap-5 flex-wrap">
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar}
                alt={user.name || ""}
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-emerald-500 text-white text-3xl font-bold flex items-center justify-center shadow-md">
                {initial}
              </div>
            )}
            <div className="flex-1 min-w-[200px]">
              <h1 className="text-2xl md:text-3xl font-extrabold text-navy">
                {displayName}
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                {user.email && <span>📧 {user.email}</span>}
                {user.phone && <span className="ml-3">📞 {user.phone}</span>}
              </p>
              <div className="flex gap-2 mt-3 flex-wrap">
                <Link
                  href={`/users/${user.id}/`}
                  className="bg-white border border-gray-300 hover:border-primary text-navy text-sm font-semibold px-4 py-2 rounded-lg"
                >
                  Xem hồ sơ công khai
                </Link>
                <Link
                  href="/favorites/"
                  className="bg-white border border-gray-300 hover:border-primary text-navy text-sm font-semibold px-4 py-2 rounded-lg"
                >
                  ❤️ Bài đã lưu
                </Link>
                <button
                  onClick={() => {
                    logout();
                    router.push("/");
                  }}
                  className="bg-white border border-red-200 hover:border-red-400 text-red-600 text-sm font-semibold px-4 py-2 rounded-lg"
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-extrabold text-navy">
            Tin đăng của bạn {posts ? `(${posts.length})` : ""}
          </h2>
          <a
            href="https://play.google.com/store/apps/details?id=vn.traotay.app"
            target="_blank"
            rel="noopener"
            className="bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-2 rounded-lg"
          >
            + Đăng bài (qua app)
          </a>
        </div>

        {posts === null ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <PostCardSkeleton key={i} />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-gray-700 font-semibold mb-1">Bạn chưa đăng bài nào</p>
            <p className="text-gray-500 text-sm mb-5">
              Đăng bài qua app Trao Tay — nhanh, miễn phí, hỗ trợ chụp ảnh + bản đồ
            </p>
            <a
              href="https://play.google.com/store/apps/details?id=vn.traotay.app"
              target="_blank"
              rel="noopener"
              className="inline-block bg-primary hover:bg-primary-dark text-white font-bold px-6 py-3 rounded-lg"
            >
              Tải app để đăng bài
            </a>
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
