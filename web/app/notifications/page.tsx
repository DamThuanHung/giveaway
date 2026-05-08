"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/components/AuthProvider";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/auth";

type Notif = {
  id: string;
  type: string;
  title: string;
  body: string;
  data: string | null;
  isRead: boolean;
  createdAt: string;
};

const ICON_BY_TYPE: Record<string, string> = {
  admin_broadcast: "📢",
  admin_refund: "↩️",
  bump_paid: "🚀",
  new_message: "💬",
  new_review: "⭐",
  post_approved: "✅",
  post_hidden: "⚠️",
  keyword_alert: "🔔",
  follower_post: "👀",
};

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const min = Math.round((Date.now() - d.getTime()) / 60000);
  if (min < 1) return "vừa xong";
  if (min < 60) return `${min} phút trước`;
  if (min < 1440) return `${Math.floor(min / 60)} giờ trước`;
  return `${Math.floor(min / 1440)} ngày trước`;
}

function deepLinkFromData(type: string, data: string | null): string | null {
  if (!data) return null;
  try {
    const parsed = JSON.parse(data);
    if (parsed.postId) return `/posts/${parsed.postId}/`;
    if (parsed.roomId) return `/chat/room/?id=${parsed.roomId}`;
    if (parsed.userId) return `/users/${parsed.userId}/`;
  } catch {}
  return null;
}

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notif[] | null>(null);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login/?next=/notifications/");
      return;
    }
    fetchNotifications().then((data) => setNotifs(data));
  }, [user, authLoading, router]);

  async function onMarkAll() {
    if (!notifs || marking) return;
    setMarking(true);
    const ok = await markAllNotificationsRead();
    if (ok) {
      setNotifs((prev) => prev?.map((n) => ({ ...n, isRead: true })) ?? null);
    }
    setMarking(false);
  }

  async function onClickItem(n: Notif) {
    if (!n.isRead) {
      markNotificationRead(n.id);
      setNotifs((prev) => prev?.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)) ?? null);
    }
    const link = deepLinkFromData(n.type, n.data);
    if (link) router.push(link);
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

  const unreadCount = notifs?.filter((n) => !n.isRead).length ?? 0;

  return (
    <>
      <Header />

      <section className="bg-gradient-warm border-b border-ink-200/50">
        <div className="max-w-3xl mx-auto px-4 py-7 md:py-8 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-ink-900 tracking-tight">🔔 Thông báo</h1>
            <p className="text-ink-600 text-sm mt-1">
              {notifs == null
                ? "Đang tải..."
                : unreadCount > 0
                ? `${unreadCount} chưa đọc / ${notifs.length} tổng`
                : `${notifs.length} thông báo`}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAll}
              disabled={marking}
              className="bg-primary hover:bg-primary-dark active:scale-[0.97] text-white text-sm font-semibold px-4 py-2 rounded-md shadow-soft hover:shadow-card transition duration-150 ease-warm disabled:opacity-60"
            >
              {marking ? "Đang đánh dấu..." : "Đánh dấu đã đọc tất cả"}
            </button>
          )}
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-6">
        {notifs == null ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white border border-ink-200/70 rounded-md p-4 animate-pulse h-20" />
            ))}
          </div>
        ) : notifs.length === 0 ? (
          <div className="bg-white border border-ink-200/70 rounded-md shadow-soft p-10 text-center">
            <div className="text-5xl mb-3">🔕</div>
            <p className="font-semibold text-ink-900 mb-1">Chưa có thông báo</p>
            <p className="text-ink-500 text-sm">
              Thông báo về tin nhắn, đánh giá, kết quả thanh toán... sẽ hiện ở đây
            </p>
          </div>
        ) : (
          <div className="bg-white border border-ink-200/70 rounded-md shadow-soft overflow-hidden divide-y divide-ink-200/50">
            {notifs.map((n) => {
              const icon = ICON_BY_TYPE[n.type] || "🔔";
              const linkable = !!deepLinkFromData(n.type, n.data);
              return (
                <button
                  key={n.id}
                  onClick={() => onClickItem(n)}
                  className={`w-full text-left p-4 flex items-start gap-3 transition-colors duration-150 ${linkable ? "hover:bg-cream-100 cursor-pointer" : "cursor-default"} ${!n.isRead ? "bg-primary-100/30" : ""}`}
                >
                  <div className="text-2xl shrink-0 leading-none">{icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`${!n.isRead ? "font-bold text-ink-900" : "font-semibold text-ink-700"}`}>
                        {n.title}
                      </span>
                      {!n.isRead && <span className="w-2 h-2 bg-primary rounded-full shrink-0" />}
                    </div>
                    <p className="text-sm text-ink-600 mt-0.5 break-words leading-relaxed">{n.body}</p>
                    <p className="text-xs text-ink-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <Footer />
    </>
  );
}
