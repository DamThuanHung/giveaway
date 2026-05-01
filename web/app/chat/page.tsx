"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/components/AuthProvider";
import { authFetch } from "@/lib/auth";

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

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login/?next=/chat/");
      return;
    }
    authFetch("/chat/rooms")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setRooms(Array.isArray(data) ? data : data.data ?? []))
      .catch(() => setRooms([]));
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

  return (
    <>
      <Header />

      <section className="bg-gradient-to-br from-primary-light to-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-7">
          <h1 className="text-2xl md:text-3xl font-extrabold text-navy">
            💬 Tin nhắn
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            {rooms ? `${rooms.length} cuộc trò chuyện` : "Đang tải..."}
          </p>
        </div>
      </section>

      <section className="py-6 max-w-4xl mx-auto px-4">
        {rooms === null ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-gray-700 font-semibold mb-1">Chưa có tin nhắn nào</p>
            <p className="text-gray-500 text-sm mb-5">
              Tìm bài đăng phù hợp và nhắn tin với người bán
            </p>
            <Link
              href="/posts/"
              className="inline-block bg-primary hover:bg-primary-dark text-white font-bold px-6 py-3 rounded-lg"
            >
              Khám phá tin đăng
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
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
                  className={`flex items-center gap-3 p-4 hover:bg-gray-50 transition ${isUnread ? "bg-primary-light/30" : ""}`}
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
                      <span className={`truncate ${isUnread ? "font-bold text-navy" : "font-semibold text-gray-700"}`}>
                        {other?.name || "Người dùng"}
                      </span>
                      <span className="text-xs text-gray-400 shrink-0">
                        {lastMsg ? timeAgo(lastMsg.createdAt) : timeAgo(r.updatedAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span className={`text-sm truncate ${isUnread && !lastMsgFromMe ? "font-semibold text-navy" : "text-gray-500"}`}>
                        {lastMsgFromMe && "Bạn: "}
                        {lastMsg?.text || "(chưa có tin nhắn)"}
                      </span>
                      {isUnread && (
                        <span className="bg-primary text-white text-[10px] font-bold rounded-full px-2 py-0.5 shrink-0">
                          {r.unreadCount! > 99 ? "99+" : r.unreadCount}
                        </span>
                      )}
                    </div>
                    {r.post?.title && (
                      <div className="text-xs text-gray-400 mt-1 truncate">
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
