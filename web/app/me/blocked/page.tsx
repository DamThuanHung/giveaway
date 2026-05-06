"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/components/AuthProvider";
import { fetchBlockedUsers, unblockUser } from "@/lib/auth";

type BlockedUser = {
  id: string;
  blockedId: string;
  createdAt: string;
  blocked?: { id: string; name: string | null; avatar: string | null };
};

function avatarColor(name: string | null): string {
  const colors = [
    "bg-emerald-500",
    "bg-blue-500",
    "bg-rose-500",
    "bg-violet-500",
    "bg-amber-500",
    "bg-cyan-500",
  ];
  return colors[(name || "U").charCodeAt(0) % colors.length];
}

export default function BlockedUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [blocked, setBlocked] = useState<BlockedUser[] | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login/?next=/me/blocked/");
      return;
    }
    fetchBlockedUsers().then((data) => setBlocked(data));
  }, [user, authLoading, router]);

  async function onUnblock(targetId: string, name: string) {
    if (!confirm(`Bỏ chặn ${name}?`)) return;
    const ok = await unblockUser(targetId);
    if (ok) {
      setBlocked((prev) => prev?.filter((b) => b.blockedId !== targetId) ?? null);
    } else {
      alert("Không bỏ chặn được — thử lại");
    }
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

  return (
    <>
      <Header />

      <section className="bg-gradient-warm border-b border-ink-200/50">
        <div className="max-w-3xl mx-auto px-4 py-7 md:py-8">
          <Link href="/me/" className="text-sm text-ink-500 hover:text-primary-600 mb-2 inline-block transition-colors duration-150">
            ← Quay lại Hồ sơ
          </Link>
          <h1 className="text-2xl md:text-3xl font-extrabold text-ink-900 tracking-tight">🚫 Người dùng đã chặn</h1>
          <p className="text-ink-600 text-sm mt-1">
            {blocked == null
              ? "Đang tải..."
              : blocked.length === 0
              ? "Bạn chưa chặn ai"
              : `${blocked.length} người`}
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-6">
        {blocked == null ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white border border-ink-200/70 rounded-md p-4 h-16 animate-pulse" />
            ))}
          </div>
        ) : blocked.length === 0 ? (
          <div className="bg-white border border-ink-200/70 rounded-md shadow-soft p-10 text-center">
            <div className="text-5xl mb-3">😌</div>
            <p className="font-semibold text-ink-900 mb-1">Danh sách trống</p>
            <p className="text-ink-500 text-sm">
              Khi bạn chặn ai từ profile của họ, họ sẽ xuất hiện ở đây
            </p>
          </div>
        ) : (
          <div className="bg-white border border-ink-200/70 rounded-md shadow-soft overflow-hidden divide-y divide-ink-200/50">
            {blocked.map((b) => {
              const target = b.blocked || { id: b.blockedId, name: null, avatar: null };
              const initial = (target.name || "?").trim()[0]?.toUpperCase() || "?";
              return (
                <div key={b.id} className="flex items-center gap-3 p-4">
                  {target.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={target.avatar}
                      alt={target.name || ""}
                      className="w-12 h-12 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div
                      className={`w-12 h-12 rounded-full ${avatarColor(target.name)} text-white font-bold flex items-center justify-center shrink-0`}
                    >
                      {initial}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/users/${target.id}/`}
                      className="font-semibold text-ink-900 hover:text-primary-600 block truncate transition-colors duration-150"
                    >
                      {target.name || "Người dùng"}
                    </Link>
                    <p className="text-xs text-ink-400">
                      Chặn lúc {new Date(b.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <button
                    onClick={() => onUnblock(target.id, target.name || "người này")}
                    className="bg-red-50 hover:bg-red-100 text-red-700 text-sm font-semibold px-3 py-2 rounded-md transition-colors duration-150"
                  >
                    🔓 Bỏ chặn
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Footer />
    </>
  );
}
