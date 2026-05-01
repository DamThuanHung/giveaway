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

  // Edit name state
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);

  // Avatar upload state
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
          <div className="flex items-start gap-5 flex-wrap">
            {/* Avatar with upload */}
            <div className="relative shrink-0">
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar}
                  alt={user.name || ""}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-emerald-500 text-white text-4xl font-bold flex items-center justify-center shadow-md border-4 border-white">
                  {initial}
                </div>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 bg-primary hover:bg-primary-dark text-white w-9 h-9 rounded-full shadow-md flex items-center justify-center text-sm transition disabled:opacity-50"
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
              {/* Name with inline edit */}
              {editingName ? (
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    maxLength={50}
                    autoFocus
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-xl font-bold focus:outline-none focus:border-primary"
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
                    className="bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
                  >
                    {savingName ? "..." : "Lưu"}
                  </button>
                  <button
                    onClick={() => {
                      setNameInput(user.name || "");
                      setEditingName(false);
                    }}
                    className="text-gray-500 hover:text-gray-700 text-sm px-2"
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-navy">
                    {displayName}
                  </h1>
                  <button
                    onClick={() => setEditingName(true)}
                    className="text-gray-400 hover:text-primary text-sm font-medium"
                    aria-label="Sửa tên"
                  >
                    ✏️ Sửa tên
                  </button>
                </div>
              )}
              <p className="text-gray-600 text-sm mt-1">
                {user.email && <span>📧 {user.email}</span>}
                {user.phone && <span className="ml-3">📞 {user.phone}</span>}
              </p>
              {avatarErr && (
                <p className="text-red-600 text-sm mt-2">{avatarErr}</p>
              )}
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
        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <h2 className="text-xl font-extrabold text-navy">
            Tin đăng của bạn {posts ? `(${posts.length})` : ""}
          </h2>
          <Link
            href="/posts/new/"
            className="bg-primary hover:bg-primary-dark text-white text-sm font-semibold px-4 py-2 rounded-lg"
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
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-gray-700 font-semibold mb-1">Bạn chưa đăng bài nào</p>
            <p className="text-gray-500 text-sm mb-5">
              Đăng bài ngay trên web — chọn ảnh + thông tin, đăng xong!
            </p>
            <Link
              href="/posts/new/"
              className="inline-block bg-primary hover:bg-primary-dark text-white font-bold px-6 py-3 rounded-lg"
            >
              Đăng bài đầu tiên
            </Link>
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
