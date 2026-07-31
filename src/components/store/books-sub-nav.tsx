"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { NavMenuItem } from "@/lib/types";

export function BooksSubNav({
  items,
  deptLabel = "books",
}: {
  items: NavMenuItem[];
  deptLabel?: string;
}) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-[1500px] items-center gap-1 px-4 py-2">
        <Link
          href="/"
          className="mr-4 shrink-0 text-2xl font-bold lowercase text-[#0F1111]"
        >
          {deptLabel}
        </Link>
        {items.map((item) => {
          const key = item.href + item.label;
          const hasChildren = item.children && item.children.length > 0;
          return (
            <div key={key} className="relative">
              {hasChildren ? (
                <>
                  <button
                    type="button"
                    onClick={() => setOpenKey(openKey === key ? null : key)}
                    onMouseEnter={() => setOpenKey(key)}
                    className="flex items-center gap-0.5 px-2 py-1 text-sm text-[#0F1111] hover:text-[#C7511F]"
                  >
                    {item.label}
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  {openKey === key && (
                    <div
                      className="absolute left-0 top-full z-50 min-w-[200px] rounded border border-gray-200 bg-white py-1 shadow-lg"
                      onMouseLeave={() => setOpenKey(null)}
                    >
                      {item.children!.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block px-4 py-2 text-sm text-[#0F1111] hover:bg-gray-100"
                          onClick={() => setOpenKey(null)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  className="px-2 py-1 text-sm text-[#0F1111] hover:text-[#C7511F]"
                >
                  {item.label}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
