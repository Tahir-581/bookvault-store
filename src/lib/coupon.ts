export type CouponDiscountKind = "percent" | "fixed" | "free_shipping";

export function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase();
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function computeCouponDiscount(
  subtotal: number,
  kind: CouponDiscountKind | string,
  value: number
) {
  if (subtotal <= 0 || value <= 0) return 0;
  const raw = kind === "percent" ? (subtotal * value) / 100 : value;
  return Math.min(Math.round(raw * 100) / 100, subtotal);
}

export function computeOrderTotals(
  subtotal: number,
  options: {
    discountTotal?: number;
    shippingFee?: number;
    taxRate?: number;
    freeShipping?: boolean;
  } = {}
) {
  const {
    discountTotal = 0,
    shippingFee = 3.99,
    taxRate = 0.2,
    freeShipping = false,
  } = options;

  const discount = Math.min(Math.max(discountTotal, 0), subtotal);
  const taxable = Math.max(subtotal - discount, 0);
  const tax = Math.round(taxable * taxRate * 100) / 100;
  const shipping = freeShipping ? 0 : shippingFee;
  const grandTotal = Math.round((taxable + shipping + tax) * 100) / 100;

  return { discountTotal: discount, shippingFee: shipping, tax, grandTotal };
}

export function isCouponInWindow(
  startsAt: string | null,
  endsAt: string | null,
  now = new Date()
) {
  if (startsAt && new Date(startsAt) > now) return false;
  if (endsAt && new Date(endsAt) < now) return false;
  return true;
}
