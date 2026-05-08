import Link from "next/link";
import type { ReactNode } from "react";

/// Reusable empty state với illustration emoji + title + description + CTA.
/// Theo UI_UX_STANDARDS §6 (state coverage 5 state) — empty state phải có
/// CTA dẫn user đi tiếp, KHÔNG chỉ "Chưa có gì".
///
/// Examples:
///   <EmptyState emoji="📭" title="Chưa có thông báo nào"
///     description="Khi có người tương tác, thông báo sẽ hiện ở đây."
///     cta={{ href: "/posts/", label: "Khám phá bài đăng" }} />
///
///   <EmptyState emoji="💔" title="Chưa lưu bài nào"
///     description="Bấm icon trái tim ❤️ để lưu bài cho lần sau."
///     action={<button onClick={...}>Bắt đầu</button>} />
export function EmptyState({
  emoji = "📭",
  title,
  description,
  cta,
  action,
  className = "",
}: {
  emoji?: string;
  title: string;
  description?: string;
  cta?: { href: string; label: string };
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white border border-ink-200/70 rounded-md shadow-soft p-12 text-center max-w-xl mx-auto ${className}`}
    >
      <div className="text-6xl mb-4" aria-hidden="true">{emoji}</div>
      <h2 className="text-xl font-bold text-ink-900 mb-2">{title}</h2>
      {description && (
        <p className="text-ink-600 mb-6 leading-relaxed">{description}</p>
      )}
      {cta && (
        <Link
          href={cta.href}
          className="inline-block bg-primary hover:bg-primary-dark active:scale-[0.97] text-white font-bold px-6 py-3 rounded-md shadow-soft hover:shadow-card transition duration-150 ease-warm"
        >
          {cta.label}
        </Link>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
