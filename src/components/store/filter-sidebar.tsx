"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ActiveFilterChips } from "@/components/store/active-filter-chips";
import { StarRating } from "@/components/store/star-rating";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PRICE_PRESETS,
  buildSearchParams,
  clearFilterParams,
  matchPricePreset,
  type CurrentFilters,
} from "@/lib/filter-params";
import type { FilterFacets } from "@/lib/data/books";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

const AUTHOR_PREVIEW = 12;

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-border pb-5 last:border-b-0 last:pb-0">
      <h3 className="mb-3 text-sm font-bold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

export function FilterSidebar({
  categories,
  currentFilters,
  facets,
  lockedCategory = false,
  showActiveChips = true,
}: {
  categories: Category[];
  currentFilters: CurrentFilters;
  facets: FilterFacets;
  /** Category is fixed by the route (`/categories/[slug]`) */
  lockedCategory?: boolean;
  showActiveChips?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [authorQuery, setAuthorQuery] = useState("");
  const [authorsExpanded, setAuthorsExpanded] = useState(false);

  const selectedPreset = matchPricePreset(
    currentFilters.minPrice,
    currentFilters.maxPrice
  );
  const selectedRating = currentFilters.minRating
    ? Number(currentFilters.minRating)
    : null;

  const filteredAuthors = useMemo(() => {
    const q = authorQuery.trim().toLowerCase();
    const list = q
      ? facets.authors.filter((a) => a.toLowerCase().includes(q))
      : facets.authors;
    return list;
  }, [authorQuery, facets.authors]);

  const visibleAuthors = authorsExpanded
    ? filteredAuthors
    : filteredAuthors.slice(0, AUTHOR_PREVIEW);

  function updateFilters(updates: Record<string, string | null | undefined>) {
    const params = buildSearchParams(searchParams, updates);
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

  function goAllBooks() {
    if (lockedCategory || pathname.startsWith("/categories/")) {
      const params = clearFilterParams(searchParams, {
        keepSort: true,
        keepQ: true,
      });
      params.delete("category");
      const qs = params.toString();
      router.push(qs ? `/books?${qs}` : "/books");
      return;
    }
    updateFilters({ category: null });
  }

  function selectCategory(slug: string) {
    if (pathname.startsWith("/categories/")) {
      const params = buildSearchParams(searchParams, { category: null });
      const qs = params.toString();
      router.push(qs ? `/categories/${slug}?${qs}` : `/categories/${slug}`);
      return;
    }
    updateFilters({ category: slug });
  }

  function applyPricePreset(preset: (typeof PRICE_PRESETS)[number]) {
    if (selectedPreset === preset.id) {
      updateFilters({ minPrice: null, maxPrice: null });
      return;
    }
    updateFilters({
      minPrice: preset.minPrice != null ? String(preset.minPrice) : null,
      maxPrice: preset.maxPrice != null ? String(preset.maxPrice) : null,
    });
  }

  function applyCustomPrice(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const min = String(fd.get("minPrice") || "").trim();
    const max = String(fd.get("maxPrice") || "").trim();
    updateFilters({
      minPrice: min || null,
      maxPrice: max || null,
    });
  }

  const categoryName =
    categories.find((c) => c.slug === currentFilters.category)?.name ||
    currentFilters.category;

  return (
    <aside className="w-full shrink-0 space-y-5 lg:w-60">
      {showActiveChips && (
        <ActiveFilterChips
          currentFilters={currentFilters}
          categoryLabel={categoryName}
          hideCategory={lockedCategory}
          keepCategoryOnClear={lockedCategory}
        />
      )}

      <FilterSection title="Category">
        <ul className="space-y-1.5 text-sm">
          <li>
            <button
              type="button"
              onClick={goAllBooks}
              className={cn(
                "text-left hover:text-link-hover hover:underline",
                !currentFilters.category
                  ? "font-bold text-link-hover"
                  : "text-link"
              )}
            >
              All Books
            </button>
          </li>
          {categories.map((cat) => {
            const selected = currentFilters.category === cat.slug;
            return (
              <li key={cat.id}>
                <button
                  type="button"
                  onClick={() => selectCategory(cat.slug)}
                  className={cn(
                    "text-left hover:text-link-hover hover:underline",
                    selected ? "font-bold text-link-hover" : "text-link"
                  )}
                >
                  {cat.name}
                </button>
              </li>
            );
          })}
        </ul>
      </FilterSection>

      <FilterSection title="Customer Reviews">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => updateFilters({ minRating: null })}
            className={cn(
              "block w-full rounded px-1 py-1 text-left text-sm hover:bg-muted",
              selectedRating == null
                ? "font-bold text-link-hover"
                : "text-link"
            )}
          >
            Any rating
          </button>
          {[4, 3, 2, 1].map((r) => {
            const selected = selectedRating === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() =>
                  updateFilters({
                    minRating: selected ? null : String(r),
                  })
                }
                className={cn(
                  "flex w-full items-center gap-2 rounded px-1 py-1.5 text-left text-sm hover:bg-muted",
                  selected && "bg-muted font-semibold"
                )}
                aria-pressed={selected}
              >
                <StarRating rating={r} showCount={false} size="sm" />
                <span className={selected ? "text-foreground" : "text-link"}>
                  & Up
                </span>
              </button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection title="Price">
        <ul className="mb-3 space-y-1.5 text-sm">
          {PRICE_PRESETS.map((preset) => {
            const selected = selectedPreset === preset.id;
            return (
              <li key={preset.id}>
                <button
                  type="button"
                  onClick={() => applyPricePreset(preset)}
                  className={cn(
                    "text-left hover:text-link-hover hover:underline",
                    selected ? "font-bold text-link-hover" : "text-link"
                  )}
                  aria-pressed={selected}
                >
                  {preset.label}
                </button>
              </li>
            );
          })}
        </ul>
        <form
          key={`${currentFilters.minPrice || ""}-${currentFilters.maxPrice || ""}`}
          className="space-y-2"
          onSubmit={applyCustomPrice}
        >
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <Label htmlFor="filter-min-price" className="text-xs text-muted-foreground">
                Min
              </Label>
              <Input
                id="filter-min-price"
                name="minPrice"
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="PKR"
                defaultValue={currentFilters.minPrice || ""}
                className="h-8"
              />
            </div>
            <span className="pb-2 text-muted-foreground">–</span>
            <div className="min-w-0 flex-1">
              <Label htmlFor="filter-max-price" className="text-xs text-muted-foreground">
                Max
              </Label>
              <Input
                id="filter-max-price"
                name="maxPrice"
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="PKR"
                defaultValue={currentFilters.maxPrice || ""}
                className="h-8"
              />
            </div>
            <Button type="submit" size="sm" className="h-8 shrink-0 px-3">
              Go
            </Button>
          </div>
        </form>
      </FilterSection>

      <FilterSection title="Deals">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border accent-[var(--link)]"
            checked={currentFilters.onSale === "1"}
            onChange={(e) =>
              updateFilters({ onSale: e.target.checked ? "1" : null })
            }
          />
          On sale
        </label>
      </FilterSection>

      {facets.languages.length > 0 && (
        <FilterSection title="Language">
          <ul className="space-y-1.5 text-sm">
            <li>
              <button
                type="button"
                onClick={() => updateFilters({ language: null })}
                className={cn(
                  "text-left hover:text-link-hover hover:underline",
                  !currentFilters.language
                    ? "font-bold text-link-hover"
                    : "text-link"
                )}
              >
                Any language
              </button>
            </li>
            {facets.languages.map((lang) => {
              const selected = currentFilters.language === lang;
              return (
                <li key={lang}>
                  <button
                    type="button"
                    onClick={() =>
                      updateFilters({ language: selected ? null : lang })
                    }
                    className={cn(
                      "text-left hover:text-link-hover hover:underline",
                      selected ? "font-bold text-link-hover" : "text-link"
                    )}
                  >
                    {lang}
                  </button>
                </li>
              );
            })}
          </ul>
        </FilterSection>
      )}

      {facets.authors.length > 0 && (
        <FilterSection title="Author">
          <Input
            type="search"
            value={authorQuery}
            onChange={(e) => {
              setAuthorQuery(e.target.value);
              setAuthorsExpanded(false);
            }}
            placeholder="Search authors"
            className="mb-2 h-8"
            aria-label="Search authors"
          />
          <ul className="max-h-64 space-y-1.5 overflow-y-auto text-sm">
            <li>
              <button
                type="button"
                onClick={() => updateFilters({ author: null })}
                className={cn(
                  "text-left hover:text-link-hover hover:underline",
                  !currentFilters.author
                    ? "font-bold text-link-hover"
                    : "text-link"
                )}
              >
                Any author
              </button>
            </li>
            {visibleAuthors.map((author) => {
              const selected = currentFilters.author === author;
              return (
                <li key={author}>
                  <button
                    type="button"
                    onClick={() =>
                      updateFilters({ author: selected ? null : author })
                    }
                    className={cn(
                      "text-left hover:text-link-hover hover:underline",
                      selected ? "font-bold text-link-hover" : "text-link"
                    )}
                  >
                    {author}
                  </button>
                </li>
              );
            })}
            {filteredAuthors.length === 0 && (
              <li className="text-muted-foreground">No authors match</li>
            )}
          </ul>
          {!authorsExpanded && filteredAuthors.length > AUTHOR_PREVIEW && (
            <button
              type="button"
              onClick={() => setAuthorsExpanded(true)}
              className="mt-2 text-sm text-link hover:text-link-hover hover:underline"
            >
              Show more ({filteredAuthors.length - AUTHOR_PREVIEW})
            </button>
          )}
        </FilterSection>
      )}

      <button
        type="button"
        onClick={clearAll}
        className="text-sm font-medium text-link hover:text-link-hover hover:underline lg:hidden"
      >
        Clear all filters
      </button>
    </aside>
  );
}
