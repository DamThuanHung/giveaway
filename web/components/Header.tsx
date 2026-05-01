import Link from "next/link";
import { Suspense } from "react";
import { HeaderSearchBox } from "./HeaderSearchBox";
import { UserMenu } from "./UserMenu";

export function Header() {
  return (
    <header className="bg-white/95 backdrop-blur sticky top-0 z-40 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/icon_512.png" alt="Trao Tay" className="w-9 h-9 rounded-lg" />
          <span className="font-extrabold text-navy text-lg hidden sm:inline">Trao Tay</span>
        </Link>

        <Suspense fallback={<div className="flex-1 max-w-xl h-10 bg-gray-50 rounded-lg" />}>
          <HeaderSearchBox />
        </Suspense>

        <nav className="flex items-center gap-3 md:gap-5 text-sm font-medium text-gray-700 shrink-0">
          <Link href="/posts/" className="hidden md:inline hover:text-primary">Tin đăng</Link>
          <a
            href="https://play.google.com/store/apps/details?id=vn.traotay.app"
            target="_blank"
            rel="noopener"
            className="hidden md:inline-flex bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-semibold"
          >
            Tải app
          </a>
          <UserMenu />
        </nav>
      </div>
    </header>
  );
}
