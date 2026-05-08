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

  async function onClick() {
    if (loading) return;
    if (!user) {
      router.push(`/login/?next=/posts/${postId}/`);
      return;
    }
    if (user.id === sellerId) {
      alert("Đây là bài đăng của bạn — không thể tự nhắn cho mình");
      return;
    }
    setPending(true);
    const res = await authFetch("/chat/room", {
      method: "POST",
      body: JSON.stringify({ postId, sellerId, postTitle }),
    });
    setPending(false);
    if (!res.ok) {
      alert("Không tạo được phòng chat");
      return;
    }
    const room = await res.json();
    router.push(`/chat/room/?id=${room.id}`);
  }

  return (
    <button
      onClick={onClick}
      disabled={pending || loading}
      className="flex-1 bg-primary hover:bg-primary-dark active:scale-[0.97] text-white text-center font-bold py-3.5 rounded-xl transition disabled:opacity-50"
    >
      {pending ? "Đang mở..." : "💬 Nhắn người bán"}
    </button>
  );
}
