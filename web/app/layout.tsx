import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import { CloudflareAnalytics } from "@/components/CloudflareAnalytics";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#10B981",
};

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-be-vietnam-pro",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://traotay.com.vn"),
  title: {
    default: "Trao Tay — Chợ đồ cũ & trao tặng miễn phí cho người Việt",
    template: "%s · Trao Tay",
  },
  description:
    'Trao Tay — Chợ đồ cũ & trao tặng đồ miễn phí gần bạn. Đăng tin miễn phí, chat trực tiếp, tìm theo khu vực. "Đồ cũ người này, Báu vật người kia."',
  keywords: [
    "đồ cũ",
    "mua bán đồ cũ",
    "tặng miễn phí",
    "trao tặng",
    "chợ đồ cũ",
    "thanh lý",
    "second hand",
    "rao vặt Việt Nam",
    "trao tay",
  ],
  authors: [{ name: "Trao Tay" }],
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://traotay.com.vn",
    siteName: "Trao Tay",
    title: "Trao Tay — Chợ đồ cũ & trao tặng miễn phí",
    description:
      'Đồ cũ người này, Báu vật người kia. Tặng, bán, tìm đồ cũ theo khu vực — miễn phí.',
    images: ["/assets/icon_512.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trao Tay — Chợ đồ cũ & trao tặng miễn phí",
    description: "Đồ cũ người này, Báu vật người kia.",
    images: ["/assets/icon_512.png"],
  },
  icons: { icon: "/assets/icon_512.png", apple: "/icons/icon-192.png" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Trao Tay",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={beVietnamPro.variable}>
      <body className="font-sans bg-gray-50 text-gray-900 antialiased">
        <AuthProvider>{children}</AuthProvider>
        <CloudflareAnalytics />
      </body>
    </html>
  );
}
