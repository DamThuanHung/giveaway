"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Socket } from "socket.io-client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/components/AuthProvider";
import { authFetch } from "@/lib/auth";
import { connectChatSocket } from "@/lib/socket";

type Message = {
  id: string;
  roomId: string;
  senderId: string;
  text: string;
  metadata?: string | null; // có thể chứa imageUrl hoặc system flag
  isRead: boolean;
  createdAt: string;
  sender?: { id: string; name: string | null; avatar: string | null };
};

type Room = {
  id: string;
  buyerId: string;
  sellerId: string;
  postId: string;
  buyer?: { id: string; name: string | null; avatar: string | null };
  seller?: { id: string; name: string | null; avatar: string | null };
  post?: { id: string; title: string; imageLabel?: string; price?: number };
};

function avatarColor(name: string | null): string {
  const colors = [
    "bg-emerald-500", "bg-blue-500", "bg-rose-500", "bg-violet-500",
    "bg-amber-500", "bg-cyan-500", "bg-pink-500", "bg-indigo-500",
  ];
  return colors[(name || "U").charCodeAt(0) % colors.length];
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function fmtDateLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return "Hôm nay";
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Hôm qua";
  return d.toLocaleDateString("vi-VN");
}

function ChatRoomInner() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get("id") || "";
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auth gate
  useEffect(() => {
    if (authLoading) return;
    if (!user) router.replace(`/login/?next=/chat/room/?id=${roomId}`);
    if (user && !roomId) router.replace("/chat/");
  }, [user, authLoading, roomId, router]);

  // Load room info + messages
  useEffect(() => {
    if (!user || !roomId) return;
    let cancelled = false;

    Promise.all([
      authFetch(`/chat/room/${roomId}`).then((r) => (r.ok ? r.json() : null)),
      authFetch(`/chat/room/${roomId}/messages?limit=50`).then((r) => (r.ok ? r.json() : [])),
    ]).then(([rm, msgs]) => {
      if (cancelled) return;
      setRoom(rm);
      const list: Message[] = Array.isArray(msgs) ? msgs : msgs.data ?? [];
      // Backend trả desc (mới nhất trước) → reverse cho UI hiển thị cũ trước
      setMessages(list.slice().reverse());
      setLoadingMsgs(false);
      // Mark as read
      authFetch(`/chat/room/${roomId}/read`, { method: "POST" }).catch(() => {});
    });

    return () => {
      cancelled = true;
    };
  }, [user, roomId]);

  // Connect socket
  useEffect(() => {
    if (!user || !roomId) return;

    const sock = connectChatSocket(roomId);
    if (!sock) return;
    socketRef.current = sock;

    sock.on("connect", () => {
      sock.emit("joinRoom", { roomId });
      sock.emit("markRead", { roomId });
    });

    sock.on("receive_message", (msg: Message) => {
      setMessages((prev) => {
        // Tránh duplicate (echo từ chính mình)
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // Auto mark read khi đang xem
      sock.emit("markRead", { roomId });
    });

    sock.on("connect_error", (e: any) => {
      console.error("Socket connect error:", e?.message);
    });

    return () => {
      sock.disconnect();
      socketRef.current = null;
    };
  }, [user, roomId]);

  // Auto scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function send() {
    const trimmed = text.trim();
    if (!trimmed || !socketRef.current) return;
    if (trimmed.length > 2000) {
      setErr("Tin nhắn tối đa 2000 ký tự");
      return;
    }
    setSending(true);
    setErr(null);

    socketRef.current.timeout(8000).emit(
      "sendMessage",
      { roomId, text: trimmed },
      (timeoutErr: Error | null, response: any) => {
        setSending(false);
        if (timeoutErr) {
          setErr("Gửi không kịp — thử lại");
          return;
        }
        if (response?.event === "error") {
          setErr(response.data || "Gửi thất bại");
          return;
        }
        // Response is the message itself → push vào state
        if (response?.id) {
          setMessages((prev) => {
            if (prev.find((m) => m.id === response.id)) return prev;
            return [...prev, response];
          });
        }
        setText("");
      }
    );
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

  const other = room ? (user.id === room.buyerId ? room.seller : room.buyer) : null;
  const otherInitial = (other?.name || "?").trim()[0]?.toUpperCase() || "?";

  // Group messages by date
  const groups: { date: string; items: Message[] }[] = [];
  for (const m of messages) {
    const dateLabel = fmtDateLabel(m.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.date === dateLabel) last.items.push(m);
    else groups.push({ date: dateLabel, items: [m] });
  }

  return (
    <>
      <Header />

      <div className="max-w-4xl mx-auto px-0 md:px-4 py-0 md:py-4">
        <div className="bg-white md:border md:border-gray-200 md:rounded-2xl flex flex-col" style={{ height: "calc(100vh - 144px)" }}>
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-200 shrink-0">
            <Link href="/chat/" className="text-gray-500 hover:text-primary text-xl">←</Link>
            {other?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={other.avatar} alt={other.name || ""} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className={`w-10 h-10 rounded-full ${avatarColor(other?.name ?? null)} text-white font-bold flex items-center justify-center`}>
                {otherInitial}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-bold text-navy truncate">{other?.name || "Người dùng"}</div>
              {room?.post && (
                <Link href={`/posts/${room.post.id}/`} className="text-xs text-primary hover:underline truncate block">
                  📦 {room.post.title}
                </Link>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
            {loadingMsgs ? (
              <div className="text-center text-gray-400 py-10">Đang tải tin nhắn...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-400 py-10">
                Chưa có tin nhắn. Hãy chào hỏi để bắt đầu cuộc trò chuyện 👋
              </div>
            ) : (
              groups.map((g) => (
                <div key={g.date}>
                  <div className="text-center text-xs text-gray-400 my-3">{g.date}</div>
                  {g.items.map((m) => {
                    const fromMe = m.senderId === user.id;
                    return (
                      <div key={m.id} className={`flex mb-1.5 ${fromMe ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words shadow-sm ${
                            fromMe
                              ? "bg-primary text-white rounded-br-md"
                              : "bg-white text-navy border border-gray-200 rounded-bl-md"
                          }`}
                        >
                          {m.text}
                          <div className={`text-[10px] mt-1 ${fromMe ? "text-white/70" : "text-gray-400"}`}>
                            {fmtTime(m.createdAt)}
                            {fromMe && m.isRead && " · Đã đọc"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-3 shrink-0">
            {err && (
              <div className="text-xs text-red-600 mb-1.5">{err}</div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Nhập tin nhắn..."
                disabled={sending}
                className="flex-1 border border-gray-300 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-primary disabled:opacity-50"
                maxLength={2000}
              />
              <button
                type="submit"
                disabled={!text.trim() || sending}
                className="bg-primary hover:bg-primary-dark text-white font-semibold px-5 py-2.5 rounded-full disabled:opacity-50"
              >
                {sending ? "..." : "Gửi"}
              </button>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

export default function ChatRoomPage() {
  return (
    <Suspense fallback={<><Header /><div className="text-center py-20 text-gray-500">Đang tải...</div><Footer /></>}>
      <ChatRoomInner />
    </Suspense>
  );
}
