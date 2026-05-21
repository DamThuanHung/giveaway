"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PostCard } from "@/components/PostCard";
import { PostCardSkeleton } from "@/components/PostCardSkeleton";
import { useAuth } from "@/components/AuthProvider";
import { authFetch, updateMyName, uploadAvatarFile } from "@/lib/auth";
import { Post } from "@/lib/api";

export default function MePage() {
  const { user, loading: authLoading, logout, refresh } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[] | null>(null);

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarErr, setAvatarErr] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login/?next=/me/");
      return;
    }
    setNameInput(user.name || "");
    authFetch("/post/my")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const list: Post[] = Array.isArray(data) ? data : data.data ?? [];
        setPosts(list);
      })
      .catch(() => setPosts([]));
  }, [user, authLoading, router]);

  async function saveName() {
    if (!user) return;
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed === user.name) {
      setEditingName(false);
      return;
    }
    if (trimmed.length > 50) {
      alert("Tên tối đa 50 ký tự");
      return;
    }
    setSavingName(true);
    const updated = await updateMyName(user.id, trimmed);
    setSavingName(false);
    if (updated) {
      await refresh();
      setEditingName(false);
    } else {
      alert("Không cập nhật được, thử lại");
    }
  }

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setAvatarErr("Ảnh tối đa 5MB");
      return;
    }
    if (!/^image\/(png|jpeg|jpg|webp|gif)$/.test(file.type)) {
      setAvatarErr("Chỉ chấp nhận ảnh PNG/JPG/WebP/GIF");
      return;
    }
    setAvatarErr(null);
    setUploadingAvatar(true);
    const newUrl = await uploadAvatarFile(file);
    setUploadingAvatar(false);
    if (newUrl) {
      await refresh();
    } else {
      setAvatarErr("Upload thất bại, thử lại");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  if (authLoading || !user) {
    return (
      <>
        <Header />
        <div className="text-center py-20 text-ink-500">Đang tải...</div>
        <Footer />
      </>
    );
  }

  const initial = (user.name || user.email || "U").trim()[0].toUpperCase();
  const displayName = user.name || user.email?.split("@")[0] || "Bạn";

  return (
    <>
      <Header />

      <section className="bg-gradient-warm border-b border-ink-200/50">
        <div className="max-w-5xl mx-auto px-4 py-8 md:py-10">
          <div className="flex items-start gap-5 flex-wrap">
            <div className="relative shrink-0">
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar}
                  alt={user.name || ""}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-card"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-emerald-500 text-white text-4xl font-bold flex items-center justify-center shadow-card border-4 border-white">
                  {initial}
                </div>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 bg-primary hover:bg-primary-dark active:scale-[0.97] text-white w-9 h-9 rounded-full shadow-card flex items-center justify-center text-sm transition duration-150 ease-warm disabled:opacity-50"
                aria-label="Đổi ảnh đại diện"
              >
                {uploadingAvatar ? "…" : "📷"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={onAvatarChange}
                className="hidden"
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              {editingName ? (
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    maxLength={50}
                    autoFocus
                    className="bg-white border border-ink-200 rounded-md px-3 py-1.5 text-xl font-bold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-200 transition"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveName();
                      if (e.key === "Escape") {
                        setNameInput(user.name || "");
                        setEditingName(false);
                      }
                    }}
                  />
                  <button
                    onClick={saveName}
                    disabled={savingName}
                    className="bg-primary hover:bg-primary-dark active:scale-[0.97] text-white text-sm font-semibold px-3 py-1.5 rounded-md shadow-soft hover:shadow-card transition duration-150 ease-warm disabled:opacity-50"
                  >
                    {savingName ? "..." : "Lưu"}
                  </button>
                  <button
                    onClick={() => {
                      setNameInput(user.name || "");
                      setEditingName(false);
                    }}
                    className="text-ink-500 hover:text-ink-800 text-sm px-2 transition-colors duration-150"
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-ink-900 tracking-tight">
                    {displayName}
                  </h1>
                  <button
                    onClick={() => setEditingName(true)}
                    className="text-ink-400 hover:text-primary-600 text-sm font-medium transition-colors duration-150"
                    aria-label="Sửa tên"
                  >
                    ✏️ Sửa tên
                  </button>
                </div>
              )}
              <p className="text-ink-600 text-sm mt-1">
                {user.email && <span>📧 {user.email}</span>}
                {user.phone && <span className="ml-3">📞 {user.phone}</span>}
              </p>
              {avatarErr && (
                <p className="text-red-600 text-sm mt-2">{avatarErr}</p>
              )}
              <div className="flex gap-2 mt-3 flex-wrap">
                <Link
                  href={`/users/${user.id}/`}
                  className="bg-white border border-ink-200 hover:border-primary hover:text-primary text-ink-800 text-sm font-semibold px-4 py-2 rounded-md shadow-soft hover:shadow-card transition duration-150 ease-warm"
                >
                  Xem hồ sơ công khai
                </Link>
                <Link
                  href="/favorites/"
                  className="bg-white border border-ink-200 hover:border-primary hover:text-primary text-ink-800 text-sm font-semibold px-4 py-2 rounded-md shadow-soft hover:shadow-card transition duration-150 ease-warm"
                >
                  ❤️ Bài đã lưu
                </Link>
                <button
                  onClick={() => {
                    logout();
                    router.push("/");
                  }}
                  className="bg-white border border-red-200 hover:border-red-400 text-red-600 text-sm font-semibold px-4 py-2 rounded-md shadow-soft hover:shadow-card transition duration-150 ease-warm"
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 max-w-5xl mx-auto px-4">
        <h2 className="text-lg font-extrabold text-ink-900 mb-4 tracking-tight">⚙️ Quản lý tài khoản</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
          {[
            { href: "/me/posts/", icon: "📦", label: "Tin của tôi" },
            { href: "/notifications/", icon: "🔔", label: "Thông báo" },
            { href: "/me/reviews/", icon: "⭐", label: "Đánh giá đã viết" },
            { href: "/me/stats/", icon: "📊", label: "Thống kê" },
            { href: "/me/keywords/", icon: "🔔", label: "Cảnh báo từ khóa" },
            { href: "/me/blocked/", icon: "🚫", label: "Đã chặn" },
            { href: "/me/security/", icon: "🔐", label: "Bảo mật" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white border border-ink-200/70 hover:border-primary/60 hover:shadow-card rounded-md p-4 text-center transition duration-250 ease-warm group"
            >
              <div className="text-2xl mb-1.5 transition-transform duration-250 ease-warm group-hover:scale-110">{item.icon}</div>
              <div className="text-xs font-semibold text-ink-800 group-hover:text-primary-700">{item.label}</div>
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <h2 className="text-xl md:text-2xl font-extrabold text-ink-900 tracking-tight">
            Bài đăng gần đây {posts ? `(${posts.length})` : ""}
          </h2>
          <Link
            href="/posts/new/"
            className="bg-primary hover:bg-primary-dark active:scale-[0.97] text-white text-sm font-semibold px-4 py-2 rounded-md shadow-soft hover:shadow-card transition duration-150 ease-warm"
          >
            + Đăng bài mới
          </Link>
        </div>

        {posts === null ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white border border-ink-200/70 rounded-md shadow-soft p-8 md:p-10">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">📭</div>
              <p className="text-ink-800 font-semibold text-lg mb-1">Bạn chưa đăng bài nào</p>
              <p className="text-ink-500 text-sm">
                Bài đăng đầu tiên chỉ mất 1-2 phút theo 3 bước dưới đây.
              </p>
            </div>

            <ol className="max-w-md mx-auto space-y-3 mb-6 text-left">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center">1</span>
                <div>
                  <p className="font-semibold text-ink-800 text-sm">Chọn 1-5 ảnh đồ</p>
                  <p className="text-ink-500 text-xs">Ảnh rõ ràng giúp người mua/người nhận hình dung nhanh.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center">2</span>
                <div>
                  <p className="font-semibold text-ink-800 text-sm">Điền tiêu đề, danh mục và giá</p>
                  <p className="text-ink-500 text-xs">Chọn &quot;Miễn phí&quot; nếu muốn cho/tặng, không cần gõ giá.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center">3</span>
                <div>
                  <p className="font-semibold text-ink-800 text-sm">Chọn khu vực và đăng</p>
                  <p className="text-ink-500 text-xs">Người gần khu vực sẽ thấy bài trước — đi lấy trong ngày.</p>
                </div>
              </li>
            </ol>

            <div className="text-center">
              <Link
                href="/posts/new/"
                className="inline-block bg-primary hover:bg-primary-dark active:scale-[0.97] text-white font-bold px-8 py-3 rounded-md shadow-soft hover:shadow-card transition duration-150 ease-warm"
              >
                Đăng bài đầu tiên
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </>
  );
}
