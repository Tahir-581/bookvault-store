"use client";

import { SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BottomSheet } from "@/components/store/bottom-sheet";
import { FilterSidebar } from "@/components/store/filter-sidebar";
import { FormatFilterPills } from "@/components/store/format-filter-pills";
import type { Category } from "@/lib/types";

export function BooksMobileFilters({
  categories,
  currentFilters,
}: {
  categories: Category[];
  currentFilters: Record<string, string | undefined>;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramsKey = searchParams.toString();

  useEffect(() => {
    setOpen(false);
  }, [paramsKey]);

  function handleSort(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("sort", value);
    else params.delete("sort");
    params.delete("page");
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="mb-3 lg:hidden">
      <FormatFilterPills showClear />
      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-foreground"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </button>
        <select
          value={currentFilters.sort || ""}
          onChange={(e) => handleSort(e.target.value)}
          className="rounded-md border border-border bg-card px-2 py-1.5 text-sm text-foreground"
          aria-label="Sort results"
        >
          <option value="">Featured</option>
          <option value="bestseller">Best Sellers</option>
          <option value="newest">Newest Arrivals</option>
          <option value="rating">Avg. Customer Review</option>
        </select>
      </div>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Filters">
        <div className="px-4 py-4">
          <FilterSidebar categories={categories} currentFilters={currentFilters} />
        </div>
      </BottomSheet>
    </div>
  );
}

export function BooksSortSelect({
  currentSort,
}: {
  currentSort?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSort(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("sort", value);
    else params.delete("sort");
    params.delete("page");
    router.push(`?${params.toString()}`);
  }

  return (
    <select
      value={currentSort || ""}
      onChange={(e) => handleSort(e.target.value)}
      className="rounded border border-border bg-card px-3 py-1 text-sm text-foreground"
      aria-label="Sort results"
    >
      <option value="">Featured</option>
      <option value="bestseller">Best Sellers</option>
      <option value="newest">Newest Arrivals</option>
      <option value="rating">Avg. Customer Review</option>
    </select>
  );
}
