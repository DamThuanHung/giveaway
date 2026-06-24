import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Trao Tay — Chợ đồ cũ & trao tặng miễn phí",
    short_name: "Trao Tay",
    description:
      "Trao Tay — Chợ đồ cũ & trao tặng đồ miễn phí gần bạn. Đăng tin miễn phí, chat trực tiếp, tìm theo khu vực.",
    start_url: "/",
    display: "standalone",
    background_color: "#10B981",
    theme_color: "#10B981",
    orientation: "portrait-primary",
    lang: "vi",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
