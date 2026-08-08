"use client";

import { SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ActiveFilterChips } from "@/components/store/active-filter-chips";
import { BottomSheet } from "@/components/store/bottom-sheet";
import { FilterSidebar } from "@/components/store/filter-sidebar";
import { Button } from "@/components/ui/button";
import {
  buildSearchParams,
  clearFilterParams,
  countActiveFilters,
  type CurrentFilters,
} from "@/lib/filter-params";
import type { FilterFacets } from "@/lib/data/books";
import type { Category } from "@/lib/types";

export const SORT_OPTIONS = [
  { value: "", label: "Featured" },
  { value: "bestseller", label: "Best Sellers" },
  { value: "newest", label: "Newest Arrivals" },
  { value: "rating", label: "Avg. Customer Review" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
] as const;

export function BooksMobileFilters({
  categories,
  currentFilters,
  facets,
  lockedCategory = false,
}: {
  categories: Category[];
  currentFilters: CurrentFilters;
  facets: FilterFacets;
  lockedCategory?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const paramsKey = searchParams.toString();
  const activeCount = countActiveFilters(currentFilters, {
    ignoreCategory: lockedCategory,
  });

  const categoryName =
    categories.find((c) => c.slug === currentFilters.category)?.name ||
    currentFilters.category;

  useEffect(() => {
    setOpen(false);
  }, [paramsKey]);

  function handleSort(value: string) {
    const params = buildSearchParams(searchParams, {
      sort: value || null,
    });
    router.push(`?${params.toString()}`);
  }

  function clearAll() {
    if (lockedCategory) {
      const params = clearFilterParams(searchParams, {
        keepCategory: true,
        keepSort: true,
        keepQ: true,
      });
      router.push(`?${params.toString()}`);
      return;
    }
    const params = clearFilterParams(searchParams, {
      keepSort: true,
      keepQ: true,
    });
    const qs = params.toString();
    if (pathname.startsWith("/categories/")) {
      router.push(qs ? `/books?${qs}` : "/books");
      return;
    }
    router.push(`?${qs}`);
  }

  return (
    <div className="mb-3 lg:hidden">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--link)] px-1.5 text-[11px] font-semibold text-white">
              {activeCount}
            </span>
          )}
        </button>
        <select
          value={currentFilters.sort || ""}
          onChange={(e) => handleSort(e.target.value)}
          className="rounded-md border border-border bg-card px-2 py-1.5 text-sm text-foreground"
          aria-label="Sort results"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value || "featured"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <ActiveFilterChips
        currentFilters={currentFilters}
        categoryLabel={categoryName}
        hideCategory={lockedCategory}
        keepCategoryOnClear={lockedCategory}
        className="mt-3"
      />

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Filters"
        footer={
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={clearAll}
            >
              Clear all
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Show results
            </Button>
          </div>
        }
      >
        <div className="px-4 py-4">
          <FilterSidebar
            categories={categories}
            currentFilters={currentFilters}
            facets={facets}
            lockedCategory={lockedCategory}
            showActiveChips={false}
          />
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
    const params = buildSearchParams(searchParams, {
      sort: value || null,
    });
    router.push(`?${params.toString()}`);
  }

  return (
    <select
      value={currentSort || ""}
      onChange={(e) => handleSort(e.target.value)}
      className="rounded border border-border bg-card px-3 py-1 text-sm text-foreground"
      aria-label="Sort results"
    >
      {SORT_OPTIONS.map((opt) => (
        <option key={opt.value || "featured"} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
