"use client";

import { useEffect, useState } from "react";
import {
  isWebPushSupported,
  getSubscriptionStatus,
  subscribeWebPush,
  unsubscribeWebPush,
} from "@/lib/web-push";

type Status = "loading" | "unsupported" | "denied" | "subscribed" | "default";

export function WebPushToggle() {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isWebPushSupported()) {
        if (!cancelled) setStatus("unsupported");
        return;
      }
      const s = await getSubscriptionStatus();
      if (!cancelled) setStatus(s);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onEnable() {
    setBusy(true);
    setMsg(null);
    const res = await subscribeWebPush();
    setBusy(false);
    if (res.ok) {
      setStatus("subscribed");
      setMsg({ type: "ok", text: "✓ Đã bật thông báo trên trình duyệt này" });
    } else {
      const newStatus = await getSubscriptionStatus();
      setStatus(newStatus);
      setMsg({ type: "err", text: res.reason ?? "Không bật được" });
    }
  }

  async function onDisable() {
    setBusy(true);
    setMsg(null);
    await unsubscribeWebPush();
    setBusy(false);
    setStatus("default");
    setMsg({ type: "ok", text: "Đã tắt thông báo trên trình duyệt này" });
  }

  return (
    <div className="bg-white border border-ink-200/70 rounded-md shadow-soft p-5">
      <div className="text-xs font-semibold text-ink-500 mb-1.5 tracking-wide">
        THÔNG BÁO TRÊN TRÌNH DUYỆT
      </div>

      <p className="text-sm text-ink-700 mb-3 leading-relaxed">
        Bật để nhận thông báo về tin nhắn mới, đánh giá, đơn bump xong, từ khóa khớp...
        ngay trên màn hình ngay cả khi tab Trao Tay đang đóng.
      </p>

      {status === "loading" && (
        <div className="text-xs text-ink-500">Đang kiểm tra trạng thái...</div>
      )}

      {status === "unsupported" && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md px-3 py-2 text-xs leading-relaxed">
          ⚠️ Trình duyệt này không hỗ trợ thông báo Web Push.
          <br />
          <strong>Trên iPhone:</strong> mở Safari → vào traotay.com.vn → bấm nút Share →
          chọn "Add to Home Screen" → mở app từ icon Home Screen → quay lại đây bật.
        </div>
      )}

      {status === "denied" && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-3 py-2 text-xs leading-relaxed">
          🚫 Bạn đã chặn thông báo. Vào{" "}
          <strong>Cài đặt trình duyệt → Quyền cho traotay.com.vn → Notifications → Allow</strong>{" "}
          rồi reload trang.
        </div>
      )}

      {status === "default" && (
        <button
          onClick={onEnable}
          disabled={busy}
          className="bg-primary hover:bg-primary-dark text-white font-semibold px-5 py-2.5 rounded-md shadow-soft hover:shadow-card transition duration-150 ease-warm disabled:opacity-60"
        >
          {busy ? "Đang bật..." : "🔔 Bật thông báo"}
        </button>
      )}

      {status === "subscribed" && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 bg-primary-100 text-primary-800 px-3 py-1.5 rounded-full text-xs font-semibold">
            ✓ Đang bật
          </span>
          <button
            onClick={onDisable}
            disabled={busy}
            className="bg-ink-100 hover:bg-ink-200 text-ink-700 font-medium px-4 py-2 rounded-md text-sm transition duration-150 ease-warm disabled:opacity-60"
          >
            {busy ? "..." : "Tắt thông báo"}
          </button>
        </div>
      )}

      {msg && (
        <div
          className={`mt-3 text-sm rounded-md px-3 py-2 ${
            msg.type === "ok"
              ? "bg-primary-100 border border-primary-200 text-primary-800"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {msg.text}
        </div>
      )}
    </div>
  );
}
