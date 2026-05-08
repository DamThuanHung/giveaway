"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import {
  authFetch,
  createBumpOrder,
  type BumpPackage,
  createReview,
  checkHasReviewed,
  updatePostStatus,
} from "@/lib/auth";

type Props = {
  postId: string;
  authorId: string;
  status: string; // available | done | reserved | hidden
  postTitle: string;
};

/// OwnerActions: nhóm action cho chủ bài (Sửa / Đẩy) hoặc đối tác giao dịch (Đánh giá).
/// Render rỗng nếu user không phải author hoặc partner — không lộ UI thừa cho khách.
export function OwnerActions({ postId, authorId, status, postTitle }: Props) {
  const { user, loading } = useAuth();
  const [completedWithMe, setCompletedWithMe] = useState(false);
  const [showBump, setShowBump] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showMarkDone, setShowMarkDone] = useState(false);

  // Check post.completedWithUserId === me (cần fetch lại post detail vì server props không có field này)
  useEffect(() => {
    if (!user || status !== "done") return;
    let cancelled = false;
    authFetch(`/post/${postId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => {
        if (cancelled) return;
        if (p?.completedWithUserId === user.id) setCompletedWithMe(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user, postId, status]);

  if (loading || !user) return null;

  const isOwner = user.id === authorId;
  const isPartner = completedWithMe;

  if (!isOwner && !isPartner) return null;

  const canEdit = isOwner && status !== "deleted_by_admin";
  const canBump = isOwner && status === "available";
  const canMarkDone = isOwner && status === "available";
  const canReview = (isOwner || isPartner) && status === "done";

  return (
    <>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
        <div className="text-sm font-bold text-amber-900 mb-2.5">
          {isOwner ? "🔧 Quản lý bài đăng của bạn" : "⭐ Bạn là đối tác giao dịch"}
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <Link
              href={`/posts/edit/?id=${postId}`}
              className="bg-white hover:bg-gray-50 border border-gray-300 text-navy text-sm font-semibold px-4 py-2 rounded-lg transition"
            >
              ✏️ Sửa bài
            </Link>
          )}
          {canBump && (
            <button
              onClick={() => setShowBump(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
            >
              🚀 Đẩy lên top
            </button>
          )}
          {canMarkDone && (
            <button
              onClick={() => setShowMarkDone(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
            >
              ✅ Đánh dấu đã giao dịch
            </button>
          )}
          {canReview && (
            <button
              onClick={() => setShowReview(true)}
              className="bg-primary hover:bg-primary-dark active:scale-[0.97] text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
            >
              ⭐ Đánh giá đối tác
            </button>
          )}
        </div>
      </div>

      {showBump && <BumpModal postId={postId} postTitle={postTitle} onClose={() => setShowBump(false)} />}
      {showReview && (
        <ReviewModal postId={postId} postTitle={postTitle} onClose={() => setShowReview(false)} />
      )}
      {showMarkDone && (
        <MarkDoneModal postId={postId} postTitle={postTitle} onClose={() => setShowMarkDone(false)} />
      )}
    </>
  );
}

// ─── Bump Modal ──────────────────────────────────────────────────────────────

const BUMP_PACKAGES: { key: BumpPackage; label: string; price: number; duration: string; desc: string }[] = [
  {
    key: "plus_3d",
    label: "Plus",
    price: 5000,
    duration: "3 ngày",
    desc: "Bài lên top trang chủ + huy hiệu Plus 3 ngày",
  },
  {
    key: "vip_7d",
    label: "VIP",
    price: 15000,
    duration: "7 ngày",
    desc: "Bài top tuyệt đối + huy hiệu VIP vàng + ưu tiên mọi search 7 ngày",
  },
];

function BumpModal({ postId, postTitle, onClose }: { postId: string; postTitle: string; onClose: () => void }) {
  const [selected, setSelected] = useState<BumpPackage>("plus_3d");
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onConfirm() {
    setPending(true);
    setErr(null);
    const res = await createBumpOrder(postId, selected);
    setPending(false);
    if (!res.ok || !res.checkoutUrl) {
      setErr(res.message || "Tạo đơn thất bại");
      return;
    }
    // Redirect tới PayOS checkout. Sau khi thanh toán, PayOS redirect về /bump/return.
    window.location.href = res.checkoutUrl;
  }

  return (
    <ModalShell title="🚀 Đẩy bài lên top" onClose={onClose}>
      <p className="text-sm text-gray-600 mb-4">
        Chọn gói cho bài <strong>{postTitle}</strong>:
      </p>
      <div className="space-y-3 mb-4">
        {BUMP_PACKAGES.map((p) => (
          <label
            key={p.key}
            className={`block cursor-pointer border-2 rounded-xl p-4 transition ${selected === p.key ? "border-primary bg-primary-light" : "border-gray-200 hover:border-gray-300"}`}
          >
            <input
              type="radio"
              name="bump-pkg"
              value={p.key}
              checked={selected === p.key}
              onChange={() => setSelected(p.key)}
              className="sr-only"
            />
            <div className="flex items-baseline justify-between mb-1">
              <span className="font-bold text-navy text-lg">{p.label}</span>
              <span className="text-red-600 font-extrabold text-lg">{p.price.toLocaleString("vi-VN")}đ</span>
            </div>
            <div className="text-xs text-gray-500 mb-1">⏱ {p.duration}</div>
            <div className="text-sm text-gray-700">{p.desc}</div>
          </label>
        ))}
      </div>
      {err && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 mb-3 text-sm">
          ⚠ {err}
        </div>
      )}
      <p className="text-xs text-gray-500 mb-4">
        Thanh toán qua PayOS (chuyển khoản / ví / QR). Sau khi xong sẽ tự kích hoạt boost.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-navy font-semibold py-3 rounded-lg"
        >
          Hủy
        </button>
        <button
          onClick={onConfirm}
          disabled={pending}
          className="flex-1 bg-primary hover:bg-primary-dark active:scale-[0.97] text-white font-bold py-3 rounded-lg disabled:opacity-60"
        >
          {pending ? "Đang tạo đơn..." : "Thanh toán"}
        </button>
      </div>
    </ModalShell>
  );
}

// ─── Review Modal ────────────────────────────────────────────────────────────

function ReviewModal({ postId, postTitle, onClose }: { postId: string; postTitle: string; onClose: () => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [existing, setExisting] = useState<any | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    checkHasReviewed(postId).then((r) => {
      if (cancelled) return;
      if (r.hasReviewed && r.review) {
        setExisting(r.review);
        setRating(r.review.rating);
        setComment(r.review.comment || "");
      }
      setChecking(false);
    });
    return () => {
      cancelled = true;
    };
  }, [postId]);

  async function onSubmit() {
    if (rating < 1 || rating > 5) return setErr("Chọn 1-5 sao");
    setPending(true);
    setErr(null);
    const res = await createReview(postId, rating, comment.trim() || undefined);
    setPending(false);
    if (!res.ok) {
      setErr(res.message || "Gửi đánh giá thất bại");
      return;
    }
    onClose();
    window.location.reload(); // reload để thấy review mới
  }

  if (checking) {
    return (
      <ModalShell title="⭐ Đánh giá" onClose={onClose}>
        <div className="text-center py-6 text-gray-500">Đang tải...</div>
      </ModalShell>
    );
  }

  if (existing) {
    return (
      <ModalShell title="⭐ Đánh giá đã gửi" onClose={onClose}>
        <p className="text-sm text-gray-600 mb-4">Bạn đã đánh giá giao dịch này:</p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <div className="text-amber-500 text-xl mb-2">{"★".repeat(existing.rating)}{"☆".repeat(5 - existing.rating)}</div>
          {existing.comment && <p className="text-sm text-gray-700">{existing.comment}</p>}
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Bạn không thể chỉnh sửa hoặc xóa đánh giá đã gửi qua web. Liên hệ admin nếu cần.
        </p>
        <button
          onClick={onClose}
          className="w-full bg-gray-100 hover:bg-gray-200 text-navy font-semibold py-3 rounded-lg"
        >
          Đóng
        </button>
      </ModalShell>
    );
  }

  return (
    <ModalShell title="⭐ Đánh giá đối tác giao dịch" onClose={onClose}>
      <p className="text-sm text-gray-600 mb-4">
        Đánh giá cho giao dịch <strong>{postTitle}</strong>:
      </p>

      <div className="text-center mb-5">
        <div className="text-sm font-semibold text-navy mb-2">Cho mấy sao?</div>
        <div className="flex justify-center gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={`text-4xl transition ${n <= rating ? "text-amber-400 hover:text-amber-500" : "text-gray-300 hover:text-amber-200"}`}
              aria-label={`${n} sao`}
            >
              ★
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {rating === 1 && "Rất tệ"}
          {rating === 2 && "Tệ"}
          {rating === 3 && "Bình thường"}
          {rating === 4 && "Tốt"}
          {rating === 5 && "Rất tốt"}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold text-navy mb-1.5">
          Nhận xét <span className="text-gray-400 font-normal">(không bắt buộc)</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 1000))}
          rows={4}
          placeholder="Chia sẻ trải nghiệm để cộng đồng tham khảo..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary text-sm"
        />
        <p className="text-xs text-gray-400 mt-1">{comment.length}/1000 ký tự</p>
      </div>

      {err && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 mb-3 text-sm">
          ⚠ {err}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-navy font-semibold py-3 rounded-lg"
        >
          Hủy
        </button>
        <button
          onClick={onSubmit}
          disabled={pending}
          className="flex-1 bg-primary hover:bg-primary-dark active:scale-[0.97] text-white font-bold py-3 rounded-lg disabled:opacity-60"
        >
          {pending ? "Đang gửi..." : "Gửi đánh giá"}
        </button>
      </div>
    </ModalShell>
  );
}

// ─── Mark Done Modal (chuyển status post sang 'done' để có thể đánh giá) ─────

function MarkDoneModal({ postId, postTitle, onClose }: { postId: string; postTitle: string; onClose: () => void }) {
  const [partnerId, setPartnerId] = useState("");
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onConfirm() {
    if (!partnerId.trim()) return setErr("Cần ID người đã giao dịch (lấy từ chat/profile của họ)");
    setPending(true);
    setErr(null);
    const res = await updatePostStatus(postId, "done", partnerId.trim());
    setPending(false);
    if (!res.ok) {
      setErr(res.message || "Đánh dấu thất bại");
      return;
    }
    onClose();
    window.location.reload();
  }

  return (
    <ModalShell title="✅ Đánh dấu đã giao dịch" onClose={onClose}>
      <p className="text-sm text-gray-600 mb-4">
        Bài <strong>{postTitle}</strong> sẽ chuyển sang trạng thái "Đã hoàn tất" và mở chức năng đánh giá đối tác.
      </p>
      <div className="mb-4">
        <label className="block text-sm font-semibold text-navy mb-1.5">
          ID người đã giao dịch <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={partnerId}
          onChange={(e) => setPartnerId(e.target.value)}
          placeholder="VD: user_abc123"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">
          Lấy ID người mua từ URL profile của họ (https://traotay.com.vn/users/<strong>USER_ID</strong>/) hoặc từ chat.
        </p>
      </div>
      {err && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 mb-3 text-sm">
          ⚠ {err}
        </div>
      )}
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-navy font-semibold py-3 rounded-lg"
        >
          Hủy
        </button>
        <button
          onClick={onConfirm}
          disabled={pending}
          className="flex-1 bg-primary hover:bg-primary-dark active:scale-[0.97] text-white font-bold py-3 rounded-lg disabled:opacity-60"
        >
          {pending ? "Đang xử lý..." : "Xác nhận"}
        </button>
      </div>
    </ModalShell>
  );
}

// ─── Modal Shell ─────────────────────────────────────────────────────────────

function ModalShell({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
          <h3 className="font-bold text-navy">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            aria-label="Đóng"
          >
            ×
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
