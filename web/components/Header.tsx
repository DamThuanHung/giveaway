"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { HeaderSearchBox } from "./HeaderSearchBox";
import { UserMenu } from "./UserMenu";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <>
      <header className="bg-white/95 backdrop-blur sticky top-0 z-40 border-b border-ink-200/70">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="Trao Tay - Trang chủ">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/icon_512.png" alt="Logo Trao Tay" className="w-9 h-9 rounded-md" />
            <span className="font-extrabold text-navy text-lg hidden sm:inline tracking-tight">Trao Tay</span>
          </Link>

          <Suspense fallback={<div className="flex-1 max-w-xl h-10 bg-ink-100 rounded-md" />}>
            <HeaderSearchBox />
          </Suspense>

          <nav className="flex items-center gap-2 md:gap-4 text-sm font-medium text-ink-700 shrink-0">
            <Link
              href="/posts/"
              className="hidden md:inline px-2 py-1.5 hover:text-primary transition-colors duration-150 ease-warm"
            >
              Bài đăng
            </Link>
            <a
              href="/tai-app/"
              className="hidden md:inline-flex bg-primary hover:bg-primary-dark active:scale-[0.97] text-white px-4 py-2 rounded-md font-semibold shadow-soft hover:shadow-card transition duration-250 ease-warm"
            >
              Tải app
            </a>
            <UserMenu />
            <button
              type="button"
              aria-label="Mở menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
              className="md:hidden p-2 -mr-2 text-ink-700 hover:text-primary transition-colors"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="4" y1="7"  x2="20" y2="7"/>
                <line x1="4" y1="12" x2="20" y2="12"/>
                <line x1="4" y1="17" x2="14" y2="17"/>
              </svg>
            </button>
          </nav>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            aria-hidden="true"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-ink-900/45 backdrop-blur-sm animate-fade-in"
          />
          <aside className="absolute right-0 top-0 bottom-0 w-72 max-w-[85vw] bg-white shadow-elevated flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-between px-5 h-16 border-b border-ink-200/70">
              <span className="font-extrabold text-navy text-lg tracking-tight">Trao Tay</span>
              <button
                aria-label="Đóng menu"
                onClick={() => setMenuOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-md text-ink-500 hover:bg-ink-100 hover:text-ink-800 text-2xl leading-none transition"
              >×</button>
            </div>
            <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 text-base">
              <Link href="/posts/" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded-md hover:bg-ink-100 text-ink-800 font-medium transition">
                <span className="mr-2.5">📦</span>Bài đăng
              </Link>
              <Link href="/me/" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded-md hover:bg-ink-100 text-ink-800 font-medium transition">
                <span className="mr-2.5">👤</span>Hồ sơ của tôi
              </Link>
              <Link href="/me/posts/" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded-md hover:bg-ink-100 text-ink-800 font-medium transition">
                <span className="mr-2.5">📝</span>Tin của tôi
              </Link>
              <Link href="/notifications/" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded-md hover:bg-ink-100 text-ink-800 font-medium transition">
                <span className="mr-2.5">🔔</span>Thông báo
              </Link>
              <Link href="/favorites/" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded-md hover:bg-ink-100 text-ink-800 font-medium transition">
                <span className="mr-2.5">❤️</span>Bài đã lưu
              </Link>
            </nav>
            <div className="p-4 border-t border-ink-200/70 bg-cream-100">
              <a
                href="/tai-app/"
                className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark active:scale-[0.97] text-white text-center font-semibold px-4 py-3 rounded-md shadow-soft transition duration-250 ease-warm"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20.5V3.5c0-.8.5-1.2 1.1-.9l14.4 8.5c.7.4.7 1.4 0 1.8L4.1 21.4c-.6.3-1.1-.1-1.1-.9z"/></svg>
                Tải app Android
              </a>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
