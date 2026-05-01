"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

type Props = {
  latitude: number;
  longitude: number;
  title: string;
  height?: string;
};

/// Leaflet map nhỏ embed trên post detail. Dùng OSM tile (free, không cần API key).
/// Marker click → mở Google Maps trong tab mới (user navigate đến địa điểm).
export function PostMap({ latitude, longitude, title, height = "320px" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (latitude === 0 && longitude === 0) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      // Dynamic import để tránh SSR issue (Leaflet cần window)
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      // Marker icon mặc định Leaflet bị broken trong Next.js bundle → set manual
      const iconUrl =
        "data:image/svg+xml;base64," +
        btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42"><path fill="#10B981" stroke="#fff" stroke-width="2" d="M16 1c-8 0-14 6-14 13 0 9 14 27 14 27s14-18 14-27c0-7-6-13-14-13z"/><circle cx="16" cy="14" r="6" fill="#fff"/></svg>`);

      const customIcon = L.icon({
        iconUrl,
        iconSize: [32, 42],
        iconAnchor: [16, 42],
        popupAnchor: [0, -38],
      });

      // Tạo map
      const map = L.map(containerRef.current).setView([latitude, longitude], 15);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);
      marker.bindPopup(
        `<div style="font-family:sans-serif;font-size:13px;font-weight:600;color:#1A1A2E">${title}</div>
         <a href="https://www.google.com/maps?q=${latitude},${longitude}" target="_blank" rel="noopener" style="font-size:12px;color:#10B981">Mở Google Maps →</a>`
      );

      // Force resize sau mount (containerRef parent có thể chưa stable size)
      setTimeout(() => map.invalidateSize(), 100);

      cleanup = () => {
        map.remove();
        mapRef.current = null;
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [latitude, longitude, title]);

  if (latitude === 0 && longitude === 0) {
    return null; // Không có vị trí → ẩn map
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div ref={containerRef} style={{ height, width: "100%" }} />
    </div>
  );
}
