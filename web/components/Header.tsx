import Link from "next/link";

export function Header() {
  return (
    <header className="bg-white/90 backdrop-blur sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img
            src="/assets/icon_512.png"
            alt="Trao Tay"
            className="w-9 h-9 rounded-lg"
          />
          <span className="font-extrabold text-navy text-lg">Trao Tay</span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-700">
          <Link href="/posts/" className="hover:text-primary">
            Tin đăng
          </Link>
          <Link href="/#features" className="hover:text-primary">
            Tính năng
          </Link>
          <Link href="/#faq" className="hover:text-primary">
            Câu hỏi
          </Link>
          <a
            href="https://play.google.com/store/apps/details?id=vn.traotay.app"
            target="_blank"
            rel="noopener"
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-semibold"
          >
            Tải app
          </a>
        </nav>
      </div>
    </header>
  );
}
