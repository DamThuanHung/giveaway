/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone — Next.js Node.js server, nginx reverse proxy sang port 3000.
  // Bài đăng mới render on-demand ngay lập tức (không cần cron rebuild).
  output: 'standalone',
  images: { unoptimized: true },
  // Mã nguồn khai báo MỌI canonical / sơ đồ trang / link nội bộ có dấu "/" cuối (quy ước từ thời
  // static export). Thiếu dòng này thì Next chuyển /x/ → /x (308) nên canonical và sitemap trỏ vào
  // URL bị redirect (phát hiện 2026-11-11, cả 61 link bài trong sitemap bị 308).
  trailingSlash: true,
};

export default nextConfig;
