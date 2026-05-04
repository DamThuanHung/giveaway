import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FreshFeaturedPosts } from "@/components/FreshFeaturedPosts";
import { fetchPosts } from "@/lib/api";

export default async function HomePage() {
  // Lấy 8 bài VIP/Plus mới nhất hiển thị "nổi bật" trên landing.
  // Build time fetch: posts hiện tại sẽ có trong HTML output.
  const posts = await fetchPosts({ page: 1, limit: 8 }).catch(() => null);
  const featuredPosts = posts?.data ?? [];

  return (
    <>
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-light via-white to-white py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block bg-primary-light text-primary-dark text-sm font-semibold italic px-3 py-1.5 rounded-full mb-5">
              "Đồ cũ người này, Báu vật người kia"
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-navy leading-tight mb-6">
              Mua bán & <span className="text-primary relative inline-block">trao tặng</span>
              <br />
              đồ cũ gần bạn
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-lg">
              Trao Tay giúp bạn tặng, bán, tìm đồ cũ theo khu vực — miễn phí,
              đơn giản, hoàn toàn tiếng Việt. Đừng lãng phí những món đồ còn dùng tốt.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://play.google.com/store/apps/details?id=vn.traotay.app"
                target="_blank"
                rel="noopener"
                className="bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-3 rounded-lg transition flex items-center gap-2"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20.5V3.5c0-.8.5-1.2 1.1-.9l14.4 8.5c.7.4.7 1.4 0 1.8L4.1 21.4c-.6.3-1.1-.1-1.1-.9z"/></svg>
                Tải trên Google Play
              </a>
              <Link
                href="/posts/"
                className="bg-white border border-gray-300 hover:border-primary text-navy font-semibold px-6 py-3 rounded-lg transition"
              >
                Xem tin đăng →
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Miễn phí hoàn toàn · Không phí đăng tin · Không phí thành viên
            </p>
          </div>
          <div className="hidden md:flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/screen-home.png"
              alt="Trang chủ Trao Tay"
              className="max-w-[280px] drop-shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Featured posts */}
      {featuredPosts.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-end justify-between mb-8">
              <h2 className="text-3xl font-extrabold text-navy">Tin đăng mới nhất</h2>
              <Link href="/posts/" className="text-primary font-semibold hover:underline">
                Xem tất cả →
              </Link>
            </div>
            <FreshFeaturedPosts initial={featuredPosts} limit={8} />
          </div>
        </section>
      )}

      {/* Features */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-extrabold text-navy text-center mb-14">
            Mọi thứ bạn cần cho chợ đồ cũ
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              ["🛒", "Mua đồ cũ giá tốt", "Điện tử, nội thất, thời trang, sách, đồ gia dụng — đủ mọi danh mục."],
              ["🎁", "Trao tặng miễn phí", "Đồ không dùng nữa, tặng cho người cần thay vì vứt bỏ."],
              ["💬", "Chat trực tiếp", "Nhắn tin thương lượng với người bán ngay trong app, realtime."],
              ["📍", "Tìm theo khu vực", "Lọc bài đăng gần bạn, xem trên bản đồ, thuận tiện gặp mặt giao dịch."],
              ["⭐", "Đánh giá người bán", "Mỗi giao dịch có nhận xét — xây dựng cộng đồng tin cậy."],
              ["🔔", "Thông báo tức thì", "Nhận tin nhắn, cảnh báo khi có bài mới khớp từ khóa bạn quan tâm."],
            ].map(([icon, title, desc]) => (
              <div key={title} className="bg-white border border-gray-200 rounded-xl p-6 hover:border-primary transition">
                <div className="text-3xl mb-3">{icon}</div>
                <h3 className="font-bold text-navy mb-2">{title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-extrabold text-navy text-center mb-12">
            Câu hỏi thường gặp
          </h2>
          <div className="space-y-3">
            {[
              ["Trao Tay có thật sự miễn phí không?", "Có. Đăng tin, tìm kiếm, chat — tất cả miễn phí. Bạn chỉ trả khi muốn đẩy bài lên đầu danh sách (gói Plus/VIP, từ 5.000đ)."],
              ["Tôi có cần xác minh danh tính không?", "Đăng nhập bằng email hoặc số điện thoại qua mã OTP — không cần CCCD, không cần liên kết tài khoản ngân hàng."],
              ["Trao Tay có khác gì so với chợ Tốt hoặc Facebook Marketplace?", "Trao Tay tập trung vào cộng đồng cho-tặng nhiều hơn (đồ cũ thật, người Việt thật), giao diện đơn giản tiếng Việt, không có quảng cáo che mặt nội dung."],
              ["Làm sao để tránh lừa đảo khi giao dịch?", "Hệ thống đánh giá 2 chiều giúp bạn xem điểm uy tín. Khuyến nghị: gặp mặt trực tiếp ở nơi công cộng, kiểm tra hàng trước khi trả tiền, không chuyển khoản trước khi nhận đồ."],
              ["Bài đăng tồn tại bao lâu?", "Bài đăng tự động ẩn sau 30 ngày không hoạt động. Bạn có thể đăng lại miễn phí hoặc dùng gói đẩy để giữ ở đầu danh sách."],
              ["Tôi muốn xóa tài khoản thì sao?", "Vào app → Hồ sơ → Xóa tài khoản. Hoặc vào trang xóa tài khoản online. Toàn bộ dữ liệu cá nhân sẽ bị xóa trong 30 ngày."],
            ].map(([q, a]) => (
              <details key={q} className="bg-gray-50 open:bg-white open:border-primary border border-gray-200 rounded-xl group transition">
                <summary className="cursor-pointer p-5 font-semibold text-navy flex justify-between items-center list-none">
                  <span>{q}</span>
                  <span className="text-primary text-2xl group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="px-5 pb-5 text-gray-600 leading-relaxed text-[15px]">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy text-white py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-8 leading-tight">
            Sẵn sàng cho một cộng đồng
            <br />
            tiêu dùng thông minh hơn?
          </h2>
          <a
            href="https://play.google.com/store/apps/details?id=vn.traotay.app"
            target="_blank"
            rel="noopener"
            className="inline-block bg-primary hover:bg-primary-dark text-white font-bold text-lg px-10 py-4 rounded-xl transition"
          >
            Tải Trao Tay ngay
          </a>
        </div>
      </section>

      <Footer />
    </>
  );
}
