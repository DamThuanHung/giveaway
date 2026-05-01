/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export — không cần Node.js server, nginx serve thẳng folder out/.
  // Posts mới appear sau mỗi lần rebuild (cron 1h).
  output: 'export',
  // Required với output:'export' vì <Image> cần optimization server.
  images: { unoptimized: true },
  // Trailing slash để nginx match dễ hơn (mỗi page là folder/index.html).
  trailingSlash: true,
};

export default nextConfig;
