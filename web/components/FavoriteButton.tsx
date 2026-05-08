"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { authFetch } from "@/lib/auth";
import { Tooltip } from "./Tooltip";

const FAV_CACHE_KEY = "traotay_favorites";

/// Cache local IDs đã favorite — tránh fetch GET /favorite/:userId mỗi lần render PostCard.
/// Sync khi mount (gọi 1 lần) + khi add/remove (optimistic).
let memoryCache: Set<string> | null = null;

function loadCache(): Set<string> {
  if (memoryCache) return memoryCache;
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(FAV_CACHE_KEY);
    memoryCache = new Set(raw ? JSON.parse(raw) : []);
  } catch {
    memoryCache = new Set();
  }
  return memoryCache;
}

function saveCache() {
  if (memoryCache) {
    localStorage.setItem(FAV_CACHE_KEY, JSON.stringify(Array.from(memoryCache)));
    window.dispatchEvent(new Event("traotay:favorites"));
  }
}

export async function syncFavoritesFromServer(userId: string) {
  try {
    const res = await authFetch(`/favorite/${userId}`);
    if (!res.ok) return;
    const data = await res.json();
    const ids: string[] = (Array.isArray(data) ? data : data.data ?? []).map(
      (f: any) => f.postId ?? f.id
    );
    memoryCache = new Set(ids);
    saveCache();
  } catch {
    // silent — user vẫn dùng cache
  }
}

export function isFavorited(postId: string): boolean {
  return loadCache().has(postId);
}

type Props = {
  postId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function FavoriteButton({ postId, size = "md", className = "" }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [pending, setPending] = useState(false);
  // Pulse animation key — change → re-trigger CSS animation
  const [pulseKey, setPulseKey] = useState(0);
  // Rollback flash — show "Không lưu được, đã hoàn tác" inline ngắn
  const [rollbackMsg, setRollbackMsg] = useState<string | null>(null);

  useEffect(() => {
    setActive(isFavorited(postId));
    const onChange = () => setActive(isFavorited(postId));
    window.addEventListener("traotay:favorites", onChange);
    return () => window.removeEventListener("traotay:favorites", onChange);
  }, [postId]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      router.push(`/login/?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    // KHÔNG block rapid click — chỉ guard duplicate inflight với flag pending,
    // nhưng vẫn cho UI react ngay (optimistic). Nếu user spam click, AbortController
    // sẽ nice-to-have sau (G-04 microinteractions sprint 2).
    if (pending) return;

    const wasActive = active;
    // OPTIMISTIC: update UI + cache ngay, KHÔNG đợi server
    setActive(!wasActive);
    setPulseKey((k) => k + 1); // trigger pulse animation
    const cache = loadCache();
    if (wasActive) cache.delete(postId);
    else cache.add(postId);
    saveCache();

    setPending(true);
    try {
      const res = await authFetch("/favorite", {
        method: wasActive ? "DELETE" : "POST",
        body: JSON.stringify({ postId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      // ROLLBACK: revert UI + cache
      setActive(wasActive);
      const c = loadCache();
      if (wasActive) c.add(postId);
      else c.delete(postId);
      saveCache();
      setRollbackMsg(wasActive ? "Không bỏ lưu được" : "Không lưu được");
      setTimeout(() => setRollbackMsg(null), 2500);
    } finally {
      setPending(false);
    }
  }

  const sizeClass =
    size === "sm" ? "w-8 h-8 text-base" : size === "lg" ? "w-12 h-12 text-2xl" : "w-10 h-10 text-xl";

  return (
    <Tooltip content={active ? "Bỏ khỏi đã lưu" : "Lưu bài để xem sau"} position="top">
      <button
        onClick={toggle}
        aria-label={active ? "Bỏ khỏi đã lưu" : "Lưu bài"}
        aria-pressed={active}
        className={`${sizeClass} ${className} flex items-center justify-center rounded-full bg-white/95 hover:bg-white border border-gray-200 shadow-sm hover:shadow transition active:scale-90 ${active ? "text-rose-500" : "text-gray-400 hover:text-rose-500"}`}
      >
        <span
          key={pulseKey}
          className={active && pulseKey > 0 ? "fav-pulse" : ""}
          aria-hidden="true"
        >
          {active ? "❤️" : "🤍"}
        </span>
        {rollbackMsg && (
          <span
            role="alert"
            aria-live="polite"
            className="absolute top-full mt-1 right-0 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded shadow-lg whitespace-nowrap z-10 animate-fade-in"
          >
            {rollbackMsg}
          </span>
        )}
      </button>
    </Tooltip>
  );
}
