"use client";

import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { BottomSheet } from "@/components/store/bottom-sheet";
import type { NavMenuItem } from "@/lib/types";

export function BooksSubNav({
  items,
  deptLabel = "books",
}: {
  items: NavMenuItem[];
  deptLabel?: string;
}) {
  const [sheetItem, setSheetItem] = useState<NavMenuItem | null>(null);

  return (
    <>
      <nav className="max-w-full overflow-x-hidden border-b border-border bg-card">
        <div className="mx-auto flex min-w-0 max-w-[1500px] items-center gap-1 overflow-x-auto px-4 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link
            href="/"
            className="mr-3 shrink-0 whitespace-nowrap font-serif text-2xl font-bold lowercase text-foreground"
          >
            {deptLabel}
          </Link>
          {items.map((item) => {
            const key = item.href + item.label;
            const hasChildren = item.children && item.children.length > 0;
            return (
              <div key={key} className="relative shrink-0">
                {hasChildren ? (
                  <button
                    type="button"
                    onClick={() => setSheetItem(item)}
                    className="flex items-center gap-0.5 whitespace-nowrap px-2 py-1 text-sm text-foreground hover:text-link"
                  >
                    {item.label}
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className="whitespace-nowrap px-2 py-1 text-sm text-foreground hover:text-link"
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      <BottomSheet
        open={Boolean(sheetItem)}
        onClose={() => setSheetItem(null)}
        title={sheetItem?.label === "Categories" || sheetItem?.label === "By Category" ? "Categories" : sheetItem?.label || "Menu"}
      >
        {sheetItem?.children?.map((child) => (
          <Link
            key={child.href + child.label}
            href={child.href}
            onClick={() => setSheetItem(null)}
            className="flex items-center justify-between border-b border-border px-4 py-3.5 text-base text-foreground hover:bg-muted"
          >
            {child.label}
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
        {sheetItem && (
          <Link
            href={sheetItem.href}
            onClick={() => setSheetItem(null)}
            className="flex items-center gap-1 px-4 py-3.5 text-base text-link hover:underline"
          >
            See all
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </BottomSheet>
    </>
  );
}
