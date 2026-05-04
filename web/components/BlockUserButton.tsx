"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { authFetch, blockUser, unblockUser } from "@/lib/auth";

type Props = {
  targetId: string;
  targetName: string;
};

/// BlockUserButton: hiện trên user profile (không phải mình). Toggle block/unblock.
/// Khi block: backend ẩn bài, chặn message, ngăn liên hệ 2 chiều.
export function BlockUserButton({ targetId, targetName }: Props) {
  const { user, loading } = useAuth();
  const [isBlocked, setIsBlocked] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!user || user.id === targetId) return;
    let cancelled = false;
    authFetch(`/user/block/check/${targetId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        setIsBlocked(data?.isBlocked === true);
      });
    return () => {
      cancelled = true;
    };
  }, [user, targetId]);

  if (loading || !user || user.id === targetId || isBlocked === null) return null;

  async function onClick() {
    if (pending) return;
    if (!isBlocked) {
      const ok = confirm(
        `Chặn ${targetName}?\n\n` +
          `• Bài của họ sẽ ẩn khỏi danh sách của bạn\n` +
          `• Họ không gửi tin nhắn cho bạn được nữa\n` +
          `• Bạn cũng không liên lạc được với họ\n\n` +
          `Có thể bỏ chặn bất cứ lúc nào.`
      );
      if (!ok) return;
    }
    setPending(true);
    const ok = isBlocked ? await unblockUser(targetId) : await blockUser(targetId);
    setPending(false);
    if (ok) {
      setIsBlocked(!isBlocked);
    } else {
      alert("Không thực hiện được — thử lại");
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      className={`text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-60 ${isBlocked ? "bg-red-100 hover:bg-red-200 text-red-700" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
    >
      {pending
        ? "Đang xử lý..."
        : isBlocked
        ? "🔓 Bỏ chặn"
        : "🚫 Chặn người này"}
    </button>
  );
}
