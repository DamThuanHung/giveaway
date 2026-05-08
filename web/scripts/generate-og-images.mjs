#!/usr/bin/env node
/**
 * Generate OG images cho mỗi post sau next build.
 *
 * Output: web/out/og/{postId}.png — 1200x630 PNG.
 * Reference: meta og:image trong app/posts/[id]/page.tsx.
 *
 * Why pre-generate: web dùng output:'export' static — không có Node runtime
 * trên server, không thể dùng @vercel/og Edge endpoint. Pre-generate ở build
 * time để mỗi post có banner đẹp khi share Zalo/FB.
 *
 * Cron 1h rebuild → posts mới sẽ có OG image trong vòng 1 giờ.
 */
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "out", "og");
const FONT_DIR = join(ROOT, "public", "fonts");
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.traotay.com.vn";

const W = 1200;
const H = 630;

// Category code → tiếng Việt — match `web/lib/api.ts` CATEGORIES.
// Sync khi thay đổi 18 category trong app/lib/data/categories.dart.
const CATEGORIES = {
  electronics: "Điện tử",
  furniture: "Nội thất",
  clothing: "Thời trang",
  kitchen: "Gia dụng",
  books: "Sách",
  toys: "Đồ chơi",
  sports: "Thể thao",
  vehicles: "Xe cộ",
  beauty: "Làm đẹp",
  pets: "Thú cưng",
  tools: "Đồ nghề",
  food: "Thực phẩm",
  baby: "Mẹ & Bé",
  music: "Nhạc cụ",
  realestate: "Bất động sản",
  service: "Rao dịch vụ",
  jobs: "Việc làm",
  other: "Khác",
};

