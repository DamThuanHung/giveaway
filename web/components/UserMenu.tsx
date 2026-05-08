"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";

function avatarColor(name: string | null): string {
  const colors = [
    "bg-emerald-500",
    "bg-blue-500",
    "bg-rose-500",
    "bg-violet-500",
    "bg-amber-500",
    "bg-cyan-500",
    "bg-pink-500",
    "bg-indigo-500",
  ];
  const seed = (name || "U").charCodeAt(0);
  return colors[seed % colors.length];
}

export function UserMenu() {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (loading) {
    return <div className="w-9 h-9 rounded-full bg-ink-200 animate-pulse" />;
  }

  if (!user) {
    return (
      <Link
        href="/login/"
        className="text-sm font-semibold text-navy hover:text-primary px-3 py-1.5 transition-colors duration-150 ease-warm"
      >
        Đăng nhập
      </Link>
    );
  }

  const initial = (user.name || user.email || "U").trim()[0].toUpperCase();
  const displayName = user.name || user.email?.split("@")[0] || "Bạn";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Mở menu cá nhân"
        aria-expanded={open}
        className="flex items-center gap-2 hover:bg-ink-100 rounded-md p-1 transition duration-150 ease-warm"
      >
        {user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatar}
            alt={user.name || ""}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-soft"
          />
        ) : (
          <div
            className={`w-9 h-9 rounded-full ${avatarColor(user.name)} text-white font-bold flex items-center justify-center text-sm shadow-soft`}
          >
            {initial}
          </div>
        )}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`hidden sm:block text-ink-500 transition-transform duration-250 ease-warm ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-ink-200/70 rounded-md shadow-elevated overflow-hidden animate-fade-in z-50">
          <div className="p-4 border-b border-ink-200/70 bg-cream-100">
            <div className="font-semibold text-ink-900 truncate">{displayName}</div>
            <div className="text-xs text-ink-500 truncate mt-0.5">{user.email || user.phone}</div>
          </div>
          <nav className="p-1.5">
            <Link
              href="/me/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-md hover:bg-ink-100 text-ink-800 transition-colors duration-150 ease-warm"
            >
              <span>👤</span> Hồ sơ của tôi
            </Link>
            <Link
              href="/me/posts/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-md hover:bg-ink-100 text-ink-800 transition-colors duration-150 ease-warm"
            >
              <span>📦</span> Bài đăng của tôi
            </Link>
            <Link
              href="/chat/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-md hover:bg-ink-100 text-ink-800 transition-colors duration-150 ease-warm"
            >
              <span>💬</span> Tin nhắn
            </Link>
            <Link
              href="/notifications/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-md hover:bg-ink-100 text-ink-800 transition-colors duration-150 ease-warm"
            >
              <span>🔔</span> Thông báo
            </Link>
            <Link
              href="/favorites/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-md hover:bg-ink-100 text-ink-800 transition-colors duration-150 ease-warm"
            >
              <span>❤️</span> Bài đã lưu
            </Link>
            {user.role === "admin" && (
              <a
                href="https://api.traotay.com.vn/admin.html"
                target="_blank"
                rel="noopener"
                className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-md hover:bg-ink-100 text-violet-700 font-semibold transition-colors duration-150 ease-warm"
              >
                <span>🔧</span> Trang quản trị
              </a>
            )}
            <button
              onClick={() => {
                logout();
                setOpen(false);
              }}
              className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-md hover:bg-red-50 w-full text-left text-red-600 border-t border-ink-200/50 mt-1 pt-3 transition-colors duration-150 ease-warm"
            >
              <span>🚪</span> Đăng xuất
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
