/* Service Worker — Web Push notification cho Trao Tay */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data?.json() ?? {};
  } catch (_) {
    payload = { title: "Trao Tay", body: event.data?.text() ?? "" };
  }
  const { title, body, icon, data } = payload;
  if (!title) return;

  event.waitUntil(
    self.registration.showNotification(title, {
      body: body ?? "",
      icon: icon ?? "/assets/icon_512.png",
      badge: "/assets/icon_512.png",
      data: data ?? {},
      tag: data?.notificationId ?? String(Date.now()),
      vibrate: [100, 50, 100],
      requireInteraction: false,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/notifications/";
  const fullUrl = new URL(url, self.location.origin).toString();

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        // Tìm tab Trao Tay đang mở → focus + navigate
        for (const c of list) {
          if (c.url.startsWith(self.location.origin) && "focus" in c) {
            c.navigate(fullUrl).catch(() => {});
            return c.focus();
          }
        }
        // Không có tab → mở mới
        return self.clients.openWindow(fullUrl);
      }),
  );
});