function formatVND(price) {
  if (!price || price === 0) return "Miễn phí";
  if (price >= 1_000_000_000) return `${(price / 1_000_000_000).toFixed(1)}tỷ`;
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)}tr`;
  if (price >= 1000) return `${Math.round(price / 1000)}k`;
  return `${price}đ`;
}

function truncate(s, max) {
  if (!s) return "";
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function fetchImageDataUri(url) {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "image/jpeg";
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${ct};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

function template({ title, price, location, category, imageDataUri }) {
  // Layout 1200x630 — left 60% banner image với gradient overlay,
  // right 40% panel màu emerald primary với info.
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        width: "100%",
        height: "100%",
        background: "#FAF7F2", // cream surface
        fontFamily: "Be Vietnam Pro",
      },
      children: [
        // ── Left image ─────────────────────────────────────────
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              width: "720px",
              height: "100%",
              position: "relative",
              background: imageDataUri
                ? `linear-gradient(180deg, rgba(20,20,20,0.0) 50%, rgba(20,20,20,0.6) 100%), url(${imageDataUri})`
                : "linear-gradient(135deg, #10B981 0%, #047857 100%)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            },
            children: [
              // brand top-left
              {
                type: "div",
                props: {
                  style: {
                    position: "absolute",
                    top: "32px",
                    left: "32px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    background: "rgba(255,255,255,0.95)",
                    padding: "10px 18px",
                    borderRadius: "999px",
                    fontSize: "22px",
                    fontWeight: 700,
                    color: "#047857",
                  },
                  children: "🎁 Trao Tay",
                },
              },
              // category bottom-left
              category && {
                type: "div",
                props: {
                  style: {
                    position: "absolute",
                    bottom: "32px",
                    left: "32px",
                    background: "rgba(0,0,0,0.65)",
                    color: "#fff",
                    padding: "6px 16px",
                    borderRadius: "999px",
                    fontSize: "20px",
                    fontWeight: 400,
                  },
                  children: category,
                },
              },
            ].filter(Boolean),
          },
        },
        // ── Right info panel ───────────────────────────────────
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              width: "480px",
              height: "100%",
              padding: "48px 40px",
              background: "#FAF7F2",
            },
            children: [
              // Title (top)
              {
                type: "div",
                props: {
                  style: {
                    fontSize: "32px",
                    fontWeight: 700,
                    color: "#1F2937",
                    lineHeight: 1.25,
                    display: "-webkit-box",
                    overflow: "hidden",
                  },
                  children: truncate(title, 80),
                },
              },
              // Price + location (bottom)
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          fontSize: "56px",
                          fontWeight: 700,
                          color: "#047857",
                          lineHeight: 1,
                        },
                        children: formatVND(price),
                      },
                    },
                    location && {
                      type: "div",
                      props: {
                        style: {
                          fontSize: "22px",
                          color: "#6B7280",
                          fontWeight: 400,
                        },
                        children: `📍 ${location}`,
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          fontSize: "16px",
                          color: "#9CA3AF",
                          fontWeight: 400,
                          marginTop: "8px",
                          paddingTop: "16px",
                          borderTop: "1px solid #E5E7EB",
                        },
                        children: "traotay.com.vn — Đồ cũ người này, Báu vật người kia",
                      },
                    },
                  ].filter(Boolean),
                },
              },
            ],
          },
        },
      ],
    },
  };
}

async function renderPng(post, fonts) {
  const imageDataUri = post.imageUrl ? await fetchImageDataUri(post.imageUrl) : null;

  const node = template({
    title: post.title || "(không tên)",
    price: post.price,
    location: post.province || "",
    category: CATEGORIES[post.itemCategory] || post.itemCategory,
    imageDataUri,
  });

  const svg = await satori(node, {
    width: W,
    height: H,
    fonts,
  });

  const png = new Resvg(svg, {
    fitTo: { mode: "width", value: W },
  })
    .render()
    .asPng();

  return png;
}

async function main() {
  const startedAt = Date.now();
  console.log(`[og] Loading fonts from ${FONT_DIR}...`);
  const [regular, bold] = await Promise.all([
    readFile(join(FONT_DIR, "BeVietnamPro-Regular.ttf")),
    readFile(join(FONT_DIR, "BeVietnamPro-Bold.ttf")),
  ]);
  const fonts = [
    { name: "Be Vietnam Pro", data: regular, weight: 400, style: "normal" },
    { name: "Be Vietnam Pro", data: bold, weight: 700, style: "normal" },
  ];

  console.log(`[og] Fetching post list (paginated from ${API_BASE}/post)...`);
  // Paginate /post — match cách fetchAllPostIds trong lib/api.ts.
  // Lấy luôn full post object để tránh N+1 fetch /post/:id.
  const posts = [];
  const LIMIT = 100;
  const MAX_POSTS = 2000;
  let page = 1;
  while (posts.length < MAX_POSTS) {
    const res = await fetchJson(`${API_BASE}/post?page=${page}&limit=${LIMIT}`);
    const data = res.data || [];
    if (data.length === 0) break;
    posts.push(...data);
    if (data.length < LIMIT) break;
    page++;
  }
  console.log(`[og] Got ${posts.length} posts`);

  await mkdir(OUT_DIR, { recursive: true });

  let ok = 0;
  let skipped = 0;
  let failed = 0;

  for (const post of posts) {
    const outPath = join(OUT_DIR, `${post.id}.png`);
    try {
      if (post.status === "deleted_by_admin") {
        skipped++;
        continue;
      }
      const png = await renderPng(post, fonts);
      await writeFile(outPath, png);
      ok++;
    } catch (e) {
      failed++;
      console.warn(`[og] FAIL ${post.id}: ${e.message}`);
    }
  }

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`[og] Done in ${elapsed}s — ok=${ok} skipped=${skipped} failed=${failed}`);
  if (failed > 0 && ok === 0) {
    process.exit(1); // toàn bộ fail → exit non-zero để cron log warning
  }
}

main().catch((e) => {
  console.error("[og] Fatal:", e);
  process.exit(1);
});
