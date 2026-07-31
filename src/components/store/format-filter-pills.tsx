"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const DEFAULT_PILLS = [
  { label: "Kindle eBooks", href: "/books?format=ebook" },
  { label: "Print Books", href: "/books?format=print" },
  { label: "Audible Audiobooks", href: "/books?format=audiobook" },
];

export function FormatFilterPills({
  title = "Filter by",
  pills = DEFAULT_PILLS,
}: {
  title?: string;
  pills?: { label: string; href: string }[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentFormat = searchParams.get("format");

  return (
    <section className="mb-6 py-2">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-bold text-[#0F1111]">{title}</span>
        {pills.map((pill) => {
          const pillFormat = new URL(pill.href, "http://localhost").searchParams.get("format");
          const isActive =
            pathname === "/" && !currentFormat && pill.label === "Kindle eBooks"
              ? false
              : currentFormat === pillFormat ||
                (pill.href.includes("format=print") && currentFormat === "print");
          return (
            <Link
              key={pill.href}
              href={pill.href}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${
                isActive
                  ? "border-[#007185] bg-[#007185] text-white"
                  : "border-gray-300 bg-white text-[#0F1111] hover:border-gray-400"
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
