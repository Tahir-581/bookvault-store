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
    <section className="mb-8 min-w-0 max-w-full">
      <h2 className="mb-3 text-xl font-bold text-foreground">{title}</h2>
      <div className="relative min-w-0 max-w-full">
        <div
          ref={trackRef}
          className="flex items-start gap-3 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {children}
        </div>
        <button
          type="button"
          onClick={scrollNext}
          aria-label="Scroll right"
          className="absolute right-0 top-[35%] z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-md hover:bg-muted sm:flex"
        >
          <ChevronRight className="h-5 w-5 text-foreground" />
        </button>
      </div>
      {seeMoreHref && (
        <Link
          href={seeMoreHref}
          className="mt-2 inline-flex items-center gap-0.5 text-sm text-link hover:text-link-hover hover:underline"
        >
          See more
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </section>
  );
}
