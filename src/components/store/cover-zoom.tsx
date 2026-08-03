"use client";

import { useEffect, useRef, useState } from "react";
import { CoverImage } from "@/components/store/cover-image";

const ZOOM = 2.5;
const LENS_SIZE = 140;

export function CoverZoom({
  src,
  alt,
  sizes,
  priority,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canZoom, setCanZoom] = useState(false);
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState({ x: 0.5, y: 0.5 });
  const [box, setBox] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const mq = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (min-width: 1024px)"
    );
    const sync = () => {
      setCanZoom(mq.matches);
      if (!mq.matches) setActive(false);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  function updateBox() {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setBox({ w: rect.width, h: rect.height });
  }

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!canZoom) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setPos({ x, y });
  }

  function handleEnter() {
    if (!canZoom) return;
    updateBox();
    setActive(true);
  }

  function handleLeave() {
    setActive(false);
  }

  const showZoom = canZoom && active && box.w > 0;
  const lensHalf = LENS_SIZE / 2;
  const lensLeft = Math.max(
    0,
    Math.min(box.w - LENS_SIZE, pos.x * box.w - lensHalf)
  );
  const lensTop = Math.max(
    0,
    Math.min(box.h - LENS_SIZE, pos.y * box.h - lensHalf)
  );

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className={`relative aspect-[2/3] max-h-[500px] bg-gray-50 ${
          canZoom ? "cursor-crosshair" : ""
        }`}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onMouseMove={handleMove}
      >
        <CoverImage
          src={src}
          alt={alt}
          sizes={sizes}
          className="object-contain p-4"
          priority={priority}
        />

        {showZoom && (
          <div
            aria-hidden
            className="pointer-events-none absolute z-10 border border-secondary/40 bg-accent/25"
            style={{
              width: LENS_SIZE,
              height: LENS_SIZE,
              left: lensLeft,
              top: lensTop,
            }}
          />
        )}
      </div>

      {showZoom && (
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-[calc(100%+1rem)] z-30 overflow-hidden rounded-sm border border-border bg-card shadow-lg"
          style={{
            width: box.w,
            height: box.h,
            backgroundImage: `url("${src.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}")`,
            backgroundRepeat: "no-repeat",
            backgroundSize: `${ZOOM * 100}%`,
            backgroundPosition: `${pos.x * 100}% ${pos.y * 100}%`,
          }}
        />
      )}
    </div>
  );
}
