"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export function HeaderSearchBox() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState("");

  useEffect(() => {
    setQ(params.get("q") ?? "");
  }, [params]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    router.push(term ? `/posts/?q=${encodeURIComponent(term)}` : "/posts/");
  }

  return (
    <form onSubmit={onSubmit} className="flex-1 max-w-xl">
      <div className="relative">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm đồ cũ, đồ tặng, dịch vụ..."
          className="w-full bg-cream-100 border border-ink-200 hover:border-ink-300 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary-200 rounded-md pl-10 pr-3 py-2.5 text-sm focus:outline-none transition duration-250 ease-warm"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>
    </form>
  );
}
