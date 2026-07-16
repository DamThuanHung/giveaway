import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FreshFeaturedPosts } from "@/components/FreshFeaturedPosts";
import { fetchPosts } from "@/lib/api";

export default async function HomePage() {
  const posts = await fetchPosts({ page: 1, limit: 8 }).catch(() => null);
  const featuredPosts = posts?.data ?? [];

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Trao Tay",
    url: "https://traotay.com.vn",
    logo: "https://traotay.com.vn/assets/icon_512.png",
    description: "Chợ đồ cũ & trao tặng miễn phí cho người Việt",
  };
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Trao Tay",
    url: "https://traotay.com.vn",
    inLanguage: "vi-VN",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://traotay.com.vn/posts/?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <Header />

      {/* Hero */}
      <section className="bg-gradient-hero py-16 md:py-24 lg:py-28 relative overflow-hidden">
        {/* Decorative blobs */}
        <div aria-hidden="true" className="absolute -top-20 -right-20 w-80 h-80 bg-primary-200/30 rounded-full blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-32 -left-20 w-96 h-96 bg-cream-300/40 rounded-full blur-3xl" />

        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center relative">
          <div className="animate-slide-in-up">
            <span className="inline-flex items-center gap-1.5 bg-primary-100 text-primary-800 text-sm font-semibold italic px-3.5 py-1.5 rounded-full mb-6 shadow-soft">
              <span className="text-primary-600">✨</span>
              "Đồ cũ người này, Báu vật người kia"
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-ink-900 leading-[1.08] mb-6 tracking-tight text-balance">
              Mua bán &amp;{" "}
              <span className="text-primary-600 relative inline-block">
                trao tặng
                <svg
                  aria-hidden="true"
                  className="absolute -bottom-1.5 left-0 w-full h-2"
                  viewBox="0 0 100 8"
                  preserveAspectRatio="none"
                >
                  <path d="M1,5 Q25,1 50,4 T99,5" stroke="#A7F3D0" strokeWidth="3" fill="none" strokeLinecap="round" />
                </svg>
              </span>
              <br />
              đồ cũ gần bạn
            </h1>
            <p className="text-lg text-ink-600 mb-8 max-w-lg leading-relaxed">
              Trao Tay giúp bạn tặng, bán, tìm đồ cũ theo khu vực — miễn phí,
              đơn giản, hoàn toàn tiếng Việt. Đừng lãng phí những món đồ còn dùng tốt.
            </p>
            <div className="flex flex-wrap gap-3 mb-5">
              <a
                href="/tai-app/"
                className="bg-primary hover:bg-primary-dark active:scale-[0.97] text-white font-semibold px-6 py-3.5 rounded-md shadow-card hover:shadow-elevated transition duration-250 ease-warm flex items-center gap-2"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20.5V3.5c0-.8.5-1.2 1.1-.9l14.4 8.5c.7.4.7 1.4 0 1.8L4.1 21.4c-.6.3-1.1-.1-1.1-.9z"/></svg>
                Tải trên Google Play
              </a>
              <Link
                href="/posts/"
                className="bg-white border border-ink-200 hover:border-primary hover:text-primary text-ink-800 font-semibold px-6 py-3.5 rounded-md transition duration-250 ease-warm shadow-soft hover:shadow-card"
              >
                Xem bài đăng →
              </Link>
            </div>
            <p className="text-sm text-ink-500 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Miễn phí · Không phí đăng tin · Không phí thành viên
            </p>
          </div>
          <div className="hidden md:flex justify-center relative">
            <div aria-hidden="true" className="absolute inset-0 bg-primary-100/60 rounded-3xl rotate-6 max-w-[280px] mx-auto" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/screen-home.png"
              alt="Trang chủ Trao Tay"
              className="max-w-[280px] drop-shadow-2xl relative animate-slide-in-up"
            />
          </div>
        </div>
      </section>

      {/* Featured posts */}
      {featuredPosts.length > 0 && (
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-ink-900 tracking-tight mb-1.5">
                  Bài đăng mới nhất
                </h2>
                <p className="text-ink-500 text-sm">Cập nhật theo thời gian thực từ cộng đồng</p>
              </div>
              <Link href="/posts/" className="text-primary-600 hover:text-primary-700 font-semibold whitespace-nowrap transition-colors">
                Xem tất cả →
              </Link>
            </div>
            <FreshFeaturedPosts initial={featuredPosts} limit={8} />
          </div>
        </section>
      )}

      {/* Đặc định kỹ năng promo */}
      <section className="py-14 md:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-gradient-hero rounded-2xl border border-primary-200/60 p-8 md:p-10 shadow-soft">
            <span className="inline-flex items-center gap-1.5 bg-primary-100 text-primary-800 text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full mb-4">
              🇯🇵 Tính năng mới
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-ink-900 mb-3 tracking-tight text-balance">
              Luyện thi Đặc định kỹ năng ngành nhà hàng
            </h2>
            <p className="text-ink-600 mb-6 max-w-xl leading-relaxed">
              Ôn tập song ngữ Việt–Nhật cho kỳ thi 外食業特定技能２号技能測定試験, bám sát tài liệu học chính thức OTAFF —
              trắc nghiệm, dịch câu, sắp xếp câu, từ vựng. Miễn phí hoàn toàn, chỉ cần đăng nhập Trao Tay để bắt đầu làm bài.
            </p>
            <Link
              href="/dac-dinh/"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark active:scale-[0.97] text-white font-semibold px-6 py-3 rounded-md shadow-card hover:shadow-elevated transition duration-250 ease-warm"
            >
              Bắt đầu luyện thi →
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-24 bg-cream-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-ink-900 tracking-tight mb-4 text-balance">
              Mọi thứ bạn cần cho chợ đồ cũ
            </h2>
            <p className="text-ink-600 text-base md:text-lg">
              6 tính năng cốt lõi giúp bạn tặng, bán, mua đồ cũ dễ như nhắn tin.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              ["🛒", "Mua đồ cũ giá tốt", "Điện tử, nội thất, thời trang, sách, đồ gia dụng — đủ mọi danh mục."],
              ["🎁", "Trao tặng miễn phí", "Đồ không dùng nữa, tặng cho người cần thay vì vứt bỏ."],
              ["💬", "Chat trực tiếp", "Nhắn tin thương lượng với người bán ngay trong app, realtime."],
              ["📍", "Tìm theo khu vực", "Lọc bài đăng gần bạn, xem trên bản đồ, thuận tiện gặp mặt giao dịch."],
              ["⭐", "Đánh giá người bán", "Mỗi giao dịch có nhận xét — xây dựng cộng đồng tin cậy."],
              ["🔔", "Thông báo tức thì", "Nhận tin nhắn, cảnh báo khi có bài mới khớp từ khóa bạn quan tâm."],
            ].map(([icon, title, desc]) => (
              <div
                key={title}
                className="bg-white border border-ink-200/70 hover:border-primary/60 hover:shadow-card rounded-md p-6 transition duration-250 ease-warm"
              >
                <div className="w-12 h-12 rounded-md bg-primary-100 flex items-center justify-center text-2xl mb-4">
                  {icon}
                </div>
                <h3 className="font-bold text-ink-900 mb-2">{title}</h3>
                <p className="text-ink-600 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 md:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-extrabold text-ink-900 text-center mb-12 tracking-tight">
            Câu hỏi thường gặp
          </h2>
          <div className="space-y-2.5">
            {[
              ["Trao Tay có thật sự miễn phí không?", "Có. Đăng tin, tìm kiếm, chat — tất cả miễn phí. Bạn chỉ trả khi muốn đẩy bài lên đầu danh sách (gói Plus/VIP, từ 5.000đ)."],
              ["Tôi có cần xác minh danh tính không?", "Đăng nhập bằng email hoặc số điện thoại qua mã OTP — không cần CCCD, không cần liên kết tài khoản ngân hàng."],
              ["Trao Tay có khác gì so với chợ Tốt hoặc Facebook Marketplace?", "Trao Tay tập trung vào cộng đồng cho-tặng nhiều hơn (đồ cũ thật, người Việt thật), giao diện đơn giản tiếng Việt, không có quảng cáo che mặt nội dung."],
              ["Làm sao để tránh lừa đảo khi giao dịch?", "Hệ thống đánh giá 2 chiều giúp bạn xem điểm uy tín. Khuyến nghị: gặp mặt trực tiếp ở nơi công cộng, kiểm tra hàng trước khi trả tiền, không chuyển khoản trước khi nhận đồ."],
              ["Bài đăng tồn tại bao lâu?", "Bài đăng tự động ẩn sau 30 ngày không hoạt động. Bạn có thể đăng lại miễn phí hoặc dùng gói đẩy để giữ ở đầu danh sách."],
              ["Tôi muốn xóa tài khoản thì sao?", "Vào app → Hồ sơ → Xóa tài khoản. Hoặc vào trang xóa tài khoản online. Toàn bộ dữ liệu cá nhân sẽ bị xóa trong 30 ngày."],
            ].map(([q, a]) => (
              <details
                key={q}
                className="bg-cream-100 open:bg-white border border-ink-200/70 hover:border-ink-300 open:border-primary/60 open:shadow-soft rounded-md group transition duration-250 ease-warm"
              >
                <summary className="cursor-pointer p-5 font-semibold text-ink-900 flex justify-between items-center list-none gap-4">
                  <span>{q}</span>
                  <span className="text-primary-600 text-2xl group-open:rotate-45 transition-transform duration-250 ease-warm shrink-0">+</span>
                </summary>
                <p className="px-5 pb-5 text-ink-600 leading-relaxed text-[15px]">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-cta text-white py-20 md:py-24 relative overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="white"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)"/>
          </svg>
        </div>
        <div className="max-w-3xl mx-auto px-4 text-center relative">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-8 leading-tight tracking-tight text-balance">
            Sẵn sàng cho một cộng đồng
            <br />
            tiêu dùng thông minh hơn?
          </h2>
          <a
            href="/tai-app/"
            className="inline-flex items-center gap-2 bg-white hover:bg-cream-100 text-primary-700 font-bold text-lg px-10 py-4 rounded-md shadow-elevated hover:shadow-float transition duration-250 ease-warm"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20.5V3.5c0-.8.5-1.2 1.1-.9l14.4 8.5c.7.4.7 1.4 0 1.8L4.1 21.4c-.6.3-1.1-.1-1.1-.9z"/></svg>
            Tải Trao Tay ngay
          </a>
        </div>
      </section>

      <Footer />
    </>
  );
}
