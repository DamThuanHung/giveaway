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
    return (
      <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />
    );
  }

  if (!user) {
    return (
      <Link
        href="/login/"
        className="text-sm font-semibold text-navy hover:text-primary px-3 py-1.5"
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
        className="flex items-center gap-2 hover:bg-gray-100 rounded-lg p-1 transition"
      >
        {user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatar}
            alt={user.name || ""}
            className="w-9 h-9 rounded-full object-cover"
          />
        ) : (
          <div
            className={`w-9 h-9 rounded-full ${avatarColor(user.name)} text-white font-bold flex items-center justify-center text-sm`}
          >
            {initial}
          </div>
        )}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="hidden sm:block text-gray-500">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-60 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <div className="font-semibold text-navy truncate">{displayName}</div>
            <div className="text-xs text-gray-500 truncate">{user.email || user.phone}</div>
          </div>
          <nav className="py-1">
            <Link
              href="/me/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50"
            >
              <span>👤</span> Hồ sơ của tôi
            </Link>
            <Link
              href={`/users/${user.id}/`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50"
            >
              <span>📦</span> Tin đăng của tôi
            </Link>
            <Link
              href="/chat/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50"
            >
              <span>💬</span> Tin nhắn
            </Link>
            <Link
              href="/favorites/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50"
            >
              <span>❤️</span> Bài đã lưu
            </Link>
            {user.role === "admin" && (
              <a
                href="https://api.traotay.com.vn/admin.html"
                target="_blank"
                rel="noopener"
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 text-violet-700 font-semibold"
              >
                <span>🔧</span> Trang quản trị
              </a>
            )}
            <button
              onClick={() => {
                logout();
                setOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-red-50 w-full text-left text-red-600 border-t border-gray-100 mt-1"
            >
              <span>🚪</span> Đăng xuất
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
