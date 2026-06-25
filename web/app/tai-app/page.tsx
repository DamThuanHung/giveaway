import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DownloadAppButton } from "@/components/DownloadAppButton";

export const metadata: Metadata = {
  title: "Tải app Trao Tay — Android APK",
  description:
    "Tải app Trao Tay cho Android. Chat realtime, nhận thông báo tức thì khi có người quan tâm tới bài đăng của bạn.",
  openGraph: {
    title: "Tải app Trao Tay — Android APK",
    description:
      "Chat realtime, nhận thông báo tức thì khi có người quan tâm tới bài đăng của bạn.",
    url: "https://traotay.com.vn/tai-app/",
    images: [{ url: "https://traotay.com.vn/assets/icon_512.png" }],
  },
};

const APK_URL = `${process.env.NEXT_PUBLIC_API_URL ?? "https://api.traotay.com.vn"}/download/android`;

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
              <DownloadAppButton
                platform="android"
                href={APK_URL}
                className="inline-block mt-4 bg-primary hover:bg-primary-dark active:scale-[0.97] text-white text-sm font-semibold px-5 py-3 rounded-md shadow-soft hover:shadow-card transition duration-150 ease-warm"
              >
                ⬇️ Tải APK cho Android
              </DownloadAppButton>
              <details className="mt-4 text-sm text-ink-600">
                <summary className="cursor-pointer font-medium text-ink-700 hover:text-ink-900">
                  Hướng dẫn cài đặt (lần đầu cần bật &quot;Cài từ nguồn không xác định&quot;)
                </summary>
                <ol className="list-decimal list-inside mt-2 space-y-1.5 text-ink-600">
                  <li>Bấm nút &quot;Tải APK cho Android&quot; ở trên, chờ tải xong.</li>
                  <li>Mở file vừa tải trong mục Thông báo hoặc Tệp tải xuống.</li>
                  <li>
                    Nếu điện thoại cảnh báo &quot;Không thể cài đặt ứng dụng không xác định&quot; —
                    chọn <span className="font-medium">Cài đặt</span> →{" "}
                    <span className="font-medium">Cho phép từ nguồn này</span>, sau đó quay lại cài như bình thường.
                  </li>
                  <li>Bấm Cài đặt và mở app — đăng nhập bằng số điện thoại hoặc email.</li>
                </ol>
              </details>
            </div>
          </div>
        </div>

        {/* iOS — PWA qua Safari, bản native đang chờ Apple duyệt */}
        <div className="bg-white border border-ink-200/70 rounded-md shadow-soft p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="text-3xl shrink-0">🍎</div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-ink-900">iOS (iPhone/iPad)</h2>
              <p className="text-sm text-ink-600 mt-1">
                Bản app native đang chờ Apple duyệt. Trong lúc chờ, anh chị có thể thêm Trao Tay
                vào màn hình chính — mở như app thật, đầy đủ tính năng đăng bài, chat, yêu thích,
                thông báo.
              </p>
              <details className="mt-4 text-sm text-ink-600">
                <summary className="cursor-pointer font-medium text-ink-700 hover:text-ink-900">
                  Hướng dẫn thêm vào màn hình chính (mất chưa đầy 1 phút)
                </summary>
                <ol className="list-decimal list-inside mt-2 space-y-1.5 text-ink-600">
                  <li>
                    Mở <span className="font-medium">traotay.com.vn</span> bằng trình duyệt{" "}
                    <span className="font-medium">Safari</span> (bắt buộc Safari, Chrome/Firefox
                    trên iOS không hỗ trợ bước này).
                  </li>
                  <li>
                    Bấm nút <span className="font-medium">Chia sẻ</span> (hình vuông có mũi tên
                    hướng lên) ở thanh dưới màn hình.
                  </li>
                  <li>
                    Cuộn xuống chọn{" "}
                    <span className="font-medium">Thêm vào màn hình chính</span> (Add to Home
                    Screen).
                  </li>
                  <li>Bấm Thêm — icon Trao Tay sẽ xuất hiện trên màn hình chính như app thật.</li>
                  <li>
                    Mở từ icon đó để vào thẳng app, không hiện thanh địa chỉ Safari.
                  </li>
                </ol>
              </details>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
