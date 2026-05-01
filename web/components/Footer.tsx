import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-navy text-white/70 mt-20 pt-14 pb-5">
      <div className="max-w-6xl mx-auto px-4 flex flex-wrap gap-10 justify-between mb-8">
        <div className="flex items-start gap-3">
          <img src="/assets/icon_512.png" alt="Trao Tay" className="w-10 h-10 rounded-lg" />
          <div>
            <div className="text-white font-extrabold">Trao Tay</div>
            <div className="text-sm italic mt-0.5">
              "Đồ cũ người này, Báu vật người kia"
            </div>
          </div>
        </div>
        <nav className="flex flex-col gap-2 text-sm">
          <Link href="/posts/" className="hover:text-primary">
            Xem tin đăng
          </Link>
          <Link href="/privacy.html" className="hover:text-primary">
            Chính sách quyền riêng tư
          </Link>
          <Link href="/terms.html" className="hover:text-primary">
            Điều khoản sử dụng
          </Link>
          <Link href="/delete-account.html" className="hover:text-primary">
            Xóa tài khoản
          </Link>
          <a href="mailto:damhungtpt@gmail.com" className="hover:text-primary">
            damhungtpt@gmail.com
          </a>
        </nav>
      </div>
      <div className="text-center text-xs text-white/50 pt-5 border-t border-white/10">
        © 2026 Trao Tay. Mọi quyền được bảo lưu.
      </div>
    </footer>
  );
}
