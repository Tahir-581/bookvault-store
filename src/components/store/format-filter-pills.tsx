"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

const DEFAULT_PILLS = [
  { label: "Print Books", href: "/books?format=print" },
  { label: "Audible Audiobooks", href: "/books?format=audiobook" },
];

export function FormatFilterPills({
  title,
  pills = DEFAULT_PILLS,
  showClear = false,
}: {
  title?: string;
  pills?: { label: string; href: string }[];
  showClear?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentFormat = searchParams.get("format");
  const hasActive = Boolean(currentFormat);

  return (
    <section className="mb-4 py-1">
      <div className="flex items-center gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {title && (
          <span className="shrink-0 text-sm font-bold text-foreground">{title}</span>
        )}
        {showClear && hasActive && (
          <Link
            href={pathname.startsWith("/books") ? "/books" : pathname}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-foreground hover:bg-muted"
            aria-label="Clear filters"
          >
            <X className="h-4 w-4" />
          </Link>
        )}
        {pills.map((pill) => {
          const pillFormat = new URL(pill.href, "http://localhost").searchParams.get("format");
          const isActive =
            currentFormat === pillFormat ||
            (pill.href.includes("format=print") && currentFormat === "print");
          return (
            <Link
              key={pill.href}
              href={pill.href}
              className={`shrink-0 rounded-md border px-3 py-1.5 text-sm transition ${
                isActive
                  ? "border-2 border-foreground font-bold text-foreground"
                  : "border-border bg-card text-foreground hover:border-muted-foreground"
              }`}
            >
              {pill.label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
