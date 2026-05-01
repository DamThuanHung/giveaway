"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { authFetch } from "@/lib/auth";

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
    if (pending) return;
    const wasActive = active;
    setActive(!wasActive); // optimistic
    setPending(true);
    try {
      const res = await authFetch("/favorite", {
        method: wasActive ? "DELETE" : "POST",
        body: JSON.stringify({ postId }),
      });
      if (!res.ok) {
        // Revert
        setActive(wasActive);
        return;
      }
      const cache = loadCache();
      if (wasActive) cache.delete(postId);
      else cache.add(postId);
      saveCache();
    } catch {
      setActive(wasActive);
    } finally {
      setPending(false);
    }
  }

  const sizeClass =
    size === "sm" ? "w-8 h-8 text-base" : size === "lg" ? "w-12 h-12 text-2xl" : "w-10 h-10 text-xl";

  return (
    <button
      onClick={toggle}
      disabled={pending}
      aria-label={active ? "Bỏ khỏi đã lưu" : "Lưu bài"}
      className={`${sizeClass} ${className} flex items-center justify-center rounded-full bg-white/95 hover:bg-white border border-gray-200 shadow-sm hover:shadow transition disabled:opacity-50 ${active ? "text-rose-500" : "text-gray-400 hover:text-rose-500"}`}
    >
      {active ? "❤️" : "🤍"}
    </button>
  );
}
