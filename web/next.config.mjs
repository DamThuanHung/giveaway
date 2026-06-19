/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone — Next.js Node.js server, nginx reverse proxy sang port 3000.
  // Bài đăng mới render on-demand ngay lập tức (không cần cron rebuild).
  output: 'standalone',
  images: { unoptimized: true },
};

export default nextConfig;
