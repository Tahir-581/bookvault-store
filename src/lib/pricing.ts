export type SaleFormatFields = {
  price: number;
  compare_at_price?: number | null;
  on_sale?: boolean | null;
  sale_percent?: number | null;
  sale_starts_at?: string | null;
  sale_ends_at?: string | null;
};

export type EffectivePrice = {
  /** Price shown to the customer (sale price when active, else regular) */
  displayPrice: number;
  /** Regular / list price used for strikethrough when on sale */
  compareAt: number | null;
  /** Whether a sale discount is currently active */
  onSale: boolean;
  /** Discount percent when on sale */
  salePercent: number | null;
  /** Sale end timestamp if set (for countdown) */
  saleEndsAt: string | null;
};

function isWithinSaleWindow(
  startsAt: string | null | undefined,
  endsAt: string | null | undefined,
  now: Date
): boolean {
  if (startsAt) {
    const start = new Date(startsAt);
    if (!Number.isNaN(start.getTime()) && start.getTime() > now.getTime()) {
      return false;
    }
  }
  if (endsAt) {
    const end = new Date(endsAt);
    if (!Number.isNaN(end.getTime()) && end.getTime() < now.getTime()) {
      return false;
    }
  }
  return true;
}

/** Round to whole PKR (store currency has no decimals). */
export function salePriceFromPercent(regularPrice: number, percent: number): number {
  return Math.max(0, Math.round(regularPrice * (1 - percent / 100)));
}

/**
 * Resolve the customer-facing price for a format row.
 * When on_sale + percent and within optional date window:
 * displayPrice = round(regular * (1 - percent/100)), compareAt = regular.
 */
export function getEffectivePrice(
  format: SaleFormatFields | null | undefined,
  now: Date = new Date()
): EffectivePrice {
  if (!format) {
    return {
      displayPrice: 0,
      compareAt: null,
      onSale: false,
      salePercent: null,
      saleEndsAt: null,
    };
  }

  const regular = Number(format.price) || 0;
  const percent = format.sale_percent != null ? Number(format.sale_percent) : null;
  const saleActive =
    Boolean(format.on_sale) &&
    percent != null &&
    percent >= 1 &&
    percent <= 99 &&
    isWithinSaleWindow(format.sale_starts_at, format.sale_ends_at, now);

  if (saleActive && percent != null) {
    return {
      displayPrice: salePriceFromPercent(regular, percent),
      compareAt: regular,
      onSale: true,
      salePercent: percent,
      saleEndsAt: format.sale_ends_at ?? null,
    };
  }

  const compareAt =
    format.compare_at_price != null && Number(format.compare_at_price) > regular
      ? Number(format.compare_at_price)
      : null;

  return {
    displayPrice: regular,
    compareAt,
    onSale: false,
    salePercent: null,
    saleEndsAt: null,
  };
}
