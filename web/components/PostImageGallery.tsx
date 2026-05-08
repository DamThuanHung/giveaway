"use client";

import { useState } from "react";

export function PostImageGallery({
  images,
  imageUrl,
  title,
}: {
  images: string[];
  imageUrl: string | null | undefined;
  title: string;
}) {
  const list = images && images.length > 0
    ? images
    : (imageUrl ? [imageUrl] : []);
  const [active, setActive] = useState(0);
  const main = list[active];

  return (
    <>
      <div className="bg-white border border-ink-200/70 rounded-md shadow-soft overflow-hidden mb-3">
        {main ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={main}
            src={main}
            alt={title}
            className="w-full aspect-square object-cover"
          />
        ) : (
          <div className="aspect-square flex items-center justify-center text-7xl text-ink-300 bg-cream-100">
            📦
          </div>
        )}
      </div>

      {list.length > 1 && (
        <div className="grid grid-cols-4 gap-2 mb-6">
          {list.slice(0, 8).map((img, i) => {
            const isActive = i === active;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Xem ảnh ${i + 1}`}
                aria-pressed={isActive}
                className={`block w-full aspect-square overflow-hidden rounded-md border-2 transition duration-150 ease-warm focus:outline-none focus:ring-2 focus:ring-primary-200 ${
                  isActive
                    ? "border-primary-600 shadow-soft"
                    : "border-ink-200/70 hover:border-primary/60"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt={`${title} ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
