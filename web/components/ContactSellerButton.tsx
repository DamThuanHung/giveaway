"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { authFetch } from "@/lib/auth";

type Props = {
  postId: string;
  sellerId: string;
  postTitle: string;
};

export function ContactSellerButton({ postId, sellerId, postTitle }: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    if (loading) return;
    setError(null);
    if (!user) {
      router.push(`/login/?next=/posts/${postId}/`);
      return;
    }
    if (user.id === sellerId) {
      setError("Đây là bài đăng của bạn");
      return;
    }
    setPending(true);
    try {
      const res = await authFetch("/chat/room", {
        method: "POST",
        body: JSON.stringify({ postId, sellerId, postTitle }),
      });
      if (!res.ok) {
        const msg = res.status === 403
          ? "Bạn không thể nhắn tin với người dùng này"
          : "Không mở được chat, vui lòng thử lại";
        setError(msg);
        return;
      }
      const room = await res.json();
      router.push(`/chat/room/?id=${room.id}`);
    } catch {
      setError("Mất kết nối, vui lòng thử lại");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col gap-1.5">
      <button
        onClick={onClick}
        disabled={pending || loading}
        className="w-full bg-primary hover:bg-primary-dark active:scale-[0.97] text-white text-center font-bold py-3.5 rounded-xl transition disabled:opacity-50"
      >
        {pending ? "Đang mở..." : "💬 Nhắn người bán"}
      </button>
      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}
    </div>
  );
}
