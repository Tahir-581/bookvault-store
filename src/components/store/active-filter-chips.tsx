"use client";

import { X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  buildSearchParams,
  clearFilterParams,
  formatPriceChipLabel,
  type CurrentFilters,
} from "@/lib/filter-params";

export type ActiveFilterChip = {
  id: string;
  label: string;
  clear: Record<string, null>;
};

export function getActiveFilterChips(
  filters: CurrentFilters,
  options?: { hideCategory?: boolean; categoryLabel?: string }
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  if (!options?.hideCategory && filters.category) {
    chips.push({
      id: "category",
      label: options?.categoryLabel || filters.category.replace(/-/g, " "),
      clear: { category: null },
    });
  }

  if (filters.minRating) {
    chips.push({
      id: "minRating",
      label: `${filters.minRating}+ stars`,
      clear: { minRating: null },
    });
  }

  const priceLabel = formatPriceChipLabel(filters.minPrice, filters.maxPrice);
  if (priceLabel) {
    chips.push({
      id: "price",
      label: priceLabel,
      clear: { minPrice: null, maxPrice: null },
    });
  }

  if (filters.onSale === "1") {
    chips.push({
      id: "onSale",
      label: "On sale",
      clear: { onSale: null },
    });
  }

  if (filters.language) {
    chips.push({
      id: "language",
      label: filters.language,
      clear: { language: null },
    });
  }

  if (filters.author) {
    chips.push({
      id: "author",
      label: filters.author,
      clear: { author: null },
    });
  }

  return chips;
}

export function ActiveFilterChips({
  currentFilters,
  categoryLabel,
  hideCategory = false,
  keepCategoryOnClear = false,
  className = "",
}: {
  currentFilters: CurrentFilters;
  categoryLabel?: string;
  hideCategory?: boolean;
  /** When clearing all on a category page, keep the category locked by route */
  keepCategoryOnClear?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chips = getActiveFilterChips(currentFilters, {
    hideCategory,
    categoryLabel,
  });

  if (chips.length === 0) return null;

  function removeChip(clear: Record<string, null>) {
    const params = buildSearchParams(searchParams, clear);
    router.push(`?${params.toString()}`);
  }

  function clearAll() {
    const params = clearFilterParams(searchParams, {
      keepCategory: keepCategoryOnClear,
      keepSort: true,
      keepQ: true,
    });
    router.push(`?${params.toString()}`);
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={() => removeChip(chip.clear)}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground hover:border-link hover:text-link"
          aria-label={`Remove filter ${chip.label}`}
        >
          <span className="max-w-[10rem] truncate">{chip.label}</span>
          <X className="h-3 w-3 shrink-0 text-muted-foreground" />
        </button>
      ))}
      <button
        type="button"
        onClick={clearAll}
        className="text-xs font-medium text-link hover:text-link-hover hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}
