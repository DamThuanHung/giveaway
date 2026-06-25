"use client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.traotay.com.vn";

type Props = {
  platform: "android" | "ios";
  href: string;
  className?: string;
  children: React.ReactNode;
};

/// Ghi nhận lượt tải bằng fetch (keepalive) khi user thật bấm nút — bot/crawler
/// (Facebook link preview, Googlebot...) không chạy JS nên không bị tính vào.
/// Endpoint GET /download/:platform cũ chỉ redirect, không log nữa (xem ADR-0012).
export function DownloadAppButton({ platform, href, className, children }: Props) {
  const track = () => {
    fetch(`${API_BASE}/download/track/${platform}`, { method: "POST", keepalive: true }).catch(() => {});
  };

  return (
    <a href={href} onClick={track} className={className}>
      {children}
    </a>
  );
}
