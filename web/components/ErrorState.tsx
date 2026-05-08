"use client";

import type { ReactNode } from "react";

/// Reusable error state khi data fetching fail.
/// Theo UI_UX_STANDARDS §6 — error state phải có:
/// - Message rõ (KHÔNG generic "Có lỗi xảy ra")
/// - Retry button (action)
/// - Đề xuất alternative (contact, refresh, ...)
///
/// Examples:
///   <ErrorState
///     title="Không tải được bài đăng"
///     description="Kiểm tra mạng rồi thử lại nhé."
///     onRetry={() => refetch()} />
///
///   <ErrorState
///     emoji="🔌"
///     title="Mất kết nối"
///     description="Backend đang bảo trì. Thử lại sau vài phút."
///     onRetry={refetch}
///     extra={<Link href="/help">Liên hệ hỗ trợ</Link>} />
export function ErrorState({
  emoji = "⚠️",
  title = "Không tải được dữ liệu",
  description = "Có thể do mạng yếu hoặc server tạm gián đoạn. Thử lại nhé.",
  onRetry,
  extra,
  className = "",
}: {
  emoji?: string;
  title?: string;
  description?: string;
  onRetry?: () => void;
  extra?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={`bg-white border border-red-200/70 rounded-md shadow-soft p-12 text-center max-w-xl mx-auto ${className}`}
    >
      <div className="text-6xl mb-4" aria-hidden="true">{emoji}</div>
      <h2 className="text-xl font-bold text-ink-900 mb-2">{title}</h2>
      <p className="text-ink-600 mb-6 leading-relaxed">{description}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-block bg-primary hover:bg-primary-dark text-white font-bold px-6 py-3 rounded-md shadow-soft hover:shadow-card transition duration-150 ease-warm"
        >
          🔄 Thử lại
        </button>
      )}
      {extra && <div className="mt-3 text-sm text-ink-500">{extra}</div>}
    </div>
  );
}
