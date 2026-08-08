/** URL keys that represent product listing filters (not sort/q/page). */
export const FILTER_PARAM_KEYS = [
  "category",
  "minRating",
  "minPrice",
  "maxPrice",
  "onSale",
  "language",
  "author",
] as const;

export type FilterParamKey = (typeof FILTER_PARAM_KEYS)[number];

export const PRICE_PRESETS = [
  { id: "under-500", label: "Under PKR 500", minPrice: undefined, maxPrice: 499 },
  { id: "500-1000", label: "PKR 500 – 1,000", minPrice: 500, maxPrice: 1000 },
  { id: "1000-2000", label: "PKR 1,000 – 2,000", minPrice: 1000, maxPrice: 2000 },
  { id: "2000-up", label: "PKR 2,000 & Above", minPrice: 2000, maxPrice: undefined },
] as const;

export type CurrentFilters = Record<string, string | undefined>;

export function parseOptionalNumber(value: string | undefined): number | undefined {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function matchPricePreset(
  minPrice: string | undefined,
  maxPrice: string | undefined
): (typeof PRICE_PRESETS)[number]["id"] | null {
  const min = parseOptionalNumber(minPrice);
  const max = parseOptionalNumber(maxPrice);
  for (const preset of PRICE_PRESETS) {
    if (preset.minPrice === min && preset.maxPrice === max) return preset.id;
  }
  return null;
}

export function countActiveFilters(filters: CurrentFilters, options?: { ignoreCategory?: boolean }): number {
  let count = 0;
  for (const key of FILTER_PARAM_KEYS) {
    if (options?.ignoreCategory && key === "category") continue;
    const value = filters[key];
    if (value != null && value !== "") count += 1;
  }
  // minPrice + maxPrice count as one "price" filter for badge UX
  const hasMin = Boolean(filters.minPrice);
  const hasMax = Boolean(filters.maxPrice);
  if (hasMin && hasMax) count -= 1;
  return count;
}

export function buildSearchParams(
  current: URLSearchParams | string,
  updates: Record<string, string | null | undefined>
): URLSearchParams {
  const params = new URLSearchParams(
    typeof current === "string" ? current : current.toString()
  );
  for (const [key, value] of Object.entries(updates)) {
    if (value == null || value === "") params.delete(key);
    else params.set(key, value);
  }
  params.delete("page");
  return params;
}

export function clearFilterParams(
  current: URLSearchParams | string,
  options?: { keepCategory?: boolean; keepSort?: boolean; keepQ?: boolean }
): URLSearchParams {
  const params = new URLSearchParams(
    typeof current === "string" ? current : current.toString()
  );
  for (const key of FILTER_PARAM_KEYS) {
    if (options?.keepCategory && key === "category") continue;
    params.delete(key);
  }
  if (!options?.keepSort) params.delete("sort");
  if (!options?.keepQ) {
    // keep search query by default when clearing product filters
  }
  params.delete("page");
  return params;
}

export function formatPriceChipLabel(
  minPrice: string | undefined,
  maxPrice: string | undefined
): string | null {
  const preset = matchPricePreset(minPrice, maxPrice);
  if (preset) {
    return PRICE_PRESETS.find((p) => p.id === preset)?.label ?? null;
  }
  const min = parseOptionalNumber(minPrice);
  const max = parseOptionalNumber(maxPrice);
  if (min == null && max == null) return null;
  if (min != null && max != null) return `PKR ${min.toLocaleString()} – ${max.toLocaleString()}`;
  if (min != null) return `PKR ${min.toLocaleString()}+`;
  return `Up to PKR ${max!.toLocaleString()}`;
}
