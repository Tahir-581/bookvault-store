"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useRef } from "react";
import type { ReactNode } from "react";

export function ProductShelf({
  title,
  seeMoreHref,
  children,
}: {
  title: string;
  seeMoreHref?: string;
  children: ReactNode;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollNext() {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: el.clientWidth * 0.75, behavior: "smooth" });
  }

  return (
    <section className="mb-6 bg-white">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#0F1111]">{title}</h2>
        {seeMoreHref && (
          <Link
            href={seeMoreHref}
            className="text-sm text-[#007185] hover:text-[#C7511F] hover:underline"
          >
            See more &gt;
          </Link>
        )}
      </div>
      <div className="relative">
        <div
          ref={trackRef}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {children}
        </div>
        <button
          type="button"
          onClick={scrollNext}
          aria-label="Scroll right"
          className="absolute right-0 top-[40%] z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md hover:bg-gray-50"
        >
          <ChevronRight className="h-5 w-5 text-[#0F1111]" />
        </button>
      </div>
    </section>
  );
}
