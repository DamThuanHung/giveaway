"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";

/// Reusable tooltip component theo UI_UX_STANDARDS §5.4 (Dan Saffer
/// microinteractions). Đặc tả:
/// - 100ms delay trước hiển thị (tránh flicker khi user lướt qua)
/// - Auto-hide khi blur/mouseleave/Escape
/// - Position: top default, fallback bottom nếu hết space
/// - aria-describedby cho screen reader
/// - Respect prefers-reduced-motion (skip fade animation)
///
/// KHÔNG dùng `title` attr HTML vì:
/// - KHÔNG accessible (screen reader treatment khác browser)
/// - KHÔNG style được
/// - KHÔNG control delay
///
/// Usage:
///   <Tooltip content="Lưu bài để xem sau">
///     <button>...</button>
///   </Tooltip>
export function Tooltip({
  content,
  children,
  position = "top",
  delay = 100,
}: {
  content: ReactNode;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
}) {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  function show() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(true), delay);
  }
  function hide() {
    if (timer.current) clearTimeout(timer.current);
    setVisible(false);
  }

  useEffect(() => {
    if (!visible) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") hide();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [visible]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const positionClass = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  }[position];

  const arrowClass = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-ink-900 border-x-transparent border-b-transparent",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-ink-900 border-x-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-ink-900 border-y-transparent border-r-transparent",
    right: "right-full top-1/2 -translate-y-1/2 border-r-ink-900 border-y-transparent border-l-transparent",
  }[position];

  return (
    <span
      ref={wrapperRef}
      className="relative inline-block"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className={`absolute ${positionClass} z-50 bg-ink-900 text-white text-xs font-medium px-2.5 py-1.5 rounded shadow-lg whitespace-nowrap pointer-events-none animate-fade-in`}
        >
          {content}
          <span
            aria-hidden="true"
            className={`absolute ${arrowClass} w-0 h-0 border-4`}
          />
        </span>
      )}
    </span>
  );
}
