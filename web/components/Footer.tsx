import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-ink-900 text-white/70 mt-20 pt-16 pb-6">
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-[1.4fr_1fr_1fr] gap-10 mb-10">
        <div>
          <div className="flex items-start gap-3 mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/icon_512.png" alt="Trao Tay" className="w-11 h-11 rounded-md shadow-card" />
            <div>
              <div className="text-white font-extrabold text-lg tracking-tight">Trao Tay</div>
              <div className="text-sm italic mt-1 text-primary-300">
                "Đồ cũ người này, Báu vật người kia"
              </div>
            </div>
          </div>
          <p className="text-sm text-white/60 leading-relaxed max-w-md">
            Chợ đồ cũ &amp; trao tặng miễn phí cho người Việt. Đơn giản, an toàn,
            hoàn toàn tiếng Việt.
          </p>
        </div>

        <nav className="flex flex-col gap-2.5 text-sm">
          <h3 className="font-semibold text-white mb-1">Liên kết</h3>
          <Link href="/posts/" className="hover:text-primary-300 transition-colors duration-150 ease-warm">
            Xem bài đăng
          </Link>
          <Link href="/privacy.html" className="hover:text-primary-300 transition-colors duration-150 ease-warm">
            Chính sách quyền riêng tư
          </Link>
          <Link href="/terms.html" className="hover:text-primary-300 transition-colors duration-150 ease-warm">
            Điều khoản sử dụng
          </Link>
          <Link href="/delete-account.html" className="hover:text-primary-300 transition-colors duration-150 ease-warm">
            Xóa tài khoản
          </Link>
        </nav>

        <div className="flex flex-col gap-2.5 text-sm">
          <h3 className="font-semibold text-white mb-1">Liên hệ</h3>
          <a
            href="mailto:damhungtpt@gmail.com"
            className="hover:text-primary-300 transition-colors duration-150 ease-warm"
          >
            damhungtpt@gmail.com
          </a>
          <a
            href="/tai-app/"
            className="inline-flex items-center gap-2 mt-2 bg-white/10 hover:bg-white/15 text-white text-sm font-semibold px-3.5 py-2 rounded-md transition duration-250 ease-warm border border-white/15 w-fit"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20.5V3.5c0-.8.5-1.2 1.1-.9l14.4 8.5c.7.4.7 1.4 0 1.8L4.1 21.4c-.6.3-1.1-.1-1.1-.9z"/></svg>
            Tải app Android
          </a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center text-xs text-white/45 pt-6 border-t border-white/10">
          © 2026 Trao Tay. Mọi quyền được bảo lưu.
        </div>
      </div>
    </footer>
  );
}
