"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/components/AuthProvider";
import { authFetch } from "@/lib/auth";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";

type ChatRoom = {
  id: string;
  postId: string;
  buyerId: string;
  sellerId: string;
  updatedAt: string;
  buyer?: { id: string; name: string | null; avatar: string | null };
  seller?: { id: string; name: string | null; avatar: string | null };
  post?: { id: string; title: string; imageLabel?: string };
  lastMessage?: { text: string; senderId: string; createdAt: string; isRead: boolean };
  unreadCount?: number;
};

function avatarColor(name: string | null): string {
  const colors = [
    "bg-emerald-500", "bg-blue-500", "bg-rose-500", "bg-violet-500",
    "bg-amber-500", "bg-cyan-500", "bg-pink-500", "bg-indigo-500",
  ];
  return colors[(name || "U").charCodeAt(0) % colors.length];
}

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const min = Math.round((Date.now() - d.getTime()) / 60000);
  if (min < 1) return "vừa xong";
  if (min < 60) return `${min} phút`;
  if (min < 1440) return `${Math.floor(min / 60)} giờ`;
  return `${Math.floor(min / 1440)} ngày`;
}

export default function ChatListPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<ChatRoom[] | null>(null);
  const [fetchError, setFetchError] = useState(false);

  // Smart fetch: 401/403/404 → empty (auth stale OR user mới); 5xx → error retry
  async function loadRooms(signal?: AbortSignal): Promise<ChatRoom[]> {
    const res = await authFetch("/chat/rooms", { signal });
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : data.data ?? [];
    }
    if (res.status === 401 || res.status === 403 || res.status === 404) {
      console.warn(`[chat/rooms] HTTP ${res.status} — empty fallback`);
      return [];
    }
    throw new Error(`HTTP ${res.status}`);
  }

  const refetch = () => {
    setFetchError(false);
    setRooms(null);
    loadRooms()
      .then(setRooms)
      .catch((e) => {
        console.error('[chat/rooms] fetch failed:', e);
        setFetchError(true);
      });
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login/?next=/chat/");
      return;
    }
    const ctrl = new AbortController();
    setFetchError(false);
    loadRooms(ctrl.signal)
      .then((list) => !ctrl.signal.aborted && setRooms(list))
      .catch((e) => {
        if (ctrl.signal.aborted) return;
        console.error('[chat/rooms] fetch failed:', e);
        setFetchError(true);
      });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, router]);

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
        <div className="max-w-4xl mx-auto px-4 py-7 md:py-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-ink-900 tracking-tight">
            💬 Tin nhắn
          </h1>
          <p className="text-ink-600 text-sm mt-1">
            {rooms ? `${rooms.length} cuộc trò chuyện` : "Đang tải..."}
          </p>
        </div>
      </section>

      <section className="py-6 max-w-4xl mx-auto px-4">
        {fetchError ? (
          <ErrorState
            title="Không tải được tin nhắn"
            description="Mạng yếu hoặc server tạm gián đoạn. Thử lại nhé."
            onRetry={refetch}
          />
        ) : rooms === null ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white border border-ink-200/70 rounded-md p-4 flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-ink-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-ink-200 rounded w-1/3" />
                  <div className="h-3 bg-ink-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <EmptyState
            emoji="📭"
            title="Chưa có tin nhắn nào"
            description="Tìm bài đăng phù hợp và nhắn tin với người bán để bắt đầu trao đổi."
            cta={{ href: "/posts/", label: "Khám phá bài đăng" }}
          />
        ) : (
          <div className="bg-white border border-ink-200/70 rounded-md shadow-soft overflow-hidden divide-y divide-ink-200/50">
            {rooms.map((r) => {
              const other = user.id === r.buyerId ? r.seller : r.buyer;
              const lastMsg = r.lastMessage;
              const isUnread = (r.unreadCount ?? 0) > 0;
              const lastMsgFromMe = lastMsg?.senderId === user.id;
              const initial = (other?.name || "?").trim()[0]?.toUpperCase() || "?";

              return (
                <Link
                  key={r.id}
                  href={`/chat/room/?id=${r.id}`}
                  className={`flex items-center gap-3 p-4 transition-colors duration-150 ${isUnread ? "bg-primary-100/40 hover:bg-primary-100/60" : "hover:bg-cream-100"}`}
                >
                  {other?.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={other.avatar} alt={other.name || ""} className="w-12 h-12 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className={`w-12 h-12 rounded-full ${avatarColor(other?.name ?? null)} text-white font-bold flex items-center justify-center shrink-0`}>
                      {initial}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`truncate ${isUnread ? "font-bold text-ink-900" : "font-semibold text-ink-700"}`}>
                        {other?.name || "Người dùng"}
                      </span>
                      <span className="text-xs text-ink-400 shrink-0">
                        {lastMsg ? timeAgo(lastMsg.createdAt) : timeAgo(r.updatedAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className={`text-sm truncate ${isUnread && !lastMsgFromMe ? "font-semibold text-ink-900" : "text-ink-500"}`}>
                        {lastMsgFromMe && "Bạn: "}
                        {lastMsg?.text || "(chưa có tin nhắn)"}
                      </span>
                      {isUnread && (
                        <span className="bg-primary text-white text-[10px] font-bold rounded-full px-2 py-0.5 shrink-0 shadow-soft">
                          {r.unreadCount! > 99 ? "99+" : r.unreadCount}
                        </span>
                      )}
                    </div>
                    {r.post?.title && (
                      <div className="text-xs text-ink-400 mt-1 truncate">
                        📦 {r.post.title}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <Footer />
    </>
  );
}
