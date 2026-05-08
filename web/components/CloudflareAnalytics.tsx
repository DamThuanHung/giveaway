/**
 * Cloudflare Web Analytics — privacy-first, no-cookie tracker.
 *
 * Embed conditional theo env `NEXT_PUBLIC_CF_BEACON_TOKEN`. Khi chưa
 * có token (dev / preview / token chưa generate), component KHÔNG render
 * gì → không log nhầm dev traffic vào dashboard prod.
 *
 * Token lấy từ Cloudflare Dashboard → Analytics & Logs → Web Analytics
 * → Add a site → "traotay.com.vn" → Done. Token nằm trong script tag
 * `data-cf-beacon='{"token":"xxx"}'`.
 *
 * Vì là static export (output:'export'), env phải là `NEXT_PUBLIC_*` và
 * có sẵn lúc next build. Set trong `web/.env.local` trên server, rebuild.
 *
 * Tham khảo upgrade path: docs/ANALYTICS_SETUP.md
 */
export function CloudflareAnalytics() {
  const token = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;
  if (!token) return null;
  return (
    <script
      defer
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={JSON.stringify({ token })}
    />
  );
}
