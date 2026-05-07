/// Web Push helper — subscribe / unsubscribe / status check.
///
/// Khác FCM (mobile) — Web Push dùng VAPID + browser Push API. Hỗ trợ:
/// - Chrome / Edge / Firefox desktop + Android
/// - Safari macOS từ 16+
/// - Safari iOS 16.4+ NHƯNG CHỈ khi user đã "Add to Home Screen" (PWA)
///
/// Backend ký push qua VAPID_PRIVATE_KEY, frontend cần VAPID_PUBLIC_KEY (lấy
/// từ /web-push/vapid-key endpoint).
import { API_BASE, authFetch } from "./auth";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = typeof window !== "undefined" ? window.atob(base64) : "";
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
  return arr;
}

export function isWebPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function getPushPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

/// Trạng thái subscribe hiện tại.
/// - `unsupported`: trình duyệt không hỗ trợ (vd Safari iOS chưa add Home Screen)
/// - `denied`: user đã block notification permission
/// - `subscribed`: có active subscription trong PushManager
/// - `default`: chưa subscribe (chưa hỏi hoặc default)
export async function getSubscriptionStatus(): Promise<
  "unsupported" | "denied" | "subscribed" | "default"
> {
  if (!isWebPushSupported()) return "unsupported";

  const perm = getPushPermission();
  if (perm === "denied") return "denied";

  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return "default";
    const sub = await reg.pushManager.getSubscription();
    return sub ? "subscribed" : "default";
  } catch {
    return "default";
  }
}

export async function subscribeWebPush(): Promise<{
  ok: boolean;
  reason?: string;
}> {
  if (!isWebPushSupported()) {
    return {
      ok: false,
      reason:
        "Trình duyệt này không hỗ trợ thông báo. Trên iPhone, hãy thêm Trao Tay vào màn hình chính (Add to Home Screen) trước.",
    };
  }

  // Đăng ký service worker
  let reg: ServiceWorkerRegistration;
  try {
    reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
  } catch (e: any) {
    return { ok: false, reason: `Không đăng ký được service worker: ${e?.message ?? e}` };
  }

  // Xin permission
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return {
      ok: false,
      reason:
        permission === "denied"
          ? "Bạn đã từ chối quyền nhận thông báo. Vào Cài đặt trình duyệt để bật lại."
          : "Bạn chưa cho phép nhận thông báo.",
    };
  }

  // Lấy VAPID public key
  let publicKey = "";
  try {
    const vapidRes = await fetch(`${API_BASE}/web-push/vapid-key`);
    const json = await vapidRes.json();
    publicKey = json.publicKey ?? "";
  } catch (e: any) {
    return { ok: false, reason: `Không lấy được VAPID key: ${e?.message ?? e}` };
  }
  if (!publicKey) {
    return { ok: false, reason: "Server chưa cấu hình Web Push (VAPID key trống)" };
  }

  // Subscribe push
  let sub: PushSubscription;
  try {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      // Cast tránh TS strict: Uint8Array<ArrayBufferLike> không match BufferSource
      applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource,
    });
  } catch (e: any) {
    return { ok: false, reason: `Subscribe thất bại: ${e?.message ?? e}` };
  }

  // Lưu lên backend
  const subJson = sub.toJSON();
  const res = await authFetch("/web-push/subscribe", {
    method: "POST",
    body: JSON.stringify({
      endpoint: sub.endpoint,
      keys: subJson.keys,
      userAgent: navigator.userAgent,
    }),
  });
  if (!res.ok) {
    // Rollback browser subscription nếu backend reject
    await sub.unsubscribe().catch(() => {});
    return { ok: false, reason: `Server reject subscription: HTTP ${res.status}` };
  }
  return { ok: true };
}

export async function unsubscribeWebPush(): Promise<boolean> {
  if (!isWebPushSupported()) return true;

  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return true;

  const sub = await reg.pushManager.getSubscription();
  if (!sub) return true;

  // Báo backend trước (best effort), rồi unsubscribe browser
  await authFetch("/web-push/subscribe", {
    method: "DELETE",
    body: JSON.stringify({ endpoint: sub.endpoint }),
  }).catch(() => {});

  await sub.unsubscribe().catch(() => {});
  return true;
}
