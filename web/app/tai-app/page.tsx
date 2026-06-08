"use client";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const APK_URL = "https://api.traotay.com.vn/download/android";

export default function TaiAppPage() {
  return (
    <>
      <Header />

      <section className="bg-gradient-warm border-b border-ink-200/50">
        <div className="max-w-3xl mx-auto px-4 py-12 md:py-16 text-center">
          <div className="text-5xl mb-3">📱</div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-ink-900 tracking-tight">
            Tải app Trao Tay về điện thoại
          </h1>
          <p className="text-ink-600 mt-3 max-w-xl mx-auto">
            Chat realtime, nhận thông báo tức thì khi có người quan tâm tới bài đăng của bạn —
            trải nghiệm mượt hơn hẳn trên web.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        {/* Android — tải trực tiếp APK */}
        <div className="bg-white border border-ink-200/70 rounded-md shadow-soft p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="text-3xl shrink-0">🤖</div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-ink-900">Android</h2>
              <p className="text-sm text-ink-600 mt-1">
                Tải file APK và cài trực tiếp — không cần qua Play Store.
              </p>
              <a
                href={APK_URL}
                className="inline-block mt-4 bg-primary hover:bg-primary-dark active:scale-[0.97] text-white text-sm font-semibold px-5 py-3 rounded-md shadow-soft hover:shadow-card transition duration-150 ease-warm"
              >
                ⬇️ Tải APK cho Android
              </a>
              <details className="mt-4 text-sm text-ink-600">
                <summary className="cursor-pointer font-medium text-ink-700 hover:text-ink-900">
                  Hướng dẫn cài đặt (lần đầu cần bật "Cài từ nguồn không xác định")
                </summary>
                <ol className="list-decimal list-inside mt-2 space-y-1.5 text-ink-600">
                  <li>Bấm nút "Tải APK cho Android" ở trên, chờ tải xong.</li>
                  <li>Mở file vừa tải trong mục Thông báo hoặc Tệp tải xuống.</li>
                  <li>
                    Nếu điện thoại cảnh báo "Không thể cài đặt ứng dụng không xác định" —
                    chọn <span className="font-medium">Cài đặt</span> →{" "}
                    <span className="font-medium">Cho phép từ nguồn này</span>, sau đó quay lại cài như bình thường.
                  </li>
                  <li>Bấm Cài đặt và mở app — đăng nhập bằng số điện thoại hoặc email.</li>
                </ol>
              </details>
            </div>
          </div>
        </div>

        {/* iOS */}
        <div className="bg-white border border-ink-200/70 rounded-md shadow-soft p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="text-3xl shrink-0">🍎</div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-ink-900">iOS (iPhone/iPad)</h2>
              <p className="text-sm text-ink-600 mt-1">
                Bản iOS đang được phát triển. Trong lúc chờ, bạn có thể dùng Trao Tay ngay trên
                trình duyệt — đầy đủ tính năng đăng bài, chat, yêu thích.
              </p>
              <a
                href="/"
                className="inline-block mt-4 text-primary-600 hover:text-primary-700 hover:underline font-medium text-sm"
              >
                Vào traotay.com.vn →
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
